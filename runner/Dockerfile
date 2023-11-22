FROM rust:slim

WORKDIR /usr/src/rust-quest-runner
COPY . .
RUN cargo install --path . && cargo clean

ENV AUTH=""
ENV PORT="3030"
ENV SEMAPHORE_PERMITS=5
ENV SEMAPHORE_WAIT=500
ENV KILL_TIMEOUT=500
ENV ORIGINS_WHITELIST=""

EXPOSE ${PORT}

ENTRYPOINT ["runner"]