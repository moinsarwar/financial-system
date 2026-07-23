from fastapi import APIRouter, Depends, HTTPException, status  
from sqlalchemy.orm import Session  
from typing import List  
  
from .. import crud, schemas, models  
from ..database import get_db  
  
router = APIRouter()  
  
@router.get("/", response_model=List[schemas.Reseller])  
def read_resellers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):  
    resellers = crud.get_resellers(db, skip=skip, limit=limit)  
    return resellers  
  
@router.post("/", response_model=schemas.Reseller, status_code=status.HTTP_201_CREATED)  
def create_reseller(reseller: schemas.ResellerCreate, db: Session = Depends(get_db)):  
    # Check for existing subdomain or email  
    if crud.get_reseller_by_subdomain(db, reseller.subdomain):  
        raise HTTPException(status_code=400, detail="Subdomain already registered")  
    if crud.get_reseller_by_email(db, reseller.email):  
        raise HTTPException(status_code=400, detail="Email already registered")  
    return crud.create_reseller(db, reseller)  
  
@router.get("/stats", response_model=schemas.ResellerStats)  
def get_stats(db: Session = Depends(get_db)):  
    return crud.get_reseller_stats(db)

@router.get("/{reseller_id}", response_model=schemas.Reseller)  
def read_reseller(reseller_id: int, db: Session = Depends(get_db)):  
    db_reseller = crud.get_reseller(db, reseller_id)  
    if not db_reseller:  
        raise HTTPException(status_code=404, detail="Reseller not found")  
    return db_reseller  
  
@router.put("/{reseller_id}", response_model=schemas.Reseller)  
def update_reseller(reseller_id: int, reseller_update: schemas.ResellerUpdate, db: Session = Depends(get_db)):  
    db_reseller = crud.update_reseller(db, reseller_id, reseller_update)  
    if not db_reseller:  
        raise HTTPException(status_code=404, detail="Reseller not found")  
    return db_reseller  
  
@router.delete("/{reseller_id}", status_code=status.HTTP_204_NO_CONTENT)  
def delete_reseller(reseller_id: int, db: Session = Depends(get_db)):  
    if not crud.delete_reseller(db, reseller_id):  
        raise HTTPException(status_code=404, detail="Reseller not found")  
    return
