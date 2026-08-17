import os
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Appliance
from ..schemas import Appliance as ApplianceSchema

router = APIRouter()

MFG_FILTERS = {"ac", "cooler", "cooker", "fridge", "washer", "tv"}


def parse_price_num(price: str) -> float:
    digits = re.sub(r"[^\d]", "", price or "")
    return float(digits) if digits else 0.0


def apply_list_filters(rows: list[Appliance], filter_type: str | None) -> list[Appliance]:
    if filter_type == "new":
        return [r for r in rows if r.is_new]
    if filter_type == "inverter":
        return [r for r in rows if r.energy and "inverter" in r.energy.lower()]
    if filter_type == "budget":
        return [r for r in rows if parse_price_num(r.price) < 40000]
    if filter_type == "premium":
        return [r for r in rows if parse_price_num(r.price) > 80000]
    return rows


@router.get("/", response_model=list[ApplianceSchema])
def get_appliances(
    db: Session = Depends(get_db),
    category: str | None = None,
    mfg: str | None = None,
    search: str | None = None,
    filter_type: str | None = None,
    limit: int = 100,
):
    query = db.query(Appliance)

    segment = (mfg or category or "").lower()
    if segment and segment != "all":
        if segment in MFG_FILTERS:
            query = query.filter(Appliance.mfg == segment)
        else:
            query = query.filter(Appliance.category.ilike(segment))

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Appliance.name.ilike(term))
            | (Appliance.brand.ilike(term))
            | (Appliance.category.ilike(term))
            | (Appliance.variant.ilike(term))
        )

    rows = query.all()
    rows = apply_list_filters(rows, filter_type)
    rows.sort(key=lambda r: r.name or "")
    return rows[:limit]


@router.get("/{key}", response_model=ApplianceSchema)
def get_appliance(key: str, db: Session = Depends(get_db)):
    appliance = db.query(Appliance).filter(Appliance.key == key).first()
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return appliance
