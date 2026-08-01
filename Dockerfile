# Build do front-end (Vite) em modo servidor
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
ENV VITE_SERVER_MODE=true
RUN npm run build

# Servidor (Node + Express + SQLite)
FROM node:22-bookworm-slim AS server
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY --from=frontend-build /app/dist ./public

ENV STATIC_DIR=/srv/public
ENV NODE_ENV=production
ENV DB_PATH=/srv/data/app.db

EXPOSE 4000
CMD ["node", "src/server.js"]
