"""initial  
  
Revision ID: initial  
Revises:  
Create Date: 2026-07-10  
  
"""  
  
from alembic import op  
import sqlalchemy as sa  
from sqlalchemy.dialects.postgresql import JSON  
  
  
revision = "initial"  
down_revision = None  
branch_labels = None  
depends_on = None  
  
  
def upgrade():  
    lifecycle_stage_enum = sa.Enum(  
        "lead",  
        "applicant",  
        "customer",  
        name="lifecyclestage",  
    )  
  
    user_role_enum = sa.Enum(  
        "client",  
        "operations_agent",  
        "operations_manager",  
        "claims_agent",  
        "underwriter",  
        "compliance",  
        "administrator",  
        name="userrole",  
    )  
  
    lifecycle_stage_enum.create(op.get_bind(), checkfirst=True)  
    user_role_enum.create(op.get_bind(), checkfirst=True)  
  
    op.create_table(  
        "clients",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("name", sa.String(), nullable=False),  
        sa.Column("email", sa.String(), nullable=False),  
        sa.Column("phone", sa.String(), nullable=True),  
        sa.Column(  
            "lifecycle_stage",  
            lifecycle_stage_enum,  
            nullable=False,  
            server_default="lead",  
        ),  
        sa.Column(  
            "has_open_claim",  
            sa.Boolean(),  
            nullable=False,  
            server_default=sa.text("false"),  
        ),  
        sa.Column(  
            "assigned_department",  
            sa.String(),  
            nullable=True,  
        ),  
        sa.Column(  
            "created_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "last_activity",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "engagement_score",  
            sa.Integer(),  
            nullable=False,  
            server_default="50",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
        sa.UniqueConstraint("email"),  
    )  
  
    op.create_table(  
        "users",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("email", sa.String(), nullable=False),  
        sa.Column("hashed_password", sa.String(), nullable=False),  
        sa.Column("full_name", sa.String(), nullable=True),  
        sa.Column(  
            "role",  
            user_role_enum,  
            nullable=False,  
        ),  
        sa.Column(  
            "client_id",  
            sa.String(),  
            nullable=True,  
        ),  
        sa.Column(  
            "is_active",  
            sa.Boolean(),  
            nullable=False,  
            server_default=sa.text("true"),  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="SET NULL",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
        sa.UniqueConstraint("email"),  
    )  
  
    op.create_table(  
        "applications",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("client_id", sa.String(), nullable=False),  
        sa.Column("product_type", sa.String(), nullable=False),  
        sa.Column("product_label", sa.String(), nullable=False),  
        sa.Column("department", sa.String(), nullable=True),  
        sa.Column(  
            "steps",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'[]'::json"),  
        ),  
        sa.Column(  
            "step_index",  
            sa.Integer(),  
            nullable=False,  
            server_default="0",  
        ),  
        sa.Column("current_step", sa.String(), nullable=False),  
        sa.Column("amount", sa.Float(), nullable=False),  
        sa.Column(  
            "currency",  
            sa.String(),  
            nullable=False,  
            server_default="PKR",  
        ),  
        sa.Column(  
            "status",  
            sa.String(),  
            nullable=False,  
            server_default="in-progress",  
        ),  
        sa.Column(  
            "created_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "updated_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "timeline",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'[]'::json"),  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="CASCADE",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
    )  
  
    op.create_table(  
        "policies",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("client_id", sa.String(), nullable=False),  
        sa.Column("product_type", sa.String(), nullable=False),  
        sa.Column("product_label", sa.String(), nullable=False),  
        sa.Column("application_id", sa.String(), nullable=True),  
        sa.Column("policy_number", sa.String(), nullable=False),  
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),  
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),  
        sa.Column("premium", sa.Float(), nullable=True),  
        sa.Column("sum_assured", sa.Float(), nullable=True),  
        sa.Column(  
            "status",  
            sa.String(),  
            nullable=False,  
            server_default="active",  
        ),  
        sa.Column(  
            "details",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'{}'::json"),  
        ),  
        sa.Column(  
            "created_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.ForeignKeyConstraint(  
            ["application_id"],  
            ["applications.id"],  
            ondelete="SET NULL",  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="CASCADE",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
        sa.UniqueConstraint("application_id"),  
        sa.UniqueConstraint("policy_number"),  
    )  
  
    op.create_table(  
        "holdings",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("client_id", sa.String(), nullable=False),  
        sa.Column("application_id", sa.String(), nullable=True),  
        sa.Column("product_type", sa.String(), nullable=False),  
        sa.Column("product_label", sa.String(), nullable=False),  
        sa.Column("holding_type", sa.String(), nullable=False),  
        sa.Column(  
            "status",  
            sa.String(),  
            nullable=False,  
            server_default="active",  
        ),  
        sa.Column(  
            "opened_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "details",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'{}'::json"),  
        ),  
        sa.ForeignKeyConstraint(  
            ["application_id"],  
            ["applications.id"],  
            ondelete="SET NULL",  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="CASCADE",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
        sa.UniqueConstraint("application_id"),  
    )  
  
    op.create_table(  
        "claims",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("client_id", sa.String(), nullable=False),  
        sa.Column("product_type", sa.String(), nullable=False),  
        sa.Column("product_label", sa.String(), nullable=False),  
        sa.Column("policy_id", sa.String(), nullable=True),  
        sa.Column("type", sa.String(), nullable=False),  
        sa.Column("amount", sa.Float(), nullable=False),  
        sa.Column(  
            "currency",  
            sa.String(),  
            nullable=False,  
            server_default="PKR",  
        ),  
        sa.Column("current_step", sa.String(), nullable=False),  
        sa.Column(  
            "step_index",  
            sa.Integer(),  
            nullable=False,  
            server_default="0",  
        ),  
        sa.Column(  
            "steps",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'[]'::json"),  
        ),  
        sa.Column("outcome", sa.String(), nullable=True),  
        sa.Column("incident_date", sa.DateTime(timezone=True), nullable=False),  
        sa.Column(  
            "created_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "updated_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column("description", sa.String(), nullable=False),  
        sa.Column(  
            "severity",  
            sa.String(),  
            nullable=False,  
            server_default="Standard",  
        ),  
        sa.Column(  
            "reserve_amount",  
            sa.Float(),  
            nullable=False,  
            server_default="0",  
        ),  
        sa.Column(  
            "approved_amount",  
            sa.Float(),  
            nullable=False,  
            server_default="0",  
        ),  
        sa.Column(  
            "excess",  
            sa.Float(),  
            nullable=False,  
            server_default="0",  
        ),  
        sa.Column(  
            "fraud_indicator",  
            sa.Boolean(),  
            nullable=False,  
            server_default=sa.text("false"),  
        ),  
        sa.Column("payment_ref", sa.String(), nullable=True),  
        sa.Column("insurer_ref", sa.String(), nullable=True),  
        sa.Column(  
            "timeline",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'[]'::json"),  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="CASCADE",  
        ),  
        sa.ForeignKeyConstraint(  
            ["policy_id"],  
            ["policies.id"],  
            ondelete="SET NULL",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
    )  
  
    op.create_table(  
        "documents",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column("client_id", sa.String(), nullable=False),  
        sa.Column("type", sa.String(), nullable=False),  
        sa.Column("name", sa.String(), nullable=False),  
        sa.Column("ref_id", sa.String(), nullable=True),  
        sa.Column("ref_type", sa.String(), nullable=True),  
        sa.Column(  
            "uploaded_at",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column(  
            "status",  
            sa.String(),  
            nullable=False,  
            server_default="pending",  
        ),  
        sa.Column("file_url", sa.String(), nullable=True),  
        sa.Column("mime_type", sa.String(), nullable=True),  
        sa.Column("size_bytes", sa.Integer(), nullable=True),  
        sa.Column("checksum", sa.String(), nullable=True),  
        sa.Column("storage_key", sa.String(), nullable=True),  
        sa.Column("uploaded_by_user", sa.String(), nullable=True),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="CASCADE",  
        ),  
        sa.ForeignKeyConstraint(  
            ["uploaded_by_user"],  
            ["users.id"],  
            ondelete="SET NULL",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
    )  
  
    op.create_table(  
        "audit_logs",  
        sa.Column("id", sa.String(), nullable=False),  
        sa.Column(  
            "time",  
            sa.DateTime(timezone=True),  
            nullable=False,  
            server_default=sa.func.now(),  
        ),  
        sa.Column("actor_user_id", sa.String(), nullable=True),  
        sa.Column("client_id", sa.String(), nullable=True),  
        sa.Column("subject_type", sa.String(), nullable=True),  
        sa.Column("subject_id", sa.String(), nullable=True),  
        sa.Column("event", sa.String(), nullable=False),  
        sa.Column("details", sa.String(), nullable=False),  
        sa.Column("department", sa.String(), nullable=True),  
        sa.Column("request_id", sa.String(), nullable=True),  
        sa.Column("ip_address", sa.String(), nullable=True),  
        sa.Column(  
            "extra_data",  
            JSON,  
            nullable=False,  
            server_default=sa.text("'{}'::json"),  
        ),  
        sa.ForeignKeyConstraint(  
            ["actor_user_id"],  
            ["users.id"],  
            ondelete="SET NULL",  
        ),  
        sa.ForeignKeyConstraint(  
            ["client_id"],  
            ["clients.id"],  
            ondelete="SET NULL",  
        ),  
        sa.PrimaryKeyConstraint("id"),  
    )  
  
    op.create_index(  
        "ix_clients_lifecycle_stage",  
        "clients",  
        ["lifecycle_stage"],  
    )  
    op.create_index(  
        "ix_clients_assigned_department",  
        "clients",  
        ["assigned_department"],  
    )  
    op.create_index(  
        "ix_applications_client_id",  
        "applications",  
        ["client_id"],  
    )  
    op.create_index(  
        "ix_applications_status",  
        "applications",  
        ["status"],  
    )  
    op.create_index(  
        "ix_applications_current_step",  
        "applications",  
        ["current_step"],  
    )  
    op.create_index(  
        "ix_applications_department",  
        "applications",  
        ["department"],  
    )  
    op.create_index(  
        "ix_claims_client_id",  
        "claims",  
        ["client_id"],  
    )  
    op.create_index(  
        "ix_claims_current_step",  
        "claims",  
        ["current_step"],  
    )  
    op.create_index(  
        "ix_claims_policy_id",  
        "claims",  
        ["policy_id"],  
    )  
    op.create_index(  
        "ix_claims_product_type",  
        "claims",  
        ["product_type"],  
    )  
    op.create_index(  
        "ix_documents_client_id",  
        "documents",  
        ["client_id"],  
    )  
    op.create_index(  
        "ix_documents_ref_id",  
        "documents",  
        ["ref_id"],  
    )  
    op.create_index(  
        "ix_audit_logs_client_id",  
        "audit_logs",  
        ["client_id"],  
    )  
    op.create_index(  
        "ix_audit_logs_subject_id",  
        "audit_logs",  
        ["subject_id"],  
    )  
    op.create_index(  
        "ix_audit_logs_time",  
        "audit_logs",  
        ["time"],  
    )  
  
  
def downgrade():  
    op.drop_index("ix_audit_logs_time", table_name="audit_logs")  
    op.drop_index("ix_audit_logs_subject_id", table_name="audit_logs")  
    op.drop_index("ix_audit_logs_client_id", table_name="audit_logs")  
    op.drop_index("ix_documents_ref_id", table_name="documents")  
    op.drop_index("ix_documents_client_id", table_name="documents")  
    op.drop_index("ix_claims_product_type", table_name="claims")  
    op.drop_index("ix_claims_policy_id", table_name="claims")  
    op.drop_index("ix_claims_current_step", table_name="claims")  
    op.drop_index("ix_claims_client_id", table_name="claims")  
    op.drop_index("ix_applications_department", table_name="applications")  
    op.drop_index("ix_applications_current_step", table_name="applications")  
    op.drop_index("ix_applications_status", table_name="applications")  
    op.drop_index("ix_applications_client_id", table_name="applications")  
    op.drop_index("ix_clients_assigned_department", table_name="clients")  
    op.drop_index("ix_clients_lifecycle_stage", table_name="clients")  
  
    op.drop_table("audit_logs")  
    op.drop_table("documents")  
    op.drop_table("claims")  
    op.drop_table("holdings")  
    op.drop_table("policies")  
    op.drop_table("applications")  
    op.drop_table("users")  
    op.drop_table("clients")  
  
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)  
    sa.Enum(name="lifecyclestage").drop(op.get_bind(), checkfirst=True)
