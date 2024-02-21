use std::fmt::Write;

use actix_web::{get, http, post, web, App, HttpResponse, HttpServer, Responder};


#[derive(serde::Deserialize, Debug, Clone)]
struct Feedback {
    id: String,
    score: u8,
    review: String
}

#[derive(serde::Deserialize, Debug, Clone)]
struct Config {
    port: u16,
    allowed_origins: Vec<String>
}

impl Default for Config {
    fn default() -> Self {
        Config {
            port: 9090,
            allowed_origins: Vec::new(),
        }
    }
}

#[post("/")]
async fn feedback(web::Json(feedback): web::Json<Feedback>) -> impl Responder {
    println!("{}", feedback);
    HttpResponse::Ok().body("Thanks for your feedback!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = figment::Figment::new().merge(
        figment::providers::Env::prefixed("")
    ).extract::<Config>().unwrap();
        
    let cors = actix_cors::Cors::default()
        .allowed_origin_fn(|origin, _| {
            config.allowed_origins.iter().any(|a| a.as_bytes() == origin.as_bytes())
        })
        .allowed_methods(["POST", "OPTIONS"])
        .allowed_header(http::header::CONTENT_TYPE);

    let app = App::new().service(feedback).wrap(cors);

    HttpServer::new(move || {
        

        app
    })
    .bind(("0.0.0.0", config.port))?
    .run()
    .await
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct Log<'a> {
    date: time::OffsetDateTime,
    id: &'a str,
    score: u8,
    review: &'a str
}

impl<'a> From<&'a Feedback> for Log<'a> {
    fn from(value: &'a Feedback) -> Self {
        Log {
            date: time::OffsetDateTime::now_utc(),
            id: &value.id,
            score: value.score,
            review: &value.review
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