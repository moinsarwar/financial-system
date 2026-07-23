from fastapi import APIRouter, Depends, HTTPException, status  
from sqlalchemy.orm import Session  
from typing import List  
  
from .. import crud, schemas  
from ..database import get_db  
  
router = APIRouter()  
  
@router.get("/reseller/{reseller_id}", response_model=List[schemas.Activity])  
def read_activities(reseller_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):  
    activities = crud.get_activities_by_reseller(db, reseller_id, skip=skip, limit=limit)  
    return activities  
  
@router.post("/", response_model=schemas.Activity, status_code=status.HTTP_201_CREATED)  
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):  
    return crud.create_activity(db, activity)
