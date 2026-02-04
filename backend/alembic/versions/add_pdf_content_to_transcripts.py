"""add pdf_content column to transcripts table

Revision ID: add_pdf_content_to_transcripts
Revises: make_file_path_nullable
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_pdf_content_to_transcripts'
down_revision = 'make_file_path_nullable'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pdf_content column to store PDF files in PostgreSQL
    op.add_column('transcripts', 
                  sa.Column('pdf_content', postgresql.BYTEA(), nullable=True))


def downgrade() -> None:
    # Remove pdf_content column
    op.drop_column('transcripts', 'pdf_content')

