use axum::{extract::State, http, Json};

use crate::{utils::FormatterWriter, Config};

#[derive(serde::Deserialize, utoipa::ToSchema, Debug, Clone)]
pub(crate) struct Feedback {
    /// ID of the chapter this feedback is about.
    #[schema(example = "3")]
    id: String,
    /// Score given to the chapter. Between 1 and 5.
    #[schema(minimum = 1, maximum = 5, example = 5)]
    score: u8,
    /// Optional review of the chapter.
    #[schema(example = "I loved this chapter!")]
    review: String,
}

#[derive(serde::Serialize, utoipa::ToSchema, serde::Deserialize, Debug, Clone)]
pub struct Log<'a> {
    #[schema(value_type = String, format = "Date")]
    pub date: time::OffsetDateTime,
    pub id: &'a str,
    pub score: u8,
    pub review: std::borrow::Cow<'a, str>,
}

#[utoipa::path(
    post,
    path = "/",
    request_body = Feedback,
    responses(
        (status = 201, description = "Feedback sent successfuly", body = Feedback),
    )
)]
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
    http::StatusCode::CREATED
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
