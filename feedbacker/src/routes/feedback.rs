use axum::{extract::State, http, Json};

use crate::{utils::FormatterWriter, Config};

#[derive(serde::Deserialize, Debug, Clone)]
pub(crate) struct Feedback {
    id: String,
    score: u8,
    review: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Log<'a> {
    pub date: time::OffsetDateTime,
    pub id: &'a str,
    pub score: u8,
    pub review: std::borrow::Cow<'a, str>,
}

/// POST /
pub async fn feedback(
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
