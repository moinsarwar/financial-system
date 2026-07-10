from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: List[str] = ["http://localhost"]
    ENVIRONMENT: str = "development"

    LFE_BASE_URL: str = "http://lfe-service:8001"
    LFE_API_KEY: str = ""

    ENCRYPTION_KEY: str
    ADMIN_API_KEY: str

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
