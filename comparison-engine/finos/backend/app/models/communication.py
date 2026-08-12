from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class Communication(Base):
    __tablename__ = "communications"
    id = Column(String, primary_key=True, default=lambda: f"MSG-{uuid.uuid4().hex[:8].upper()}")
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    sender_id = Column(String, ForeignKey("users.id"))
    sender_role = Column(String)
    sender_name = Column(String)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class MessageReceipt(Base):
    __tablename__ = "message_receipts"
    id = Column(String, primary_key=True, default=lambda: f"RCP-{uuid.uuid4().hex[:8].upper()}")
    message_id = Column(String, ForeignKey("communications.id", ondelete="CASCADE"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
