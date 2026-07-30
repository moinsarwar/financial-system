from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT = Path(__file__).resolve().parents[2]  # qwenChat/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ROOT / ".env", ".env"),
        extra="ignore",
    )

    app_name: str = "QwenChat"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5:0.5b"
    ollama_timeout: float = 120.0

    # Host-side defaults for local Docker / host networking
    finos_api_url: str = "http://127.0.0.1:8000/api"
    reseller_api_url: str = "http://127.0.0.1:9005/api"

    cors_origins: str = "http://localhost:9010,http://127.0.0.1:9010"


settings = Settings()
