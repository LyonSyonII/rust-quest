use axum::{extract::State, response::Html};

use crate::Config;

/// GET /
pub async fn index(State(config): State<&'static Config>) -> Html<Vec<u8>> {
    let Some(Ok(file)) = config.output.as_ref().map(std::fs::read_to_string) else {
        return Html("Waiting for feedback...".into());
    };

    let logs: Vec<super::Log> = serde_yaml::from_str(&file).unwrap();
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
    let css = include_str!("../../assets/table.css");
    let script = include_str!("../../assets/sort-table.js");

    let html = format!(
        "<table><thead><tr><th>Date</th><th>ID</th><th>Score</th><th>Review</th></tr></thead><tbody>{logs}</tbody></table><style>{css}</style><script>{script}</script>",
    );
    Html(minify_html::minify(
        html.as_bytes(),
        &minify_html::Cfg {
            minify_css: true,
            minify_js: true,
            ..minify_html::Cfg::default()
        },
    ))
}
