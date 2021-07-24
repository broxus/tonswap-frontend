FROM ubuntu:20.04

WORKDIR /app

RUN \
    set -eux; \
    apt-get update && \
    apt-get install -y curl build-essential python git && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs
