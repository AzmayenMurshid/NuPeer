"""add index on major column

Revision ID: add_index_major
Revises: add_phone_number_to_users
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_index_major'
down_revision = 'add_phone_number_to_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add index on major column for faster lookups
    op.create_index(
        'ix_users_major',
        'users',
        ['major'],
        unique=False
    )


def downgrade() -> None:
    # Remove index on major column
    op.drop_index('ix_users_major', table_name='users')

