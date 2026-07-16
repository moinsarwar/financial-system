from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    app_name: str = "FinVault API"
    environment: str = "development"
    database_url: str = "sqlite:///./finvault.db"
    secret_key: str = "change-me-in-production-please-32-chars"
    access_token_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173,http://localhost:8080"
    upload_dir: Path = Path("./uploads")
    max_upload_mb: int = 10
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    @property
    def cors_origin_list(self): return [x.strip() for x in self.cors_origins.split(',') if x.strip()]
settings=Settings(); settings.upload_dir.mkdir(parents=True,exist_ok=True)
