import os
import uuid
import sys

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.client import Client, LifecycleStage
from app.core.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        print("Seeding test users...")

        client = db.query(Client).filter(Client.email=="client@finos.com").first()
        if not client:
            client_id = f"client-{uuid.uuid4().hex[:8]}"
            client = Client(
                id=client_id,
                name="Test Client",
                email="client@finos.com",
                phone="1234567890",
                lifecycle_stage=LifecycleStage.CUSTOMER
            )
            db.add(client)
            db.flush()

        client_user = db.query(User).filter(User.email=="client@finos.com").first()
        if not client_user:
            client_user = User(
                id=f"user-{uuid.uuid4().hex[:8]}",
                email="client@finos.com",
                hashed_password=get_password_hash("password123"),
                full_name="Test Client User",
                role=UserRole.CLIENT,
                client_id=client.id,
                is_active=True
            )
            db.add(client_user)

        ops_user = db.query(User).filter(User.email=="ops@finos.com").first()
        if not ops_user:
            ops_user = User(
                id=f"user-{uuid.uuid4().hex[:8]}",
                email="ops@finos.com",
                hashed_password=get_password_hash("password123"),
                full_name="Operations Manager",
                role=UserRole.OPERATIONS_MANAGER,
                client_id=None,
                is_active=True
            )
            db.add(ops_user)

        db.commit()
        print("Successfully seeded client@finos.com and ops@finos.com with password 'password123'")
    except Exception as e:
        print(f"Failed to seed users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
