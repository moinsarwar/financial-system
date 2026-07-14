from fastapi import FastAPI  
from fastapi.middleware.cors import CORSMiddleware  
from app.api.routes import auth, clients, applications, claims, products, documents, activity, dashboard  
from app.core.database import get_db  
from app.core.config import settings  
from sqlalchemy.orm import Session  
from fastapi import Depends  
from sqlalchemy import text  
  
app = FastAPI(title="FinOS API", version="9.0")  
  
# CORS – configured from settings  
app.add_middleware(  
    CORSMiddleware,  
    allow_origins=["*"],  
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],  
)  
  
# Include routers  
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])  
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])  
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])  
app.include_router(claims.router, prefix="/api/claims", tags=["claims"])  
app.include_router(products.router, prefix="/api/products", tags=["products"])  
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])  
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])  
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])  
from app.api.endpoints import front_products
app.include_router(front_products.router, prefix="/api/front_products", tags=["front_products"])
  
@app.get("/health")  
def health(db: Session = Depends(get_db)):  
    db.execute(text("SELECT 1"))  
    return {"status": "ok"}  
  
@app.get("/health/ready")  
def ready(db: Session = Depends(get_db)):  
    # Basic readiness: database connectivity  
    db.execute(text("SELECT 1"))  
    return {"status": "ready"}
