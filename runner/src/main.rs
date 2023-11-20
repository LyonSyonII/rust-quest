use serde::{Deserialize, Serialize};
use warp::{
    http,
    reject::{Reject, Rejection},
    Filter,
};

mod run;
use crate::run::run;

#[derive(Deserialize)]
struct Input {
    code: String,
}

#[derive(Debug, Serialize)]
enum Error {
    NotAuthorized,
    BodyNotCorrect,
}
impl Reject for Error {}

/*
curl --request POST \
  --url http://localhost:3030/evaluate.json \
  --header 'Content-Type: application/json' \
  --header 'authorization: potato' \
  --data '{
    "code": "fn main() { println!(\"Hello, World!\") } "
}'
*/

#[tokio::main]
async fn main() -> Result<(), &'static str> {
    console_subscriber::init();

    let Ok(password) = std::env::var("PASSWORD") else {
        return Err("Defining a PASSWORD environment variable is required. Please, call this program with PASSWORD=<your_password>.");
    };
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3030);
    let semaphore_permits = std::env::var("SEMAPHORE_PERMITS")
        .ok()
        .and_then(|s| s.parse::<u8>().ok())
        .unwrap_or(20);
    let semaphore_wait = std::env::var("SEMAPHORE_WAIT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(500);
    let kill_timeout = std::env::var("KILL_TIMEOUT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(500);
    
    // Necessary for passing it into `auth`
    let password: &'static str = password.leak();
    let semaphore: &'static tokio::sync::Semaphore = Box::leak(Box::new(tokio::sync::Semaphore::new(semaphore_permits as usize)));
    let cors = warp::cors().allow_origin("https://garriga.dev");

    let route = warp::post().and(warp::path("evaluate.json"));
    let auth = warp::header::header("authorization")
        .and_then(move |auth: String| async move {
            if auth == password {
                Ok(())
            } else {
                Err(warp::reject::custom(Error::NotAuthorized))
            }
        })
        .untuple_one();
    let process_input = warp::body::content_length_limit(512)
        .and(warp::body::json())
        .or_else(|_| async move { Err(warp::reject::custom(Error::BodyNotCorrect)) });
    let run_input = move |i: Input| run(i.code, semaphore, semaphore_wait, kill_timeout);

    let filter = route
        .and(auth)
        .and(process_input)
        .and_then(run_input)
        .recover(handle_rejection)
        .with(cors);

    println!("Semaphore permits: {semaphore_permits}");
    println!("Semaphore wait: {semaphore_wait}");
    println!("Kill timeout: {kill_timeout}");
    println!("Listening on http://0.0.0.0:{}", port);
    warp::serve(filter).run(([0, 0, 0, 0], port)).await;

    Ok(())
}

async fn handle_rejection(
    err: Rejection,
) -> std::result::Result<impl warp::Reply, warp::Rejection> {
    let code = match err.find() {
        Some(Error::NotAuthorized) => http::StatusCode::UNAUTHORIZED,
        Some(Error::BodyNotCorrect) => http::StatusCode::UNPROCESSABLE_ENTITY,
        None => http::StatusCode::BAD_REQUEST,
    };

    Ok(warp::reply::with_status(warp::reply(), code))
}
