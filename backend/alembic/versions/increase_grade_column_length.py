"""increase grade column length

Revision ID: increase_grade_column_length
Revises: 
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'increase_grade_column_length'
down_revision = 'add_pdf_content_to_transcripts'  # Set to latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change grade from VARCHAR(10) to VARCHAR(20) to support "IN PROGRESS" and other longer grade values
    op.alter_column('courses', 'grade',
                    existing_type=sa.String(length=10),
                    type_=sa.String(length=20),
                    existing_nullable=True)


def downgrade() -> None:
    # Revert back to VARCHAR(10)
    op.alter_column('courses', 'grade',
                    existing_type=sa.String(length=20),
                    type_=sa.String(length=10),
                    existing_nullable=True)

