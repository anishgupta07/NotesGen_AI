# ── Stage 1: Build React + TypeScript Frontend ────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python Backend & Unified Server ──────────────────────────────────
FROM python:3.11-slim

# Install system dependencies (ffmpeg for audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY Requirements.txt .
RUN pip install --no-cache-dir -r Requirements.txt

# Copy backend application code
COPY . .

# Copy compiled React frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create runtime directories for SQLite and ChromaDB
RUN mkdir -p data/downloads data/vector_db

# Cloud environments dynamically assign $PORT
ENV PORT=8000
EXPOSE 8000

# Start unified FastAPI server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
