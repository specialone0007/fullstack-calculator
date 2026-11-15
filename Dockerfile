# One image that serves the calculator's frontend and API on port 8080.

# 1. Build the frontend. Node 26 matches frontend/.nvmrc.
FROM node:26.12.1-alpine AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build a static Go binary. Go 1.27.4 matches backend/go.mod.
FROM golang:1.27.4-alpine AS backend
WORKDIR /src
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# 3. A small image with only the binary and the built frontend.
FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=backend /out/server /app/server
COPY --from=frontend /src/dist /app/static
ENV STATIC_DIR=/app/static
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/server"]
