FROM python:3.11-slim

# Install system dependencies (FFmpeg, libsndfile, git)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Create media directories
RUN mkdir -p uploads clips temp

ENV PYTHONPATH=/app
ENV UPLOAD_DIR=/app/uploads
ENV CLIPS_DIR=/app/clips
ENV TEMP_DIR=/app/temp

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

