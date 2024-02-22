mod routes;
mod utils;
mod config;

use axum::{
    extract::State,
    http,
    response::{Html, Json},
    routing::{get, post},
};
use utoipa::OpenApi;

use crate::config::Config;

#[derive(utoipa::OpenApi)]
#[openapi(
    paths(
        routes::feedback,
        routes::index
    ),
    components(
        schemas(routes::Feedback, routes::Log)
    ),
    tags(
        (name="feedback", description="Feedback API")
    )
)]
struct ApiDoc;

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
        .route("/", post(routes::feedback))
        .route("/", get(routes::index))
        .merge(utoipa_swagger_ui::SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(config)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port))
        .await
        .unwrap();

    eprintln!("{config:#?}");
    eprintln!("Listening on: http://{}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}
