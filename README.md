\# Resume Parser

A two-piece system for extracting structured candidate data from CVs/resumes:

- **Backend** — FastAPI microservice using `unstructured` for document parsing
  and **Google Gemini** with structured output (`response_schema`) for typed
  field extraction. The extraction schema is **assembled per request** from
  the recruiter's profile, so each company can choose what to extract,
  rename/cap fields, and add **custom fields** in plain English.
- **Frontend** — React + Vite + Tailwind UI where a recruiter configures the
  fields they want, drops in a resume, and gets back a structured JSON
  result (pretty view + raw JSON, copy/download).

## Layout

```
parser/
├── backend/             FastAPI + unstructured + google-genai
├── frontend/            React + Vite + Tailwind + Zustand
└── docker-compose.yml   one-command local stack
```

## Run with Docker Compose (recommended)

Prerequisite: Docker Engine + Docker Compose v2.

```sh
# 1. Set your API key (the backend reads backend/.env)
cp backend/.env.example backend/.env
# edit backend/.env and set GOOGLE_API_KEY=...

# 2. Build and start both services
docker compose up --build

# 3. Open the app
#    UI:        http://localhost:5173
#    API:       http://localhost:8000
#    Health:    http://localhost:8000/health
```

The compose file mounts source code as volumes, so:
- Editing `backend/app/**` triggers uvicorn `--reload`.
- Editing `frontend/src/**` triggers Vite HMR.

Stop with `Ctrl+C`, then `docker compose down` to remove containers.

> Note: the backend image installs `libreoffice`, `tesseract`, and `poppler`
> for `unstructured`'s document support, so the first build is several
> hundred MB and takes a few minutes.

## Backend — run

System packages (Ubuntu/Debian) for `unstructured` PDF/DOCX support:
```sh
sudo apt-get install -y poppler-utils tesseract-ocr libreoffice
```

Python:
```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env and set GOOGLE_API_KEY=...
python main.py            # runs uvicorn on :8000 with reload
```

Smoke test:
```sh
curl http://localhost:8000/health
curl http://localhost:8000/fields | head

curl -X POST http://localhost:8000/parse \
  -F "file=@tests/fixtures/sample_cv.txt" \
  -F 'profile={"fields":{"full_name":{"enabled":true,"required":true},"contact.email":{"enabled":true},"experience":{"enabled":true,"options":{"max_items":5,"include_bullets":true}},"skills":{"enabled":true}},"custom_fields":[{"key":"open_to_relocation","type":"boolean","description":"True if relocation is mentioned, else null."}]}'
```

Tests:
```sh
cd backend
pytest -q
```

## Frontend — run

Requires Node 20+.
```sh
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

The dev server proxies `/api/*` → `http://localhost:8000/*`.

## How recruiter configurability works

1. UI calls `GET /fields` and renders a checkbox grid of all available fields,
   each with its own per-field options (max items, category filters, etc.).
2. The recruiter toggles fields, edits options, and adds **custom fields**
   (key + type + free-text description). The active configuration is saved
   to `localStorage` and can be saved as named **presets**.
3. On parse, the UI posts the file plus the profile JSON to `POST /parse`.
4. The backend builds a Pydantic model on the fly that contains *only* the
   selected fields plus the custom fields (with their descriptions baked in
   as JSON Schema field descriptions).
5. That model is passed to Gemini as `response_schema`, and Gemini returns a
   typed JSON object that's validated and returned to the UI.

## Environment

`backend/.env`:

```
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-2.5-pro
MAX_FILE_MB=10
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

`frontend/.env`:

```
VITE_API_BASE=/api
```
