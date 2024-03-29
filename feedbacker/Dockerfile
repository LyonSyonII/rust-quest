FROM clux/muslrust:stable AS chef
USER root
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json


FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Notice that we are specifying the --target flag!
RUN cargo chef cook --release --target x86_64-unknown-linux-musl --recipe-path recipe.json
COPY . .
RUN cargo build --release --target x86_64-unknown-linux-musl

# We do not need the Rust toolchain to run the binary!
FROM alpine AS runtime
# RUN addgroup --g 1000 groupcontainer
# RUN adduser -u 1000 -G groupcontainer -h /home/user -D user
# USER user
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/feedbacker /usr/local/bin/
#USER myuser

ENV PORT="9090"
ENV OUTPUT="/feedbacker/feedback.yml"

ENTRYPOINT [ "/usr/local/bin/feedbacker" ]