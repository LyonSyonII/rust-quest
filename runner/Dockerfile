FROM rust:slim

WORKDIR /usr/src/rust-quest-runner
COPY . .
RUN ["cargo", "install", "--path", "."]
RUN ["cargo", "clean"]

ENTRYPOINT ["runner"]