import os
import sys
from pathlib import Path

# Ensure imports like `from app...` resolve when running pytest from the backend root.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Default env so Settings doesn't choke when .env is absent.
os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.setdefault("GEMINI_MODEL", "gemini-2.5-pro")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
