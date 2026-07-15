from app.core.database import SessionLocal
from app.models.application import Application
from app.models.policy import Policy
from app.models.holding import Holding
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.models.client import Client
from sqlalchemy import text

db = SessionLocal()

# Find the client_id for client@finos.com
demo_client_user = db.query(User).filter(User.email == 'client@finos.com').first()
demo_client_id = demo_client_user.client_id if demo_client_user else None

# Delete all users with role CLIENT except client@finos.com
db.query(User).filter(User.role == UserRole.CLIENT, User.email != 'client@finos.com').delete()

# Delete all clients except demo_client_id
if demo_client_id:
    db.query(Client).filter(Client.id != demo_client_id).delete()
else:
    db.query(Client).delete()

db.commit()
print("Other clients deleted.")
