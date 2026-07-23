from fastapi import APIRouter, Depends, HTTPException, status  
from sqlalchemy.orm import Session  
from typing import List  
  
from .. import crud, schemas  
from ..database import get_db  
  
router = APIRouter()  
  
@router.get("/reseller/{reseller_id}", response_model=List[schemas.Testimonial])  
def read_testimonials(reseller_id: int, db: Session = Depends(get_db)):  
    testimonials = crud.get_testimonials_by_reseller(db, reseller_id)  
    return testimonials  
  
@router.post("/", response_model=schemas.Testimonial, status_code=status.HTTP_201_CREATED)  
def create_testimonial(testimonial: schemas.TestimonialCreate, db: Session = Depends(get_db)):  
    return crud.create_testimonial(db, testimonial)
