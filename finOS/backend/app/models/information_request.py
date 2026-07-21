from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class InformationRequest(Base):
    __tablename__ = "information_requests"
    id = Column(String, primary_key=True, default=lambda: f"REQ-{uuid.uuid4().hex[:8].upper()}")
    public_id = Column(String, unique=True, index=True, default=lambda: uuid.uuid4().hex[:12])
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    kind = Column(String, nullable=False) # 'document' or 'text'
    label = Column(String, nullable=False)
    document_requirement_code = Column(String, nullable=True)
    response_text = Column(Text, nullable=True)
    status = Column(String, default="open", index=True) # open, submitted, resolved, cancelled
    requested_by_id = Column(String, ForeignKey("users.id"))
    resolved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
