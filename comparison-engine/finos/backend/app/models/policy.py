from sqlalchemy import Column, String, DateTime, Numeric, JSON, ForeignKey  
from app.core.database import Base  
from datetime import datetime, timezone  
  
class Policy(Base):  
    __tablename__ = "policies"  
    id = Column(String, primary_key=True)  
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"))  
    product_type = Column(String, nullable=False)  
    product_label = Column(String, nullable=False)  
    application_id = Column(String, ForeignKey("applications.id", ondelete="SET NULL"), unique=True, nullable=True)  
    policy_number = Column(String, unique=True, nullable=False)  
    start_date = Column(DateTime(timezone=True), nullable=True)  
    end_date = Column(DateTime(timezone=True), nullable=True)  
    premium = Column(Numeric(18, 2), nullable=True)  
    sum_assured = Column(Numeric(18, 2), nullable=True)  
    status = Column(String, default="active")  
    details = Column(JSON, default=dict)  
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
