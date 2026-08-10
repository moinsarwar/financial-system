import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from . import models
from .config import get_settings
from .database import Base, SessionLocal, engine
from .routes import admin, applications, auth, compare, documents, products, users, vendors
from .seed import seed_database


def _ensure_schema() -> None:
    """Create tables and add columns that create_all won't alter on existing DBs."""
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    os.makedirs(settings.UPLOAD_ROOT, exist_ok=True)
    _ensure_schema()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="GreenDrive Pakistan API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(applications.router)
app.include_router(documents.router)
app.include_router(users.router)
app.include_router(vendors.router)
app.include_router(admin.router)
app.include_router(compare.router)


@app.get("/")
def root():
    return {"message": "GreenDrive Pakistan API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}
