import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import applications, auth_routes, comparison, costs, dashboard, inquiries, vehicles
from .seed import seed_data

app = FastAPI(title="AutoCompare PK API", version="1.0", redirect_slashes=False)

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:9016,http://frontend:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["Comparison"])
app.include_router(costs.router, prefix="/api/costs", tags=["Costs"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(inquiries.router, prefix="/api/inquiries", tags=["Inquiries"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


@app.get("/")
async def root():
    return {"message": "AutoCompare PK API", "version": "1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
