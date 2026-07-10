from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .. import schemas, crud
from ..database import get_db
from ..utils.security import verify_admin_key

router = APIRouter()

@router.get("/", response_model=list[schemas.Product])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    products = await crud.get_products(db, skip, limit)
    return products

@router.get("/{product_id}", response_model=schemas.Product)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/sync", dependencies=[Depends(verify_admin_key)])
async def sync_products(db: AsyncSession = Depends(get_db)):
    await crud.sync_products_from_lfe(db)
    return {"status": "synced"}
