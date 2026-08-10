from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.get("/", response_model=List[schemas.VendorResponse])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).filter(models.Vendor.is_active == True).all()  # noqa: E712


@router.get("/me/products", response_model=List[schemas.ProductResponse])
def my_products(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendors only")
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.vendor))
        .filter(models.Product.vendor_id == current_user["id"])
        .all()
    )


@router.get("/me/applications", response_model=List[schemas.ApplicationResponse])
def my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendors only")
    return (
        db.query(models.Application)
        .options(
            joinedload(models.Application.product),
            joinedload(models.Application.vendor),
            joinedload(models.Application.user),
            joinedload(models.Application.repayments),
        )
        .filter(models.Application.vendor_id == current_user["id"])
        .order_by(models.Application.id.desc())
        .all()
    )


@router.get("/me/cash-sales", response_model=List[schemas.CashSaleResponse])
def my_cash_sales(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendors only")
    return (
        db.query(models.CashSale)
        .options(joinedload(models.CashSale.product))
        .filter(models.CashSale.vendor_id == current_user["id"])
        .order_by(models.CashSale.id.desc())
        .all()
    )


@router.post("/me/cash-sales", response_model=schemas.CashSaleResponse)
def create_cash_sale(
    payload: schemas.CashSaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendors only")
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == payload.product_id,
            models.Product.vendor_id == current_user["id"],
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found for this vendor")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if not payload.buyer_name.strip():
        raise HTTPException(status_code=400, detail="Buyer name required")

    sale = models.CashSale(
        vendor_id=current_user["id"],
        product_id=product.id,
        buyer_name=payload.buyer_name.strip(),
        amount=payload.amount,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return (
        db.query(models.CashSale)
        .options(joinedload(models.CashSale.product))
        .filter(models.CashSale.id == sale.id)
        .first()
    )
