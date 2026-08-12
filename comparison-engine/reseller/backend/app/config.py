from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql://comparison:comparison@localhost:5433/comparison"

    # Public reseller UI (set-password links)
    FRONTEND_URL: str = "http://localhost:9004"

    # Brevo / SMTP (MAIL_* names match provided env)
    MAIL_MAILER: str = "smtp"
    MAIL_HOST: str = "smtp-relay.brevo.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_ENCRYPTION: str = "tls"
    MAIL_FROM_ADDRESS: str = "noreply@thecomparisonengine.com"
    MAIL_FROM_NAME: str = "The Comparison Engine"

    # Invite tokens
    INVITE_TOKEN_HOURS: int = 72
    SECRET_KEY: str = "my_super_secret_key"


settings = Settings()
