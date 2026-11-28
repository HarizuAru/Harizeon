# ---- Stage 1: Build pinned Go scanner binaries (MIT licensed) ----
FROM golang:1.23-alpine AS go-tools
RUN apk add --no-cache git ca-certificates

ENV CGO_ENABLED=0
RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@v2.6.8 && \
    go install github.com/projectdiscovery/dnsx/cmd/dnsx@v1.2.1 && \
    go install github.com/projectdiscovery/httpx/cmd/httpx@v1.6.10 && \
    go install github.com/projectdiscovery/tlsx/cmd/tlsx@v1.1.7 && \
    go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@v3.3.7

# ---- Stage 2: Minimal Non-Root Python Data Plane ----
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    useradd --create-home --uid 10001 --shell /usr/sbin/nologin scanner

COPY --from=go-tools /go/bin/subfinder /usr/local/bin/subfinder
COPY --from=go-tools /go/bin/dnsx      /usr/local/bin/dnsx
COPY --from=go-tools /go/bin/httpx     /usr/local/bin/httpx
COPY --from=go-tools /go/bin/tlsx      /usr/local/bin/tlsx
COPY --from=go-tools /go/bin/nuclei    /usr/local/bin/nuclei

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY templates/ /opt/harizeon/templates/
COPY .          /app/worker/

ENV HOME=/tmp/scanner-home \
    XDG_CONFIG_HOME=/tmp/scanner-home/.config \
    XDG_CACHE_HOME=/tmp/scanner-home/.cache \
    PYTHONUNBUFFERED=1

USER scanner
ENTRYPOINT ["python", "-m", "worker.main"]
