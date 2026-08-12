from fastapi import APIRouter, Depends, HTTPException, status  
from sqlalchemy.orm import Session  
from typing import List  
  
from .. import crud, schemas  
from ..database import get_db  
  
router = APIRouter()  
  
@router.get("/reseller/{reseller_id}", response_model=List[schemas.Customer])  
def read_customers(reseller_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):  
    # Optionally check if reseller exists  
    customers = crud.get_customers_by_reseller(db, reseller_id, skip=skip, limit=limit)  
    return customers  
  
@router.post("/", response_model=schemas.Customer, status_code=status.HTTP_201_CREATED)  
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):  
    # Check if reseller exists (optional)  
    return crud.create_customer(db, customer)
