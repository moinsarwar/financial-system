from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas import (
    ClientResponse, ClientCreate,
    ApplicationResponse, ApplicationCreate, ApplicationDecisionRequest,
    ProductResponse,
    ClaimResponse, ClaimCreate, ClaimResolutionRequest,
    DocumentResponse
)
from app.schemas.front_product import FrontProductBase, FrontProductResponse
from app.models.front_product import FrontProduct
from app.services import (
    client_service, application_service, product_service, claim_service, document_service
)
from typing import List

router = APIRouter()

def get_admin_user(db: Session) -> User:
    # Fetch or create the mock admin user to avoid foreign key violations in audit_logs
    admin = db.query(User).filter(User.id == "admin-portal").first()
    if not admin:
        admin = User(
            id="admin-portal", 
            role=UserRole.ADMINISTRATOR, 
            full_name="Admin Portal System",
            email="admin@finos.local",
            hashed_password="mock_hash_not_usable"
        )
        db.add(admin)
        db.commit()
    return admin

# --- Clients ---
@router.get("/clients", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    return client_service.get_clients(db, get_admin_user(db))

@router.post("/clients", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    try:
        return client_service.create_client(db, client)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/clients/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db)):
    try:
        from app.models.client import Client
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        db.delete(client)
        db.commit()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Applications ---
@router.get("/applications", response_model=List[ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    return application_service.get_applications(db, get_admin_user(db))

@router.post("/applications", response_model=ApplicationResponse)
def create_application(app: ApplicationCreate, db: Session = Depends(get_db)):
    try:
        return application_service.create_application(db, app, get_admin_user(db))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/applications/{app_id}/advance", response_model=ApplicationResponse)
def advance_application(app_id: str, db: Session = Depends(get_db)):
    try:
        return application_service.advance_application_service(db, app_id, get_admin_user(db))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/applications/{app_id}/decide", response_model=ApplicationResponse)
def decide_application(app_id: str, decision: ApplicationDecisionRequest, db: Session = Depends(get_db)):
    try:
        return application_service.decide_application(db, app_id, decision, get_admin_user(db))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/applications/{app_id}")
def delete_application(app_id: str, db: Session = Depends(get_db)):
    from app.models.application import Application
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"message": "Deleted successfully"}

# --- Marketplace Products ---
@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return product_service.get_products(db, get_admin_user(db))

@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    from app.models.policy import Policy
    from app.models.holding import Holding
    pol = db.query(Policy).filter(Policy.id == product_id).first()
    if pol:
        db.delete(pol)
    else:
        hld = db.query(Holding).filter(Holding.id == product_id).first()
        if hld:
            db.delete(hld)
        else:
            raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    return {"message": "Deleted successfully"}

# --- Claims ---
@router.get("/claims", response_model=List[ClaimResponse])
def get_claims(db: Session = Depends(get_db)):
    return claim_service.get_claims(db, get_admin_user(db))

@router.post("/claims", response_model=ClaimResponse)
def create_claim(claim: ClaimCreate, db: Session = Depends(get_db)):
    try:
        return claim_service.create_claim(db, claim, get_admin_user(db))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/claims/{claim_id}")
def delete_claim(claim_id: str, db: Session = Depends(get_db)):
    from app.models.claim import Claim
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    db.delete(claim)
    db.commit()
    return {"message": "Deleted successfully"}

# --- Documents ---
@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return document_service.get_documents(db, get_admin_user(db))

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    from app.models.document import Document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Deleted successfully"}

# --- Marketplace Products (FrontProducts) ---
@router.get("/marketplace", response_model=List[FrontProductResponse])
def get_marketplace_products(db: Session = Depends(get_db)):
    return db.query(FrontProduct).all()

@router.post("/marketplace", response_model=FrontProductResponse)
def create_marketplace_product(product: FrontProductBase, db: Session = Depends(get_db)):
    try:
        new_prod = FrontProduct(**product.dict())
        db.add(new_prod)
        db.commit()
        db.refresh(new_prod)
        return new_prod
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/marketplace/{product_id}", response_model=FrontProductResponse)
def update_marketplace_product(product_id: str, product: FrontProductBase, db: Session = Depends(get_db)):
    try:
        existing = db.query(FrontProduct).filter(FrontProduct.product_id == product_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
        for key, value in product.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/marketplace/{product_id}")
def delete_marketplace_product(product_id: str, db: Session = Depends(get_db)):
    prod = db.query(FrontProduct).filter(FrontProduct.product_id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"message": "Deleted successfully"}
