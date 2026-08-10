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
    include_inactive: bool = False,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product).options(joinedload(models.Product.vendor))
    if not include_inactive:
        query = query.filter(models.Product.is_active == True)  # noqa: E712
    if category:
        query = query.filter(models.Product.category == category)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%")
            | models.Product.category.ilike(f"%{search}%")
        )
    if vendor_id is not None:
        query = query.filter(models.Product.vendor_id == vendor_id)
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
    role = current_user["role"]
    if role not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Only vendors/admins can create products")

    data = product.model_dump()
    if role == "vendor":
        data["vendor_id"] = current_user["id"]
    elif not data.get("vendor_id"):
        raise HTTPException(status_code=400, detail="vendor_id required for admin create")

    vendor = db.query(models.Vendor).filter(models.Vendor.id == data["vendor_id"]).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    monthly_saving = data.get("monthly_saving") or round(data["price"] * 0.02, 2)
    annual_saving = data.get("annual_saving") or monthly_saving * 12
    data["monthly_saving"] = monthly_saving
    data["annual_saving"] = annual_saving
    db_product = models.Product(
        **data,
        profit=calculate_product_profit(data["price"], _active_rate(db)),
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    role = current_user["role"]
    if role == "vendor" and product.vendor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot edit another vendor's product")
    if role not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(product, k, v)
    if "price" in data:
        product.profit = calculate_product_profit(product.price, _active_rate(db))
    db.commit()
    db.refresh(product)
    product.profit = calculate_product_profit(product.price, _active_rate(db))
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    role = current_user["role"]
    if role == "vendor" and product.vendor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot delete another vendor's product")
    if role not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")

    product.is_active = False
    db.commit()
    return {"ok": True, "id": product_id, "is_active": False}
