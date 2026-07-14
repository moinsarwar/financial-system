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
