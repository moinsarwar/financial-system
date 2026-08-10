from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://greendrive:greendrive@db:5432/greendrive"
    SECRET_KEY: str = "greendrive-dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    LENDER_PROFIT_RATE: float = 0.13
    MAX_TENURE_MONTHS: int = 24

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
