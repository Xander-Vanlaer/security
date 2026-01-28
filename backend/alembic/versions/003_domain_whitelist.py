"""Add allowed_domains table for domain-based registration whitelist

Revision ID: 003_domain_whitelist
Revises: 002_sensor_api_keys
Create Date: 2026-01-28 17:53:00.000000

Migration Notes:
- Creates allowed_domains table for domain-based registration whitelist
- Domains are stored with @ prefix (e.g., @gmail.com, @student.thomasmore.be)
- Domain matching is case-insensitive
- The old allowed_emails table is kept for backward compatibility
- After migration, seed default domains (gmail, outlook, etc.)

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '003_domain_whitelist'
down_revision = '002_sensor_api_keys'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create allowed_domains table
    op.create_table('allowed_domains',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('domain', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_allowed_domains_id'), 'allowed_domains', ['id'], unique=False)
    op.create_index(op.f('ix_allowed_domains_domain'), 'allowed_domains', ['domain'], unique=True)
    
    # Note: After migration, you should:
    # 1. Add default domains to allowed_domains table (e.g., @gmail.com, @outlook.com)
    # 2. Optionally migrate existing allowed_emails to allowed_domains


def downgrade() -> None:
    # Drop allowed_domains table
    op.drop_index(op.f('ix_allowed_domains_domain'), table_name='allowed_domains')
    op.drop_index(op.f('ix_allowed_domains_id'), table_name='allowed_domains')
    op.drop_table('allowed_domains')
