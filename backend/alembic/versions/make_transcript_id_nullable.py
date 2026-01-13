"""make transcript_id nullable for manual courses

Revision ID: make_transcript_id_nullable
Revises: add_points_to_courses
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'make_transcript_id_nullable'
down_revision = 'add_index_major'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make transcript_id nullable to allow manually added courses (currently taking)
    op.alter_column('courses', 'transcript_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=True,
                    existing_nullable=False)


def downgrade() -> None:
    # Revert back to non-nullable (this will fail if there are NULL values)
    op.alter_column('courses', 'transcript_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=False,
                    existing_nullable=True)

