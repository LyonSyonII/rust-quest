use std::fmt::Write;

use actix_web::{get, http, post, web, App, HttpResponse, HttpServer, Responder};


#[derive(serde::Deserialize, Debug, Clone)]
struct Feedback {
    id: String,
    score: u8,
    review: String
}

#[post("/")]
async fn feedback(web::Json(feedback): web::Json<Feedback>) -> impl Responder {
    println!("{}", feedback);
    HttpResponse::Ok().body("Thanks for your feedback!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let cors = actix_cors::Cors::default()
            .allowed_origin("https://rust-quest.com")
            .allowed_origin("http://localhost:4321")
            .allowed_methods(["POST", "OPTIONS"])
            .allowed_header(http::header::CONTENT_TYPE);

        App::new()
            .service(feedback)
            .wrap(cors)
    })
    .bind(("127.0.0.1", 8080))?
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