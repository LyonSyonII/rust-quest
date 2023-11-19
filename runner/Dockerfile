FROM rust:slim

WORKDIR /usr/src/rust-quest-runner
COPY . .
RUN cargo build --release

ENTRYPOINT target/release/rust-quest-runner