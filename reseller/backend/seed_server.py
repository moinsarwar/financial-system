from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def seed():
    db = SessionLocal()
    admin = db.query(models.User).filter_by(email='admin@reseller.com').first()
    if not admin:
        db.add(models.User(email='admin@reseller.com', hashed_password=get_password_hash('admin123'), role='admin'))
        print("Seeded admin")
    
    reseller = db.query(models.User).filter_by(email='ahmed@fincompare.pk').first()
    if not reseller:
        db.add(models.User(email='ahmed@fincompare.pk', hashed_password=get_password_hash('ahmed123'), role='reseller', reseller_id=1))
        print("Seeded reseller")
    
    db.commit()
    print('Users seeded successfully!')

if __name__ == '__main__':
    seed()
