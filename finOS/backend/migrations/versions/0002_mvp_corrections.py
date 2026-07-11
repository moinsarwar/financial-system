"""mvp corrections: decimal, non-null full_name, reason codes  
  
Revision ID: 0002  
Revises: initial  
Create Date: 2026-07-10  
  
"""  
from alembic import op  
import sqlalchemy as sa  
from sqlalchemy.dialects.postgresql import ENUM  
  
revision = "0002"  
down_revision = "initial"  
branch_labels = None  
depends_on = None  
  
def upgrade():  
    # 1. Change money columns to Numeric(18,2)  
    op.alter_column('applications', 'amount',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='amount::numeric(18,2)')  
    op.alter_column('policies', 'premium',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='premium::numeric(18,2)')  
    op.alter_column('policies', 'sum_assured',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='sum_assured::numeric(18,2)')  
    op.alter_column('claims', 'amount',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='amount::numeric(18,2)')  
    op.alter_column('claims', 'reserve_amount',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='reserve_amount::numeric(18,2)')  
    op.alter_column('claims', 'approved_amount',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='approved_amount::numeric(18,2)')  
    op.alter_column('claims', 'excess',  
                    type_=sa.Numeric(18, 2),  
                    postgresql_using='excess::numeric(18,2)')  
  
    # 2. Make full_name non-nullable  
    op.execute("UPDATE users SET full_name = email WHERE full_name IS NULL")  
    op.alter_column('users', 'full_name',  
                    existing_type=sa.String(),  
                    nullable=False)  
  
    # 3. Add reason columns and foreign keys  
    op.add_column('applications', sa.Column('decision_reason_code', sa.String(), nullable=True))  
    op.add_column('applications', sa.Column('decision_notes', sa.String(), nullable=True))  
    op.add_column('applications', sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True))  
    op.add_column('applications', sa.Column('decided_by_user_id', sa.String(), nullable=True))  
    op.create_foreign_key('fk_applications_decided_by_user', 'applications', 'users', ['decided_by_user_id'], ['id'], ondelete='SET NULL')  
  
    op.add_column('claims', sa.Column('resolution_reason_code', sa.String(), nullable=True))  
    op.add_column('claims', sa.Column('resolution_notes', sa.String(), nullable=True))  
    op.add_column('claims', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))  
    op.add_column('claims', sa.Column('resolved_by_user_id', sa.String(), nullable=True))  
    op.create_foreign_key('fk_claims_resolved_by_user', 'claims', 'users', ['resolved_by_user_id'], ['id'], ondelete='SET NULL')  
  
    # 4. Indexes  
    op.create_index('ix_applications_decision_reason_code', 'applications', ['decision_reason_code'])  
    op.create_index('ix_claims_resolution_reason_code', 'claims', ['resolution_reason_code'])  
  
def downgrade():  
    op.drop_index('ix_claims_resolution_reason_code')  
    op.drop_index('ix_applications_decision_reason_code')  
    op.drop_constraint('fk_claims_resolved_by_user', 'claims', type_='foreignkey')  
    op.drop_constraint('fk_applications_decided_by_user', 'applications', type_='foreignkey')  
    op.drop_column('claims', 'resolved_by_user_id')  
    op.drop_column('claims', 'resolved_at')  
    op.drop_column('claims', 'resolution_notes')  
    op.drop_column('claims', 'resolution_reason_code')  
    op.drop_column('applications', 'decided_by_user_id')  
    op.drop_column('applications', 'decided_at')  
    op.drop_column('applications', 'decision_notes')  
    op.drop_column('applications', 'decision_reason_code')  
    op.alter_column('users', 'full_name', nullable=True)  
    # Revert to Float  
    op.alter_column('claims', 'excess', type_=sa.Float(), postgresql_using='excess::float')  
    op.alter_column('claims', 'approved_amount', type_=sa.Float(), postgresql_using='approved_amount::float')  
    op.alter_column('claims', 'reserve_amount', type_=sa.Float(), postgresql_using='reserve_amount::float')  
    op.alter_column('claims', 'amount', type_=sa.Float(), postgresql_using='amount::float')  
    op.alter_column('policies', 'sum_assured', type_=sa.Float(), postgresql_using='sum_assured::float')  
    op.alter_column('policies', 'premium', type_=sa.Float(), postgresql_using='premium::float')  
    op.alter_column('applications', 'amount', type_=sa.Float(), postgresql_using='amount::float')
