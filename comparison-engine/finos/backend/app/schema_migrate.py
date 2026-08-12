"""Ensure DB columns exist (create_all / older DBs may miss invite fields)."""
from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

USER_COLUMNS = [
    ("invite_token", "VARCHAR"),
    ("invite_expires_at", "TIMESTAMPTZ"),
    ("must_set_password", "BOOLEAN DEFAULT FALSE"),
]


def _column_exists(conn, table: str, col: str) -> bool:
    return bool(
        conn.execute(
            text(
                """
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = :table
                  AND column_name = :col
                """
            ),
            {"table": table, "col": col},
        ).scalar()
    )


def ensure_schema(engine: Engine) -> None:
    with engine.begin() as conn:
        for col, typedef in USER_COLUMNS:
            if not _column_exists(conn, "users", col):
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typedef}"))
                logger.info("Added users.%s", col)

        if not _column_exists(conn, "claims", "holding_id"):
            conn.execute(
                text(
                    """
                    ALTER TABLE claims
                    ADD COLUMN holding_id VARCHAR
                    REFERENCES holdings(id) ON DELETE SET NULL
                    """
                )
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_claims_holding_id ON claims (holding_id)")
            )
            logger.info("Added claims.holding_id")

        payments_exists = conn.execute(
            text(
                """
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'payments'
                """
            )
        ).scalar()
        if not payments_exists:
            conn.execute(
                text(
                    """
                    CREATE TABLE payments (
                        id VARCHAR PRIMARY KEY,
                        application_id VARCHAR NOT NULL
                            REFERENCES applications(id) ON DELETE CASCADE,
                        client_id VARCHAR NOT NULL
                            REFERENCES clients(id) ON DELETE CASCADE,
                        amount NUMERIC(18, 2) NOT NULL,
                        currency VARCHAR NOT NULL DEFAULT 'PKR',
                        status VARCHAR NOT NULL DEFAULT 'pending',
                        provider VARCHAR NOT NULL DEFAULT 'safepay',
                        tracker VARCHAR UNIQUE,
                        checkout_url TEXT,
                        raw_events JSONB DEFAULT '[]'::jsonb,
                        paid_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_application_id ON payments (application_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_client_id ON payments (client_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_status ON payments (status)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payments_tracker ON payments (tracker)"))
            logger.info("Created payments table")
