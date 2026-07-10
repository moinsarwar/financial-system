from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, JSON, Boolean
from sqlalchemy.sql import func
from .database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    LFE_RECEIVED = "lfe_received"
    LFE_PROCESSING = "lfe_processing"
    LFE_DECIDED = "lfe_decided"
    REFERRED = "referred"
    FAILED = "failed"

class LfeDecision(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    REVIEW = "review"
    CONDITIONAL = "conditional"
    NO_MATCH = "no_match"

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    lfe_product_id = Column(String, index=True)
    name = Column(String, nullable=False)
    icon = Column(String)
    type = Column(String)
    group_name = Column(String)
    max_amount = Column(Float)
    min_tenure = Column(Integer)
    max_tenure = Column(Integer)
    tag = Column(String)
    ideal = Column(String)
    processing = Column(String)
    active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime(timezone=True), default=func.now())

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    ref = Column(String, unique=True, index=True)
    product_id = Column(String, index=True)
    full_name = Column(String)

    cnic_encrypted = Column(String, nullable=True)
    mobile_encrypted = Column(String, nullable=True)
    cnic_masked = Column(String, nullable=True)
    mobile_masked = Column(String, nullable=True)

    income = Column(Float)
    liabilities = Column(Float)
    amount = Column(Float)
    tenure = Column(Integer)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SUBMITTED)
    decision = Column(Enum(LfeDecision), nullable=True)
    score = Column(Integer, nullable=True)
    risk_band = Column(String, nullable=True)
    route = Column(String, nullable=True)
    matched_lenders = Column(JSON, default=list)
    reason_codes = Column(JSON, default=list)
    policy_version = Column(String, nullable=True)
    audit_id = Column(String, nullable=True)
    lfe_application_id = Column(String, index=True, nullable=True)
    lfe_decision_id = Column(String, index=True, nullable=True)

    retry_count = Column(Integer, default=0)

    lfe_payload = Column(JSON, nullable=True)
    lfe_response = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
