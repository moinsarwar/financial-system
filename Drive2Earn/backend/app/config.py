import os
from functools import lru_cache


@lru_cache
def get_settings():
    return Settings()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "drive2earn-dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
