import hashlib
from database import SessionLocal, engine, Base, AdminUser

def hash_password(password: str) -> str:
    # A simple SHA-256 hash for demonstration purposes
    return hashlib.sha256(password.encode()).hexdigest()

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    admin_email = "admin@tezqarza.com"
    
    existing_admin = db.query(AdminUser).filter(AdminUser.email == admin_email).first()
    if not existing_admin:
        admin = AdminUser(
            email=admin_email,
            hashed_password=hash_password("admin123")
        )
        db.add(admin)
        db.commit()
        print(f"Admin user {admin_email} created.")
    else:
        print(f"Admin user {admin_email} already exists.")
    
    db.close()

if __name__ == "__main__":
    seed_db()
