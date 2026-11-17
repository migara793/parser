FROM python:3.11-slim

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=1000 \
    PIP_RETRIES=10

WORKDIR /app

# Copy pyproject.toml and the app directory first
COPY pyproject.toml .
COPY app ./app

# Install the CPU build explicitly; the default PyPI torch dependency pulls
# the much larger CUDA runtime stack into this CPU-only service.
RUN pip install --no-cache-dir --timeout 1000 --retries 10 \
        --index-url https://download.pytorch.org/whl/cpu \
        "torch==2.5.1+cpu" \
    && pip install --no-cache-dir --timeout 1000 --retries 10 .

# Copy remaining files
COPY . .

EXPOSE 8001

CMD ["python", "main.py"]
