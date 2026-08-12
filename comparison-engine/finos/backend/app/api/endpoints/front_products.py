from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.front_product import FrontProduct
from app.schemas.front_product import FrontProductList

router = APIRouter()

@router.get("", response_model=FrontProductList)
@router.get("/", response_model=FrontProductList)
def get_front_products(
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    query = db.query(FrontProduct).filter(FrontProduct.status == "active")
    total = query.count()
    products = query.offset(offset).limit(limit).all()
    
    return {"total": total, "products": products}
