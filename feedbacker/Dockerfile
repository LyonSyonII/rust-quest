FROM rust:slim

WORKDIR /usr/src/feedbacker
COPY . .
RUN cargo install --path . && cargo clean

ENV PORT="9090"
ENV OUTPUT="./feedback.yml"
# ENV ALLOWED_ORIGINS=""

EXPOSE ${PORT}

ENTRYPOINT ["feedbacker"]