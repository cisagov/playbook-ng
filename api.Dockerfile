# Build + host P-NG as an API on node
FROM node:21.4-alpine
WORKDIR /app

# Install git / bash (needed for build) + suppress warning
RUN apk add --no-cache bash git --no-check-certificate && \
    git config --global --add safe.directory '/app'

# Copy-in source + own as node (COPY --chown was not working)
COPY . .
RUN chown -R node:node .
USER node

# Install dependencies
RUN npm install

# Build dist files
RUN npm run build -w api

ENTRYPOINT ["npm", "run", "preview", "-w", "api"]
