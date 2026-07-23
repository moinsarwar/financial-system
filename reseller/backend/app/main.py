from fastapi import FastAPI  
from fastapi.middleware.cors import CORSMiddleware  
  
from .database import engine, Base  
from .routers import resellers, customers, activities, testimonials, products  
  
# Create tables (in production, use Alembic migrations)  
Base.metadata.create_all(bind=engine)  
  
app = FastAPI(  
    title="The Comparison Engine API",  
    description="Backend for reseller program",  
    version="1.0.0"  
)  
  
# CORS - allow all for development (adjust in production)  
app.add_middleware(  
    CORSMiddleware,  
    allow_origins=["*"],  
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],  
)  
  
# Include routers  
app.include_router(resellers.router, prefix="/api/resellers", tags=["resellers"])  
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])  
app.include_router(activities.router, prefix="/api/activities", tags=["activities"])  
app.include_router(testimonials.router, prefix="/api/testimonials", tags=["testimonials"])  
app.include_router(products.router, prefix="/api/products", tags=["products"])  
  
@app.get("/")  
def root():  
    return {"message": "The Comparison Engine API is running"}  
  
@app.get("/api/health")  
def health_check():  
    return {"status": "ok"}
