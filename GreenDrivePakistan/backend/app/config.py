from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://greendrive:greendrive@db:5432/greendrive"
    SECRET_KEY: str = "greendrive-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    LENDER_PROFIT_RATE: float = 0.13
    MAX_TENURE_MONTHS: int = 24
    UPLOAD_ROOT: str = "/app/uploads"
    # Same pattern as finOS — host Ollama directly (not qwenChat)
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "qwen2.5:1.5b"
    OLLAMA_TIMEOUT: float = 120.0

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
