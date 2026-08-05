from fastapi import FastAPI  
from fastapi.middleware.cors import CORSMiddleware  
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.api.routes import auth, clients, applications, claims, products, documents, activity, dashboard, admin_portal, ai  
from app.core.database import get_db  
from app.core.config import settings  
from sqlalchemy.orm import Session  
from fastapi import Depends  
from sqlalchemy import text  
  
app = FastAPI(title="FinOS API", version="9.0")  

# Trust X-Forwarded-Proto/Host from reverse proxies (host nginx / Caddy)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
  
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
app.include_router(admin_portal.router, prefix="/api/admin_portal", tags=["admin_portal"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
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
