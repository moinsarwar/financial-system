from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime

from .. import crud, schemas, models
from ..database import get_db

router = APIRouter()

class WebhookStatusPayload(BaseModel):
    subdomain: str
    application_id: str
    product_name: str
    amount: float
    customer_name: str
    customer_email: EmailStr
    status: str

@router.post("/commission", status_code=status.HTTP_200_OK)
def process_status_update(payload: WebhookStatusPayload, db: Session = Depends(get_db)):
    # Verify reseller exists
    db_reseller = crud.get_reseller_by_subdomain(db, payload.subdomain)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found")

    reseller_id = db_reseller.id

    display_status = "Approved" if payload.status.lower() == "completed" else payload.status.capitalize()
    
    # Calculate commission (10% of product amount)
    commission_amount = payload.amount * 0.10

    # Check if customer exists
    customer = db.query(models.Customer).filter(models.Customer.application_id == payload.application_id).first()
    if not customer:
        customer = models.Customer(
            name=payload.customer_name,
            email=payload.customer_email,
            product=payload.product_name,
            status=display_status,
            reseller_id=reseller_id,
            application_id=payload.application_id,
            date=datetime.utcnow()
        )
        db.add(customer)
    else:
        customer.status = display_status
    
    # Check if activity exists
    activity = db.query(models.Activity).filter(models.Activity.application_id == payload.application_id).first()
    is_newly_completed = False
    
    if not activity:
        activity = models.Activity(
            product=payload.product_name,
            conversion_status=display_status,
            commission=0.0,
            reseller_id=reseller_id,
            application_id=payload.application_id,
            date=datetime.utcnow()
        )
        db.add(activity)
        if display_status == "Approved":
            is_newly_completed = True
    else:
        # If it wasn't approved before, but now is approved
        if activity.conversion_status != "Approved" and display_status == "Approved":
            is_newly_completed = True
        activity.conversion_status = display_status

    # Update Reseller commission only if newly completed
    if is_newly_completed:
        activity.commission = commission_amount
        db_reseller.commission += commission_amount
        db_reseller.conversions += 1

    db.commit()

    return {"status": "success", "message": "Status updated successfully"}
