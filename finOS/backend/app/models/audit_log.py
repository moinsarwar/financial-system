from sqlalchemy import Column, String, DateTime, JSON, ForeignKey  
from app.core.database import Base  
from datetime import datetime, timezone  
  
class AuditLog(Base):  
    __tablename__ = "audit_logs"  
    id = Column(String, primary_key=True)  
    time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    actor_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  
    client_id = Column(String, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)  
    subject_type = Column(String, nullable=True)  
    subject_id = Column(String, nullable=True)  
    event = Column(String, nullable=False)  
    details = Column(String, nullable=False)  
    department = Column(String, nullable=True)  
    request_id = Column(String, nullable=True)  
    ip_address = Column(String, nullable=True)  
    extra_data = Column(JSON, default=dict)
