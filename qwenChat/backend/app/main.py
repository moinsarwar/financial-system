from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.chat import router as chat_router
from app.services.data import data_service
from app.services.ollama import ollama_service

app = FastAPI(title=settings.app_name, version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


def _base(url: str) -> str:
    """Strip trailing /api to reach service root."""
    u = url.rstrip("/")
    if u.endswith("/api"):
        return u[: -len("/api")]
    return u


@app.get("/health")
async def health():
    ollama = await ollama_service.health()
    finos_health = await data_service._get(f"{_base(settings.finos_api_url)}/health")
    reseller_health = await data_service._get(f"{_base(settings.reseller_api_url)}/api/health")
    return {
        "status": "ok",
        "service": settings.app_name,
        "ollama": ollama,
        "finos": {"reachable": finos_health.get("ok"), "detail": finos_health},
        "reseller": {"reachable": reseller_health.get("ok"), "detail": reseller_health},
        "mode": "read_only",
    }


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "chat": "POST /api/chat",
        "stream": "POST /api/chat/stream",
        "actions": "GET /api/actions",
    }
