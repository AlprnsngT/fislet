# Single-stage clean Python 3.11 Dockerfile for Railway.app deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV & C++ extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from worker directory
COPY worker/requirements.txt /app/worker/requirements.txt

# Install lightweight dependencies for Python worker
RUN pip install --no-cache-dir -r /app/worker/requirements.txt

# Copy worker application code
COPY . /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["python3", "worker/main.py"]
