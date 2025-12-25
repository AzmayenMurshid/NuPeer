"""remove email notification preferences

Revision ID: remove_email_notif_prefs
Revises: add_email_notif_prefs
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_email_notif_prefs'
down_revision = 'add_email_notif_prefs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove email notification preference columns from users table
    op.drop_column('users', 'analytics_updates_enabled')
    op.drop_column('users', 'help_request_notifications_enabled')
    op.drop_column('users', 'email_notifications_enabled')


def downgrade() -> None:
    # Re-add email notification preference columns
    op.add_column('users', sa.Column('email_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('help_request_notifications_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('analytics_updates_enabled', sa.Boolean(), nullable=False, server_default='true'))

