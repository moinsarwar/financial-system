from typing import List  
  
from pydantic import field_validator  
from pydantic_settings import BaseSettings, SettingsConfigDict  
  
  
class Settings(BaseSettings):  
    DATABASE_URL: str  
    SECRET_KEY: str  
  
    ALGORITHM: str = "HS256"  
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  
    ENVIRONMENT: str = "development"  
    UPLOAD_ROOT: str = "/app/uploads"  
  
    CORS_ORIGINS: List[str] = [  
        "http://localhost:5173",  
        "http://localhost:3000",  
        "http://localhost",
        "file://"
    ]

    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "qwen2.5:1.5b"
    OLLAMA_TIMEOUT: float = 300.0

    # Public URLs / invites (override in prod .env)
    FRONTEND_URL: str = "http://localhost:5173"
    INVITE_TOKEN_HOURS: int = 72

    # SMTP (Brevo-compatible)
    MAIL_HOST: str = "smtp-relay.brevo.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_ENCRYPTION: str = "tls"
    MAIL_FROM_ADDRESS: str = "noreply@thecomparisonengine.com"
    MAIL_FROM_NAME: str = "The Comparison Engine"

    # SafePay hosted checkout (sandbox first)
    SAFEPAY_ENV: str = "sandbox"
    SAFEPAY_API_BASE: str = "https://sandbox.api.getsafepay.com"
    SAFEPAY_API_KEY: str = ""
    SAFEPAY_SECRET_KEY: str = ""
    SAFEPAY_WEBHOOK_SECRET: str = ""
    SAFEPAY_AMOUNT_PKR: float = 100.0
    SAFEPAY_CURRENCY: str = "PKR"

    # Aliases accepted from merchant dashboards / docs
    SAFEPAY_ENVIRONMENT: str = ""
    SAFEPAY_API_SECRET: str = ""

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        if self.SAFEPAY_ENVIRONMENT:
            object.__setattr__(self, "SAFEPAY_ENV", self.SAFEPAY_ENVIRONMENT)
        if self.SAFEPAY_API_SECRET and not self.SAFEPAY_SECRET_KEY:
            object.__setattr__(self, "SAFEPAY_SECRET_KEY", self.SAFEPAY_API_SECRET)
  
    model_config = SettingsConfigDict(  
        env_file=".env",  
        case_sensitive=True,  
        extra="ignore",  
    )  
  
    @field_validator("SECRET_KEY")  
    @classmethod  
    def validate_secret(cls, value: str) -> str:  
        if len(value) < 32:  
            raise ValueError(  
                "SECRET_KEY must contain at least 32 characters"  
            )  
  
        return value  
  
    @field_validator("CORS_ORIGINS")  
    @classmethod  
    def validate_cors_origins(  
        cls,  
        value: List[str],  
    ) -> List[str]:  
        if "*" in value:  
            raise ValueError(  
                "Wildcard CORS origins are not permitted"  
            )  
  
        return value  
  
  
settings = Settings()
