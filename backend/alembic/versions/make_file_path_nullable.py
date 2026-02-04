"""make file_path nullable in transcripts table

Revision ID: make_file_path_nullable
Revises: create_points_system
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'make_file_path_nullable'
down_revision = 'create_points_system'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make file_path nullable since we no longer store transcripts in MINIO
    op.alter_column('transcripts', 'file_path',
                    existing_type=sa.String(length=500),
                    nullable=True,
                    existing_nullable=False)


def downgrade() -> None:
    # Revert back to non-nullable (this will fail if there are NULL values)
    op.alter_column('transcripts', 'file_path',
                    existing_type=sa.String(length=500),
                    nullable=False,
                    existing_nullable=True)

