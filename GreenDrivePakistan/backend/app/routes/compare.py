from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..services.savings import compare_products

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.post("/", response_model=schemas.CompareResponse)
def compare(payload: schemas.CompareInput, db: Session = Depends(get_db)):
    products = (
        db.query(models.Product).filter(models.Product.is_active == True).all()  # noqa: E712
    )
    lender = db.query(models.Lender).filter(models.Lender.is_active == True).first()  # noqa: E712
    profit_rate = lender.profit_rate if lender else None
    result = compare_products(
        products,
        payload.electricity_bill,
        payload.fuel_bill,
        payload.compare_type,
        profit_rate,
    )
    return result
