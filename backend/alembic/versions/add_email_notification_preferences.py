"""add email notification preferences

Revision ID: add_email_notif_prefs
Revises: increase_course_name_length
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_email_notif_prefs'
down_revision = 'increase_course_name_length'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email notification preference columns to users table
    op.add_column('users', sa.Column('email_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('help_request_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('analytics_updates_enabled', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    # Remove email notification preference columns
    op.drop_column('users', 'analytics_updates_enabled')
    op.drop_column('users', 'help_request_notifications_enabled')
    op.drop_column('users', 'email_notifications_enabled')

