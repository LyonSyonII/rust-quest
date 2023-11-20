use serde::Serialize;
use tokio::io::AsyncWriteExt;

#[derive(Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
enum Error {
    Std,
    Core,
    ExternC,
    Unsafe,
    TempDir,
    InputFileCreate,
    InputFileOpen,
    InputFileWrite,
    Build,
    Compiler(String),
    Timeout,
    Execution(String),
}

#[derive(Serialize)]
enum Reply {
    #[serde(rename = "ok")]
    Ok { stdout: String, stderr: String },
    #[serde(rename = "err")]
    Err(Error),
}

type ReplyResult = std::result::Result<Reply, std::convert::Infallible>;

impl Reply {
    const STD: ReplyResult = Self::err(Error::Std);
    const CORE: ReplyResult = Self::err(Error::Core);
    const EXTERN_C: ReplyResult = Self::err(Error::ExternC);
    const UNSAFE: ReplyResult = Self::err(Error::Unsafe);
    const TEMP_DIR: ReplyResult = Self::err(Error::TempDir);
    const INPUT_FILE_CREATE: ReplyResult = Self::err(Error::InputFileCreate);
    const INPUT_FILE_OPEN: ReplyResult = Self::err(Error::InputFileOpen);
    const INPUT_FILE_WRITE: ReplyResult = Self::err(Error::InputFileWrite);
    const BUILD: ReplyResult = Self::err(Error::Build);
    const TIMEOUT: ReplyResult = Self::err(Error::Timeout);

    fn ok(stdout: impl AsRef<[u8]>, stderr: impl AsRef<[u8]>) -> ReplyResult {
        Ok(Self::Ok {
            stdout: String::from_utf8_lossy(stdout.as_ref()).trim().to_owned(),
            stderr: String::from_utf8_lossy(stderr.as_ref()).trim().to_owned(),
        })
    }
    const fn err(e: Error) -> ReplyResult {
        Ok(Self::Err(e))
    }
    fn err_compile(e: impl AsRef<[u8]>) -> ReplyResult {
        Self::err(Error::Compiler(
            String::from_utf8_lossy(e.as_ref()).into_owned(),
        ))
    }
    fn err_execution(e: String) -> ReplyResult {
        Self::err(Error::Execution(e))
    }
}

impl warp::Reply for Reply {
    fn into_response(self) -> warp::reply::Response {
        warp::reply::json(&self).into_response()
    }
}

pub async fn run(
    code: impl AsRef<str>,
    semaphore: &'static tokio::sync::Semaphore,
    semaphore_wait: u16,
    kill_timeout: u16,
) -> Result<impl warp::Reply, std::convert::Infallible> {
    let code = code.as_ref();

    let _semaphore = loop {
        match semaphore.try_acquire() {
            Ok(ok) => break ok,
            Err(_) => {
                tokio::time::sleep(std::time::Duration::from_millis(semaphore_wait as u64)).await
            }
        }
    };

    if code.contains("::std") {
        return Reply::STD;
    } else if code.contains("::core") {
        return Reply::CORE;
    } else if code.contains("extern \"C\"") {
        return Reply::EXTERN_C;
    } else if code.contains("unsafe") {
        return Reply::UNSAFE;
    }

    let Ok(scratch) = tempfile::Builder::new().prefix("playground").tempdir() else {
        return Reply::TEMP_DIR;
    };
    let Ok(input_file) = create_project_template(&scratch).await else {
        return Reply::INPUT_FILE_CREATE;
    };
    // println!("Writing {}", input_file.display());
    let Ok(mut input_file) = tokio::fs::OpenOptions::new()
        .append(true)
        .open(input_file)
        .await
    else {
        return Reply::INPUT_FILE_OPEN;
    };
    let Ok(_) = input_file.write_all(code.as_bytes()).await else {
        return Reply::INPUT_FILE_WRITE;
    };
    drop(input_file);

    let Ok(compile) = tokio::process::Command::new("cargo")
        .args(["build"])
        .kill_on_drop(true)
        .current_dir(&scratch)
        .output()
        .await
    else {
        return Reply::BUILD;
    };
    // println!("{compile:?}");
    if !compile.status.success() {
        return Reply::err_compile(&compile.stderr);
    }

    let run = tokio::process::Command::new("cargo")
        .arg("run")
        .kill_on_drop(true)
        .current_dir(&scratch)
        .output();

    // TODO: Panic does not trigger Err
    match tokio::time::timeout(std::time::Duration::from_millis(kill_timeout as u64), run).await {
        Ok(Ok(result)) => Reply::ok(result.stdout, result.stderr),
        Ok(Err(e)) => Reply::err_execution(e.to_string()),
        Err(_) => Reply::TIMEOUT,
    }
}

async fn create_project_template(
    parent: impl AsRef<std::path::Path>,
) -> std::io::Result<std::path::PathBuf> {
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
