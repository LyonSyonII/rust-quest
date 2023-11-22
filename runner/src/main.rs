use serde::{Deserialize, Serialize};
use warp::{
    http,
    reject::{Reject, Rejection},
    Filter,
};

mod run;
use crate::run::run;

#[derive(Deserialize, Debug)]
#[serde(default)]
struct Config {
    #[serde(alias = "auth")]
    authorization: String,
    port: u16,
    semaphore_permits: u8,
    semaphore_wait: u16,
    kill_timeout: u16,
    origins_whitelist: Vec<String>,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            authorization: String::new(),
            port: 3030,
            semaphore_permits: 5,
            semaphore_wait: 500,
            kill_timeout: 500,
            origins_whitelist: Vec::new(),
        }
    }
}

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
impl Error {
    fn not_authorized() -> Rejection {
        warp::reject::custom(Self::NotAuthorized)
    }
    fn body_not_correct() -> Rejection {
        warp::reject::custom(Self::BodyNotCorrect)
    }
}

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

    let config = match envy::from_env() {
        Ok(config) => config,
        Err(e) => panic!("{e}"),
    };
    println!("{config:#?}");
    let Config {
        authorization,
        port,
        semaphore_permits,
        semaphore_wait,
        kill_timeout,
        origins_whitelist,
    } = config;

    if authorization.is_empty() {
        println!(
            "Warning: AUTH environment variable is not set, anyone will be able to send requests!"
        );
    }
    if origins_whitelist.is_empty() {
        println!(
            "Warning: ORIGINS_WHITELIST environment variable is not set, anyone will be able to send requests!"
        );
    }

    // Necessary for passing it into `auth`
    let authorization: &'static str = authorization.leak();
    let semaphore: &'static tokio::sync::Semaphore = Box::leak(Box::new(
        tokio::sync::Semaphore::new(semaphore_permits as usize),
    ));
    let cors = if origins_whitelist.is_empty() {
        warp::cors().allow_any_origin()
    } else {
        warp::cors().allow_origins(origins_whitelist.iter().map(String::as_str))
    };

    let route = warp::post().and(warp::path("evaluate.json"));
    let auth = warp::header::header("authorization")
        .and_then(move |auth: String| async move {
            (auth == authorization)
                .then_some(())
                .ok_or(Error::not_authorized())
        })
        .untuple_one()
        .or_else(move |_| async move {
            authorization
                .is_empty()
                .then_some(())
                .ok_or(Error::not_authorized())
        });

    let process_input = warp::body::content_length_limit(512)
        .and(warp::body::json())
        .or_else(|_| async move { Err(Error::body_not_correct()) });
    let run_input = move |i: Input| run(i.code, semaphore, semaphore_wait, kill_timeout);

    let filter = route
        .and(auth)
        .and(process_input)
        .and_then(run_input)
        .recover(handle_rejection)
        .with(cors);

    let default = warp::path::end().map(|| warp::reply::html("Waiting requests!"));

    println!("Listening on http://0.0.0.0:{port}/evaluate.json");
    warp::serve(default.or(filter))
        .run(([0, 0, 0, 0], port))
        .await;
    
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
