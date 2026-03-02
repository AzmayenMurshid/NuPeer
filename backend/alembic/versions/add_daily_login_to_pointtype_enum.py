"""add daily_login to pointtype enum

Revision ID: add_daily_login_enum
Revises: add_tagged_members_points
Create Date: 2026-03-01 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_daily_login_enum'
down_revision = 'add_tagged_members_points'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'daily_login' to pointtype enum if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'daily_login' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pointtype')
            ) THEN
                ALTER TYPE pointtype ADD VALUE 'daily_login';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For now, we'll leave it as a no-op
    pass

