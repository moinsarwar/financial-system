from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from app.core.database import Base
from datetime import datetime, timezone
import uuid


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: f"PAY-{uuid.uuid4().hex[:8].upper()}")
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String, default="PKR", nullable=False)
    status = Column(String, default="pending", nullable=False, index=True)  # pending|paid|failed|cancelled
    provider = Column(String, default="safepay", nullable=False)
    tracker = Column(String, unique=True, nullable=True, index=True)
    checkout_url = Column(Text, nullable=True)
    raw_events = Column(MutableList.as_mutable(JSONB), default=list)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
