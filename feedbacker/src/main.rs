use axum::{
    response::Json,
    routing::{get, post},
};

use std::fmt::Write;

#[derive(serde::Deserialize, Debug, Clone)]
struct Feedback {
    id: String,
    score: u8,
    review: String,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
struct Config {
    port: u16,
    allowed_origins: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            port: 9090,
            allowed_origins: Vec::new(),
        }
    }
}

/// GET /
async fn index() -> &'static str {
    "Waiting for feedback..."
}

/// POST /
async fn feedback(Json(feedback): Json<Feedback>) -> &'static str {
    println!("{}", feedback);
    "Thank you for your feedback!"
}

#[tokio::main]
async fn main() {
    let config =
        figment::Figment::from(figment::providers::Serialized::defaults(Config::default()))
            .merge(figment::providers::Env::prefixed(""))
            .extract::<Config>()
            .unwrap();

    let cors = tower_http::cors::CorsLayer::new().allow_origin(
        config
            .allowed_origins
            .into_iter()
            .map(|o| o.parse::<http::HeaderValue>().unwrap())
            .collect::<Vec<_>>(),
    );

    let app = axum::Router::new()
        .route("/", post(feedback))
        .route("/", get(index))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port))
        .await
        .unwrap();

    let ip = local_ip_address::local_ip().unwrap();
    println!("Listening on: http://{ip:?}:{}", config.port);

    axum::serve(listener, app).await.unwrap();
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct Log<'a> {
    date: time::OffsetDateTime,
    id: &'a str,
    score: u8,
    review: &'a str,
}

impl<'a> From<&'a Feedback> for Log<'a> {
    fn from(value: &'a Feedback) -> Self {
        Log {
            date: time::OffsetDateTime::now_utc(),
            id: &value.id,
            score: value.score,
            review: &value.review,
        }
    }
}

impl std::fmt::Display for Feedback {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let log = Log::from(self);
        serde_json::to_writer_pretty(FormatterWriter(f), &log).unwrap();
        f.write_char(',')
    }
}

struct FormatterWriter<'r, 'f>(&'r mut std::fmt::Formatter<'f>);

impl std::io::Write for FormatterWriter<'_, '_> {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let s = std::str::from_utf8(buf).unwrap();
        self.0.write_str(s).unwrap();
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}
