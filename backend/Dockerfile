FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . .

# Create storage directories
RUN mkdir -p /app/storage/appdata /app/storage/reports /app/storage/uploads /app/storage/models
ENV LOCALAPPDATA=/app/storage/appdata
ENV PORT=8000
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["sh", "-c", "python seed_db.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
