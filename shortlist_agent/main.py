import uvicorn
from app.api.routes import app
from app.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.api.routes:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level=settings.log_level.lower(),
    )
