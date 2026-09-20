# ==========================================
# 1. Build React Frontend (Vite + TS)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. Python FastAPI Unified Server
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy built frontend into location expected by main.py
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000
ENV PORT=8000

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
