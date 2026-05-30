from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    qdrant_url: str = "http://qdrant:6333"
    qdrant_api_key: str | None = None
    embedding_model: str = "all-MiniLM-L6-v2"
    log_level: str = "INFO"

def get_settings():
    return Settings()
