"""Add unified_data (JSONB) and unified_schema_version to applications

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('applications',
        sa.Column('unified_data', JSONB, nullable=True)
    )
    op.add_column('applications',
        sa.Column('unified_schema_version', sa.String(20), nullable=True)
    )

def downgrade():
    op.drop_column('applications', 'unified_schema_version')
    op.drop_column('applications', 'unified_data')
