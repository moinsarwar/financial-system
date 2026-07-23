import sys  
import os  
sys.path.append(os.path.dirname(os.path.abspath(__file__)))  
  
from app.database import SessionLocal, engine, Base  
from app import crud, schemas, models  
from app.models import ResellerStatus  
from datetime import datetime  
  
def seed():  
    # Create tables if they don't exist (optional)  
    Base.metadata.create_all(bind=engine)  
      
    db = SessionLocal()  
      
    # Check if any resellers exist  
    if db.query(models.Reseller).count() > 0:  
        print("Database already has data. Skipping seed.")  
        db.close()  
        return  
      
    # Create sample resellers  
    reseller_data = [  
        {  
            "name": "Ahmed Khan",  
            "business_name": "FinCompare Solutions",  
            "subdomain": "ahmedfin",  
            "email": "ahmed@fincompare.pk",  
            "phone": "0300-1234567",  
            "market_focus": "All",  
            "status": ResellerStatus.ACTIVE,  
            "conversions": 82,  
            "commission": 142500,  
        },  
        {  
            "name": "Fatima Ali",  
            "business_name": "Ali Mortgages",  
            "subdomain": "fatimahome",  
            "email": "fatima@ali.pk",  
            "phone": "0300-7654321",  
            "market_focus": "Mortgage",  
            "status": ResellerStatus.ACTIVE,  
            "conversions": 115,  
            "commission": 210000,  
        },  
        {  
            "name": "Usman Sheikh",  
            "business_name": "Sheikh Insurance",  
            "subdomain": "usmaninsure",  
            "email": "usman@sheikh.pk",  
            "phone": "0300-9876543",  
            "market_focus": "Insurance",  
            "status": ResellerStatus.PENDING,  
            "conversions": 0,  
            "commission": 0,  
        },  
    ]  
      
    reseller_objs = []  
    for data in reseller_data:  
        # Create reseller using CRUD  
        reseller_create = schemas.ResellerCreate(  
            name=data["name"],  
            business_name=data["business_name"],  
            subdomain=data["subdomain"],  
            email=data["email"],  
            phone=data["phone"],  
            market_focus=data["market_focus"],  
        )  
        db_reseller = crud.create_reseller(db, reseller_create)  
        # Manually update status, conversions, commission (since create only sets defaults)  
        db_reseller.status = data["status"]  
        db_reseller.conversions = data["conversions"]  
        db_reseller.commission = data["commission"]  
        db.commit()  
        db.refresh(db_reseller)  
        reseller_objs.append(db_reseller)  
      
    # Add customers for first reseller (Ahmed)  
    customer_names = ["Ali Raza", "Sara Khan", "Usman Chaudhry", "Fatima Noor", "Bilal Ahmed"]  
    products = ["Home Loan", "Credit Card", "Health Insurance", "Personal Loan", "Car Loan"]  
    statuses = ["Approved", "Pending", "Approved", "In Progress", "Approved"]  
      
    for i, name in enumerate(customer_names):  
        customer = schemas.CustomerCreate(  
            name=name,  
            email=f"{name.lower().replace(' ', '')}@example.com",  
            product=products[i % len(products)],  
            status=statuses[i % len(statuses)],  
            reseller_id=reseller_objs[0].id  
        )  
        crud.create_customer(db, customer)  
      
    # Add activities for Ahmed  
    activity_dates = ["2026-07-18", "2026-07-17", "2026-07-16", "2026-07-15", "2026-07-14"]  
    products_act = ["Home Loan (HBL)", "Personal Loan (UBL)", "Credit Card (MCB)", "Health Insurance (Jubilee)", "Car Loan (Meezan)"]  
    conv_statuses = ["Approved", "Pending", "Approved", "Approved", "Declined"]  
    commissions = [12500, 0, 3800, 8200, 0]  
      
    for i in range(5):  
        activity = schemas.ActivityCreate(  
            product=products_act[i],  
            conversion_status=conv_statuses[i],  
            commission=commissions[i],  
            reseller_id=reseller_objs[0].id  
        )  
        crud.create_activity(db, activity)  
      
    # Add testimonials for Ahmed  
    testimonials_data = [  
        ("Ali Raza", "The comparison tool saved me hours! I got the best loan rate in minutes.", 5),  
        ("Sara Khan", "Amazing platform. Found the perfect health insurance for my family.", 5),  
        ("Usman Chaudhry", "Simple, fast, and reliable. Highly recommend to everyone.", 4),  
    ]  
    for name, comment, rating in testimonials_data:  
        testimonial = schemas.TestimonialCreate(  
            name=name,  
            comment=comment,  
            rating=rating,  
            reseller_id=reseller_objs[0].id  
        )  
        crud.create_testimonial(db, testimonial)  
      
    # Add a second reseller (Fatima) with some data  
    # ... (optional)  
      
    print("✅ Database seeded successfully!")  
    db.close()  
  
if __name__ == "__main__":  
    seed()
