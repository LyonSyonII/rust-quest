use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
use warp::{
    http,
    reject::{Reject, Rejection},
    Filter,
};

#[derive(Deserialize)]
struct Input {
    code: String,
}

#[derive(Debug, Serialize)]
enum Error {
    NotAuthorized,
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
    let port = std::env::var("PORT").ok().and_then(|p| p.parse::<u16>().ok()).unwrap_or(3030);
    let password: &'static str = password.leak();

    let cors = warp::cors()
        .allow_origin("https://garriga.dev");
    
    let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(20));
    
    // GET /run/{code}
    let route = warp::post()
        .and(warp::path("evaluate.json"))
        .and(
            auth(password)
                .and(warp::body::content_length_limit(512))
                .and(warp::body::json())
                .and_then(move |_, Input { code}| run(code, semaphore.clone()))
        )
        .recover(handle_rejection)
        .with(cors);
    
    println!("Listening on 0.0.0.0:{}", port);
    warp::serve(route).run(([0, 0, 0, 0], port)).await;

    Ok(())
}

fn auth(password: &'static str) -> impl Filter<Extract = ((),), Error = warp::Rejection> + Copy {
    warp::header::header("authorization")
        .and_then(move |auth: String| async move {
            if auth == password {
                Ok(())
            } else {
                Err(warp::reject::custom(Error::NotAuthorized))
            }
        })
        .or_else(|_| async move { Err(warp::reject::custom(Error::NotAuthorized)) })
}

async fn run(code: String, semaphore: std::sync::Arc<tokio::sync::Semaphore>) -> Result<impl warp::Reply, std::convert::Infallible> {
    let error = |e: &str| Ok(warp::reply::json(&Err::<(), _>(e)));
    
    let semaphore = loop {
        match semaphore.clone().try_acquire_owned() {
            Ok(ok) => break ok,
            Err(_) => tokio::time::sleep(std::time::Duration::from_millis(500)).await,
        }
    };
    
    if code.contains("::std") {
        return error("You can't use `::std` in your code, use the modules available with std:: instead.\nThis is done to avoid malicious activity.");
    } else if code.contains("::core") {
        return error("You can't use `::core` in your code.\nThis is done to avoid malicious activity.");
    } else if code.contains("extern \"C\"") {
        return error(
            "You can't use `extern \"C\"` in your code.\nThis is done to avoid malicious activity.",
        );
    } else if code.contains("unsafe") {
        return error(
            "You can't use `unsafe` in your code.\nThis is done to avoid malicious activity.",
        );
    }

    let Ok(scratch) = tempfile::Builder::new().prefix("playground").tempdir() else {
        return error("Failed to create a temporary directory");
    };
    let Ok(input_file) = create_project_template(&scratch).await else {
        return error("Failed to create the input file");
    };
    // println!("Writing {}", input_file.display());
    let Ok(mut input_file) = tokio::fs::OpenOptions::new()
        .append(true)
        .open(input_file)
        .await else {
            return error("Failed to open the input file");
        };

    let Ok(_) = input_file.write_all(code.as_bytes()).await else {
        return error("Failed to write to the input file");
    };

    let Ok(compile) = tokio::process::Command::new("cargo")
        .args(["build"])
        .kill_on_drop(true)
        .current_dir(&scratch)
        .output().await else {
            return error("Failed to run 'cargo build'");
        };
    // println!("{compile:?}");
    if !compile.status.success() {
        return error(&String::from_utf8(compile.stderr).unwrap());
    }
    
    let run = tokio::process::Command::new("cargo")
        .arg("run")
        .kill_on_drop(true)
        .current_dir(&scratch)
        .output();
    
    match tokio::time::timeout(std::time::Duration::from_millis(500), run).await {
        Ok(Ok(result)) => Ok(warp::reply::json(&String::from_utf8(result.stdout).unwrap())),
        Ok(Err(e)) => error(&e.to_string()),
        Err(_) => error("Timed out"),
    }
}

async fn handle_rejection(
    err: Rejection,
) -> std::result::Result<impl warp::Reply, warp::Rejection> {
    let code = match err.find() {
        Some(Error::NotAuthorized) => http::StatusCode::UNAUTHORIZED,
        None => http::StatusCode::NOT_FOUND,
    };

    Ok(warp::reply::with_status(warp::reply(), code))
}

async fn create_project_template(parent: impl AsRef<std::path::Path>) -> std::io::Result<std::path::PathBuf> {
    let template = concat!(env!("CARGO_MANIFEST_DIR"), "/project-template/.");
    tokio::process::Command::new("cp")
        .arg("-r")
        .arg(template)
        .arg(parent.as_ref())
        .spawn()?
        .wait()
        .await?;
    Ok(parent.as_ref().join("src/main.rs"))
}