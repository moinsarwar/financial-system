from sqlalchemy import Column, String, DateTime, Integer, Numeric, JSON, ForeignKey  
from sqlalchemy.ext.mutable import MutableList  
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base  
from datetime import datetime, timezone  
  
class Application(Base):  
    __tablename__ = "applications"  
    id = Column(String, primary_key=True)  
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"))  
    product_type = Column(String, nullable=False)  
    product_label = Column(String, nullable=False)  
    department = Column(String)  
    steps = Column(MutableList.as_mutable(JSON), default=list)  
    step_index = Column(Integer, default=0)  
    current_step = Column(String, nullable=False)  
    amount = Column(Numeric(18, 2), nullable=False)  
    currency = Column(String, default="PKR")  
    status = Column(String, default="in-progress")  
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))  
    timeline = Column(MutableList.as_mutable(JSON), default=list)  
    decision_reason_code = Column(String, nullable=True)  
    decision_notes = Column(String, nullable=True)  
    decided_at = Column(DateTime(timezone=True), nullable=True)  
    decided_by_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    unified_data = Column(JSONB, nullable=True)
    unified_schema_version = Column(String(20), nullable=True)
