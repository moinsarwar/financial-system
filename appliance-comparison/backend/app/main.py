import os
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import appliances, comparison, costs, services
from .seed import seed_data

app = FastAPI(title="HomeCompare PK API", version="3.0", redirect_slashes=False)

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:9015,http://frontend:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appliances.router, prefix="/api/appliances", tags=["Appliances"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["Comparison"])
app.include_router(costs.router, prefix="/api/costs", tags=["Costs"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


@app.get("/")
async def root():
    return {"message": "HomeCompare PK API", "version": "3.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
