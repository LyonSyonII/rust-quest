FROM rust:slim

WORKDIR /usr/src/feedbacker
COPY . .
RUN cargo build --release
RUN cargo install --path .

ENV PORT="9090"
ENV ALLOWED_ORIGINS="*"

EXPOSE ${PORT}

ENTRYPOINT ["feedbacker"]