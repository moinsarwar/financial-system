from sqlalchemy import Column, String, DateTime, JSON, ForeignKey  
from app.core.database import Base  
from datetime import datetime, timezone  
  
class Holding(Base):  
    __tablename__ = "holdings"  
    id = Column(String, primary_key=True)  
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"))  
    application_id = Column(String, ForeignKey("applications.id", ondelete="SET NULL"), unique=True, nullable=True)  
    product_type = Column(String, nullable=False)  
    product_label = Column(String, nullable=False)  
    holding_type = Column(String, nullable=False)  
    status = Column(String, default="active")  
    opened_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    details = Column(JSON, default=dict)
