from sqlalchemy import Column, String, DateTime, Integer, Numeric, Boolean, JSON, ForeignKey  
from sqlalchemy.ext.mutable import MutableList  
from app.core.database import Base  
from datetime import datetime, timezone  
  
class Claim(Base):  
    __tablename__ = "claims"  
    id = Column(String, primary_key=True)  
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"))  
    product_type = Column(String, nullable=False)  
    product_label = Column(String, nullable=False)  
    policy_id = Column(String, ForeignKey("policies.id", ondelete="SET NULL"), nullable=True)  
    type = Column(String, nullable=False)  
    amount = Column(Numeric(18, 2), nullable=False)  
    currency = Column(String, default="PKR")  
    current_step = Column(String, nullable=False)  
    step_index = Column(Integer, default=0)  
    steps = Column(MutableList.as_mutable(JSON), default=list)  
    outcome = Column(String, nullable=True)  
    incident_date = Column(DateTime(timezone=True), nullable=False)  
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))  
    description = Column(String, nullable=False)  
    severity = Column(String, default="Standard")  
    reserve_amount = Column(Numeric(18, 2), default=0)  
    approved_amount = Column(Numeric(18, 2), default=0)  
    excess = Column(Numeric(18, 2), default=0)  
    fraud_indicator = Column(Boolean, default=False)  
    payment_ref = Column(String, nullable=True)  
    insurer_ref = Column(String, nullable=True)  
    timeline = Column(MutableList.as_mutable(JSON), default=list)  
    resolution_reason_code = Column(String, nullable=True)  
    resolution_notes = Column(String, nullable=True)  
    resolved_at = Column(DateTime(timezone=True), nullable=True)  
    resolved_by_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
