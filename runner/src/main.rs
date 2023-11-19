use serde::{Deserialize, Serialize};
use warp::{
    http,
    reject::{Reject, Rejection},
    Filter,
};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "project-template"]
#[exclude = "**/target/*"]
#[exclude = "**/Cargo.lock"]
struct ProjectTemplate;

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
    let Ok(password) = std::env::var("PASSWORD") else {
        return Err("Defining a PASSWORD environment variable is required. Please, call this program with PASSWORD=<your_password>.");
    };
    let password: &'static str = password.leak();

    // GET /run/{code}
    let route = warp::post()
        .and(warp::path("evaluate.json"))
        .and(
            auth(password)
                .and(warp::body::content_length_limit(512))
                .and(warp::body::json())
                .and_then(|_, Input { code}| run(code))
        )
        .recover(handle_rejection);

    warp::serve(route).run(([127, 0, 0, 1], 3030)).await;

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

async fn run(code: String) -> Result<impl warp::Reply, std::convert::Infallible> {
    let error = |e: &str| Ok(warp::reply::json(&Err::<(), _>(e)));
    
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
    
    let code = format!("{}{code}", include_str!("../project-template/src/lib.rs"));

    let Ok(scratch) = tempfile::Builder::new().prefix("playground").tempdir() else {
        return error("Failed to create a temporary directory");
    };

    create_project_template(&scratch);
    
    let input_file = scratch.path().join("src/main.rs");
    // println!("Writing {}", input_file.display());
    let Ok(_) = tokio::fs::write(&input_file, &code).await else {
        return error("Failed to write the input file");
    };

    let Ok(compile) = tokio::process::Command::new("cargo")
        .args(["build"])
        .kill_on_drop(true)
        .current_dir(&scratch)
        .output().await else {
            return error("Failed to run rustc");
        };
    println!("{compile:?}");
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

fn create_project_template(parent: impl AsRef<std::path::Path>) {
    let parent = parent.as_ref();
    for file in ProjectTemplate::iter() {
        let path = parent.join(file.as_ref());
        let prefix = path.parent().unwrap();
        std::fs::create_dir_all(prefix).unwrap();
        // println!("Created {}", prefix.display());
        std::fs::write(&path, ProjectTemplate::get(file.as_ref()).unwrap().data).unwrap();
        // println!("Written {}", path.display());
    }
}