from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=schemas.AssumptionOut)
def get_assumptions(db: Session = Depends(get_db)):
    row = db.query(models.ModelAssumption).first()
    if not row:
        raise HTTPException(status_code=404, detail="Assumptions not seeded")
    return row
