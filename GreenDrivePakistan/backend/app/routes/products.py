from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db
from ..services.finance import calculate_product_profit

router = APIRouter(prefix="/api/products", tags=["products"])


def _active_rate(db: Session) -> float | None:
    lender = db.query(models.Lender).filter(models.Lender.is_active == True).first()  # noqa: E712
    return lender.profit_rate if lender else None


@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Product)
        .options(joinedload(models.Product.vendor))
        .filter(models.Product.is_active == True)  # noqa: E712
    )
    if category:
        query = query.filter(models.Product.category == category)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%")
            | models.Product.category.ilike(f"%{search}%")
        )
    products = query.offset(skip).limit(limit).all()
    rate = _active_rate(db)
    for product in products:
        product.profit = calculate_product_profit(product.price, rate)
    return products


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(models.Product)
        .options(joinedload(models.Product.vendor))
        .filter(models.Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.profit = calculate_product_profit(product.price, _active_rate(db))
    return product


@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can create products")
    vendor = db.query(models.Vendor).filter(models.Vendor.id == product.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot create for another vendor")

    monthly_saving = product.monthly_saving or round(product.price * 0.02, 2)
    annual_saving = product.annual_saving or monthly_saving * 12
    db_product = models.Product(
        **product.model_dump(),
        profit=calculate_product_profit(product.price, _active_rate(db)),
        monthly_saving=monthly_saving,
        annual_saving=annual_saving,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
