# ── Stage 1: Build React + TypeScript Frontend ────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python Backend & Unified Server ──────────────────────────────────
FROM python:3.11-slim

# Install system dependencies (ffmpeg for audio processing, nodejs and deno for yt-dlp JS challenge runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    nodejs \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Deno binary directly from official Deno image (yt-dlp's native JS engine for YouTube challenges)
COPY --from=denoland/deno:bin /deno /usr/local/bin/deno

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -U "yt-dlp[default]"

# Copy backend application code
COPY . .

# Copy compiled React frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create runtime directories for SQLite and RAG chunk store
RUN mkdir -p data/downloads data/vector_db

# Railway / cloud environments dynamically supply $PORT at runtime
ENV PORT=8000
EXPOSE 8000

# Start unified FastAPI server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
