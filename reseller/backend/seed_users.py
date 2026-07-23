import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash

def seed_users():
    db = SessionLocal()
    
    # Create tables if not exist
    models.Base.metadata.create_all(bind=engine)
    
    # 1. Check/Create Admin
    admin_email = "admin@reseller.com"
    admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin:
        admin = models.User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        print("Admin user created: admin@reseller.com / admin123")
    else:
        print("Admin user already exists.")
        
    # 2. Check/Create a Reseller profile and user
    reseller_email = "ahmed@fincompare.pk"
    reseller_profile = db.query(models.Reseller).filter(models.Reseller.email == reseller_email).first()
    if not reseller_profile:
        reseller_profile = models.Reseller(
            name="Ahmed Khan",
            business_name="FinCompare Solutions",
            subdomain="ahmedfin",
            email=reseller_email,
            status=models.ResellerStatus.ACTIVE
        )
        db.add(reseller_profile)
        db.commit()
        db.refresh(reseller_profile)
        print("Reseller profile created for Ahmed Khan")
    
    reseller_user = db.query(models.User).filter(models.User.email == reseller_email).first()
    if not reseller_user:
        reseller_user = models.User(
            email=reseller_email,
            hashed_password=get_password_hash("ahmed123"),
            role="reseller",
            reseller_id=reseller_profile.id
        )
        db.add(reseller_user)
        print("Reseller user created: ahmed@fincompare.pk / ahmed123")
    else:
        # If user exists, maybe update password?
        print("Reseller user already exists.")
        
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_users()
