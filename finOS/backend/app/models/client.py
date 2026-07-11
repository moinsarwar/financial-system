from sqlalchemy import Column, String, DateTime, Boolean, Enum, Integer  
from app.core.database import Base  
from datetime import datetime, timezone  
import enum  
  
class LifecycleStage(str, enum.Enum):  
    LEAD = "lead"  
    APPLICANT = "applicant"  
    CUSTOMER = "customer"  
  
class Client(Base):  
    __tablename__ = "clients"  
    id = Column(String, primary_key=True)  
    name = Column(String, nullable=False)  
    email = Column(String, unique=True, nullable=False)  
    phone = Column(String)  
    lifecycle_stage = Column(  
        Enum(  
            LifecycleStage,  
            name="lifecyclestage",  
            values_callable=lambda enum_class: [member.value for member in enum_class],  
        ),  
        nullable=False,  
        default=LifecycleStage.LEAD,  
    )  
    has_open_claim = Column(Boolean, default=False)  
    assigned_department = Column(String)  
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    last_activity = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))  
    engagement_score = Column(Integer, default=50)
