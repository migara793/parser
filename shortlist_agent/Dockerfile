FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and the app directory first
COPY pyproject.toml .
COPY app ./app

# Increase timeout for large packages like torch
RUN pip install --no-cache-dir --default-timeout=1000 .

# Copy remaining files
COPY . .

EXPOSE 8001

CMD ["python", "main.py"]
