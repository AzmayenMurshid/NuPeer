"""increase course_name length

Revision ID: increase_course_name_length
Revises: 5c8f8a959117
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'increase_course_name_length'
down_revision = '5c8f8a959117'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change course_name from VARCHAR(255) to TEXT to support longer course names
    op.alter_column('courses', 'course_name',
                    existing_type=sa.String(length=255),
                    type_=sa.Text(),
                    existing_nullable=True)


def downgrade() -> None:
    # Revert back to VARCHAR(255)
    op.alter_column('courses', 'course_name',
                    existing_type=sa.Text(),
                    type_=sa.String(length=255),
                    existing_nullable=True)

