import os
from functools import lru_cache


@lru_cache
def get_settings():
    return Settings()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "autocompare-dev-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    PETROL_PRICE: float = float(os.getenv("PETROL_PRICE", "270"))
    DIESEL_PRICE: float = float(os.getenv("DIESEL_PRICE", "280"))
    EV_KWH_PRICE: float = float(os.getenv("EV_KWH_PRICE", "45"))
    ANNUAL_KM: int = int(os.getenv("ANNUAL_KM", "15000"))
    REGISTRATION_PCT: float = float(os.getenv("REGISTRATION_PCT", "0.035"))
    DEPRECIATION_PCT: float = float(os.getenv("DEPRECIATION_PCT", "0.15"))
