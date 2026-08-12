"""part 6a integration corrections

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column(
            "original_filename",
            sa.String(),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE documents
        SET original_filename = name
        WHERE original_filename IS NULL
        """
    )

    op.alter_column(
        "documents",
        "original_filename",
        existing_type=sa.String(),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column(
        "documents",
        "original_filename",
    )
