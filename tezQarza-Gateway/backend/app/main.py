from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import applications, products, eligibility, dashboard, qwen
from .utils.logging import setup_logging
from .database import engine, Base, AsyncSessionLocal
from .crud import sync_products_from_lfe, retry_failed_submissions
import asyncio

setup_logging()

app = FastAPI(title="TezQarza Channel Gateway", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(eligibility.router, prefix="/api/eligibility", tags=["eligibility"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(qwen.router, prefix="/api", tags=["qwen"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    if settings.ENVIRONMENT != "production":
        async with AsyncSessionLocal() as db:
            await sync_products_from_lfe(db)
    if settings.ENVIRONMENT != "test":
        asyncio.create_task(retry_worker())

async def retry_worker():
    while True:
        await asyncio.sleep(60)
        async with AsyncSessionLocal() as db:
            await retry_failed_submissions(db)

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "TezQarza Channel Gateway"}
