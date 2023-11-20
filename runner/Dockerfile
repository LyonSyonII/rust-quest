FROM rust:slim

WORKDIR /usr/src/rust-quest-runner
COPY . .
RUN cargo install --path . && cargo clean

ENTRYPOINT ["runner"]