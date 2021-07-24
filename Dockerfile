FROM gcr.io/broxus/ton/tonswap/builder:1.0 as builder

COPY . .

RUN \
    set -eux; \
    npm ci && \
    npm run build

FROM nginx:1.21

COPY --from=builder app/dist /usr/share/nginx/html
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
