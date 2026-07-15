from app.core.database import SessionLocal
from app.models.application import Application
from app.models.policy import Policy
from app.models.holding import Holding
from app.models.audit import AuditLog
from sqlalchemy import text

db = SessionLocal()
db.execute(text('TRUNCATE TABLE audit_logs CASCADE'))
db.execute(text('TRUNCATE TABLE policies CASCADE'))
db.execute(text('TRUNCATE TABLE holdings CASCADE'))
db.execute(text('TRUNCATE TABLE applications CASCADE'))
db.commit()
print("Applications, Products, and Audits cleared.")
