from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from sqlalchemy.dialects.postgresql import JSONB

class FrontProduct(Base):
    __tablename__ = "front_products"
    product_id = Column(String, primary_key=True)
    provider_id = Column(String)
    product_type = Column(String)
    jurisdiction = Column(JSONB)
    status = Column(String)
    version = Column(String)
    last_updated = Column(DateTime(timezone=True))
    pricing = Column(JSONB)
    eligibility_rules = Column(JSONB)
    features = Column(JSONB)
    compliance = Column(JSONB)
    schema_hash = Column(String)
    effective_date = Column(String)
    published_by = Column(String)
    approved_by = Column(String)
    change_request = Column(String)
    previous_version = Column(String)
