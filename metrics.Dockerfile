# build binary with golang
FROM golang:1.23.3 AS builder
WORKDIR /build
COPY ./metrics/metrics.go .
RUN CGO_ENABLED=0 go build -o metrics metrics.go

# run binary in scratch
FROM scratch
WORKDIR /app
COPY --from=builder /build/metrics .
ENTRYPOINT ["./metrics"]
