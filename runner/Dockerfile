FROM rust:slim

WORKDIR /usr/src/rust-quest-runner
COPY . .
RUN cargo build --release
RUN cargo clean

ENTRYPOINT target/release/runner