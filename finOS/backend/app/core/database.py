from collections.abc import Generator  
  
from sqlalchemy import create_engine  
from sqlalchemy.orm import declarative_base, sessionmaker, Session  
  
from app.core.config import settings  
  
  
engine = create_engine(  
    settings.DATABASE_URL,  
    pool_pre_ping=True,  
    echo=settings.ENVIRONMENT == "development",  
)  
  
SessionLocal = sessionmaker(  
    autocommit=False,  
    autoflush=False,  
    expire_on_commit=False,  
    bind=engine,  
)  
  
Base = declarative_base()  
  
  
def get_db() -> Generator[Session, None, None]:  
    db = SessionLocal()  
  
    try:  
        yield db  
        db.commit()  
    except Exception:  
        db.rollback()  
        raise  
    finally:  
        db.close()
