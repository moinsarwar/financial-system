import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import affordability, applications, assumptions, auth_routes, calculator, dashboard, vehicles
from .seed import seed_data

app = FastAPI(title="Drive to Earn API", version="1.0", redirect_slashes=False)

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:9017,http://frontend:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(assumptions.router, prefix="/api/assumptions", tags=["Assumptions"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(affordability.router, prefix="/api/affordability", tags=["Affordability"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(calculator.router, prefix="/api/calculator", tags=["Calculator"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


@app.get("/")
async def root():
    return {"message": "Drive to Earn API", "version": "1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
