# Build Playbook-NG on node
FROM node:21.4-alpine AS builder
WORKDIR /app

# Install git (needed for build) + suppress warning
RUN apk add --no-cache git --no-check-certificate && \
    git config --global --add safe.directory '/app'

# Copy-in source + own as node (COPY --chown was not working)
COPY . .
RUN chown -R node:node .
USER node

# Install dependencies
RUN npm install

# Build + compress dist files
RUN npm run build -w website && \
    find /app/website/dist -type f -not -name "*.gz" -exec gzip -6fk {} +

# ------------------------------------------------------------------------------

# Create nginx box to host Playbook-NG
FROM nginx:1.19.0
WORKDIR /usr/share/nginx/html

# Copy dist files over
RUN rm -rf ./*
COPY --from=builder /app/website/dist .

# Swap nginx default conf for ours
RUN rm /etc/nginx/conf.d/default.conf
COPY --chown=root:root website/docker/sources/nginx.conf /etc/nginx
