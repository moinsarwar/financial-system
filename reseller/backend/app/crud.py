from sqlalchemy.orm import Session  
from sqlalchemy import func  
from typing import Optional, List  
  
from . import models, schemas  
  
# ---------- Reseller ----------  
def get_reseller(db: Session, reseller_id: int):  
    return db.query(models.Reseller).filter(models.Reseller.id == reseller_id).first()  
  
def get_reseller_by_subdomain(db: Session, subdomain: str):  
    return db.query(models.Reseller).filter(models.Reseller.subdomain == subdomain).first()  
  
def get_reseller_by_email(db: Session, email: str):  
    return db.query(models.Reseller).filter(models.Reseller.email == email).first()  
  
def get_resellers(db: Session, skip: int = 0, limit: int = 100):  
    return db.query(models.Reseller).offset(skip).limit(limit).all()  
  
def create_reseller(db: Session, reseller: schemas.ResellerCreate):  
    db_reseller = models.Reseller(  
        name=reseller.name,  
        business_name=reseller.business_name,  
        subdomain=reseller.subdomain,  
        email=reseller.email,  
        phone=reseller.phone,  
        market_focus=reseller.market_focus,  
    )  
    db.add(db_reseller)  
    db.commit()  
    db.refresh(db_reseller)  
    return db_reseller  
  
def update_reseller(db: Session, reseller_id: int, reseller_update: schemas.ResellerUpdate):  
    db_reseller = get_reseller(db, reseller_id)  
    if not db_reseller:  
        return None  
    for key, value in reseller_update.dict(exclude_unset=True).items():  
        setattr(db_reseller, key, value)  
    db.commit()  
    db.refresh(db_reseller)  
    return db_reseller  
  
def delete_reseller(db: Session, reseller_id: int):  
    db_reseller = get_reseller(db, reseller_id)  
    if db_reseller:  
        db.delete(db_reseller)  
        db.commit()  
        return True  
    return False  
  
# ---------- Customer ----------  
def get_customers_by_reseller(db: Session, reseller_id: int, skip: int = 0, limit: int = 100):  
    return db.query(models.Customer).filter(models.Customer.reseller_id == reseller_id).offset(skip).limit(limit).all()  
  
def create_customer(db: Session, customer: schemas.CustomerCreate):  
    db_customer = models.Customer(**customer.dict())  
    db.add(db_customer)  
    db.commit()  
    db.refresh(db_customer)  
    return db_customer  
  
# ---------- Activity ----------  
def get_activities_by_reseller(db: Session, reseller_id: int, skip: int = 0, limit: int = 100):  
    return db.query(models.Activity).filter(models.Activity.reseller_id == reseller_id).order_by(models.Activity.date.desc()).offset(skip).limit(limit).all()  
  
def create_activity(db: Session, activity: schemas.ActivityCreate):  
    db_activity = models.Activity(**activity.dict())  
    db.add(db_activity)  
    db.commit()  
    db.refresh(db_activity)  
    return db_activity  
  
# ---------- Testimonial ----------  
def get_testimonials_by_reseller(db: Session, reseller_id: int):  
    return db.query(models.Testimonial).filter(models.Testimonial.reseller_id == reseller_id).all()  
  
def create_testimonial(db: Session, testimonial: schemas.TestimonialCreate):  
    db_testimonial = models.Testimonial(**testimonial.dict())  
    db.add(db_testimonial)  
    db.commit()  
    db.refresh(db_testimonial)  
    return db_testimonial  
  
# ---------- Stats ----------  
def get_reseller_stats(db: Session) -> schemas.ResellerStats:  
    total = db.query(models.Reseller).count()  
    active = db.query(models.Reseller).filter(models.Reseller.status == models.ResellerStatus.ACTIVE).count()  
    pending = db.query(models.Reseller).filter(models.Reseller.status == models.ResellerStatus.PENDING).count()  
    total_conv = db.query(func.sum(models.Reseller.conversions)).scalar() or 0  
    total_comm = db.query(func.sum(models.Reseller.commission)).scalar() or 0.0  
    return schemas.ResellerStats(  
        total_resellers=total,  
        active_resellers=active,  
        pending_resellers=pending,  
        total_conversions=total_conv,  
        total_commission=total_comm  
    )
