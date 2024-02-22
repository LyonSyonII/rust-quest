use axum::{
    http,
    extract::State,
    response::{Html, Json},
    routing::{get, post},
};

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
    output: Option<std::path::PathBuf>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct Log<'a> {
    date: time::OffsetDateTime,
    id: &'a str,
    score: u8,
    review: std::borrow::Cow<'a, str>,
}

impl Config {
    fn figment() -> figment::Figment {
        figment::Figment::from(figment::providers::Serialized::defaults(Config::default()))
            .merge(figment::providers::Env::prefixed(""))
    }

    fn get() -> &'static Config {
        Box::leak(Box::new(Self::figment().extract::<Config>().unwrap()))
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            port: 9090,
            allowed_origins: Vec::new(),
            output: None,
        }
    }
}

/// GET /
async fn index(State(config): State<&'static Config>) -> Html<Vec<u8>> {
    let Some(Ok(file)) = config.output.as_ref().map(std::fs::read_to_string) else {
        return Html("Waiting for feedback...".into());
    };
    
    let logs: Vec<Log> = serde_yaml::from_str(&file).unwrap();
    let logs = logs.into_iter().fold(String::new(), |acc, log| {
        let date_format =
            time::format_description::parse_borrowed::<2>("[year]-[month]-[day]").unwrap();
        format!(
            "{acc}<tr><td>{}</td><td>{}</td><td>{}</td><td><pre>{}</pre></td></tr>",
            log.date.format(&date_format).unwrap(),
            log.id,
            log.score,
            log.review
        )
    });
    let css = include_str!("../assets/table.css");
    let script = include_str!("../assets/sort-table.js");

    let html = format!(
        "<table><thead><tr><th>Date</th><th>ID</th><th>Score</th><th>Review</th></tr></thead><tbody>{logs}</tbody></table><style>{css}</style><script>{script}</script>",
    );
    Html(minify_html::minify(html.as_bytes(), &minify_html::Cfg {
        minify_css: true,
        minify_js: true,
        ..minify_html::Cfg::default()
    }))
}

/// POST /
async fn feedback(
    State(config): State<&'static Config>,
    Json(feedback): Json<Feedback>,
) -> axum::http::StatusCode {
    use std::io::Write;

    if let Some(path) = &config.output {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .unwrap();

        write!(file, "{feedback}").unwrap();
    }
    eprintln!("{}", feedback);
    http::StatusCode::OK
}

#[tokio::main]
async fn main() {
    let config = Config::get();

    let origins = config
        .allowed_origins
        .iter()
        .map(|o| o.parse::<http::HeaderValue>().unwrap());
    let cors =
        tower_http::cors::CorsLayer::new().allow_origin(if config.allowed_origins.is_empty() {
            tower_http::cors::AllowOrigin::any()
        } else {
            tower_http::cors::AllowOrigin::list(origins)
        });

    let app = axum::Router::new()
        .route("/", post(feedback))
        .route("/", get(index))
        .with_state(config)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port))
        .await
        .unwrap();

    eprintln!("{config:#?}");
    eprintln!("Listening on: http://{}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}

impl<'a> From<&'a Feedback> for Log<'a> {
    fn from(value: &'a Feedback) -> Self {
        Log {
            date: time::OffsetDateTime::now_utc(),
            id: &value.id,
            score: value.score,
            review: std::borrow::Cow::Borrowed(&value.review),
        }
    }
}

impl std::fmt::Display for Feedback {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let log = Log::from(self);
        serde_yaml::to_writer(FormatterWriter(f), &[log]).unwrap();
        Ok(())
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
