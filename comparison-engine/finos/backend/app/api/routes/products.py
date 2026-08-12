from fastapi import APIRouter, Depends, HTTPException, Query  
from sqlalchemy.orm import Session  
from app.api.dependencies import get_current_user  
from app.core.database import get_db  
from app.models.user import User  
from app.schemas import ProductResponse  
from app.services.product_service import get_products, get_product  
  
router = APIRouter()  
  
@router.get("/", response_model=list[ProductResponse])  
def list_products(  
    db: Session = Depends(get_db),  
    current_user: User = Depends(get_current_user),  
    search: str = Query(None),  
    product_type: str = Query(None),  
    status: str = Query(None),  # no alias  
    department: str = Query(None),  
):  
    return get_products(db, current_user, search, product_type, status, department)  
  
@router.get("/{product_id}", response_model=ProductResponse)  
def get_product_detail(product_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):  
    product = get_product(db, product_id, current_user)  
    if not product: raise HTTPException(404, "Product not found")  
    return product
