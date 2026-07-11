from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        String,
        primary_key=True,
    )

    client_id = Column(
        String,
        ForeignKey(
            "clients.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    type = Column(
        String,
        nullable=False,
    )

    name = Column(
        String,
        nullable=False,
    )

    original_filename = Column(
        String,
        nullable=False,
    )

    ref_id = Column(
        String,
        nullable=True,
    )

    ref_type = Column(
        String,
        nullable=True,
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    status = Column(
        String,
        nullable=False,
        default="pending",
    )

    file_url = Column(
        String,
        nullable=True,
    )

    mime_type = Column(
        String,
        nullable=True,
    )

    size_bytes = Column(
        Integer,
        nullable=True,
    )

    checksum = Column(
        String,
        nullable=True,
    )

    storage_key = Column(
        String,
        nullable=True,
    )

    uploaded_by_user = Column(
        String,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )
