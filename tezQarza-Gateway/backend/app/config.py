from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "development"

    LFE_BASE_URL: str = "http://lfe-service:8001"
    LFE_API_KEY: str = ""

    ENCRYPTION_KEY: str
    ADMIN_API_KEY: str

    QWEN_API_KEY: str = "dummy_key"
    QWEN_BASE_URL: str = "http://localhost:8000/v1"
    QWEN_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
