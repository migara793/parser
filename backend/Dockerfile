FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System dependencies for `unstructured[all-docs]`:
#   poppler-utils  → PDF parsing
#   tesseract-ocr  → OCR fallback
#   libreoffice    → DOC/DOCX/RTF conversion
#   libmagic1      → file type detection
#   libgl1, libglib2.0-0 → image stack
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-eng \
        libreoffice \
        libmagic1 \
        libgl1 \
        libglib2.0-0 \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching.
COPY pyproject.toml ./
COPY app ./app
RUN pip install --upgrade pip \
    && pip install -e ".[dev]"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.api.routes:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
