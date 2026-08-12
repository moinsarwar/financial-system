"""Ensure DB columns exist (create_all does not ALTER existing tables)."""
from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

USER_COLUMNS = [
    ("invite_token", "VARCHAR"),
    ("invite_expires_at", "TIMESTAMP"),
    ("must_set_password", "BOOLEAN DEFAULT FALSE"),
]


def ensure_schema(engine: Engine) -> None:
    with engine.begin() as conn:
        for col, typedef in USER_COLUMNS:
            exists = conn.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = :col
                    """
                ),
                {"col": col},
            ).scalar()
            if not exists:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typedef}"))
                logger.info("Added users.%s", col)
