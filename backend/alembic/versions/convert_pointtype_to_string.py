"""convert pointtype enum to string

Revision ID: convert_pointtype_to_string
Revises: add_daily_login_enum
Create Date: 2026-03-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'convert_pointtype_to_string'
down_revision = 'add_daily_login_enum'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Convert pointtype enum column to string column.
    
    This migration:
    1. Converts the enum column to text temporarily
    2. Drops the enum type (if no other tables use it)
    3. Converts the column to VARCHAR with CHECK constraint for validation
    
    This approach avoids PostgreSQL native enum serialization issues while
    maintaining data integrity through CHECK constraints.
    """
    # Step 1: Convert enum column to text (this preserves all data)
    # We use USING clause to cast enum values to text
    op.execute("""
        ALTER TABLE points_history 
        ALTER COLUMN point_type TYPE VARCHAR(50) 
        USING point_type::text;
    """)
    
    # Step 2: Add CHECK constraint to ensure only valid values are allowed
    # This provides database-level validation similar to enum
    op.execute("""
        ALTER TABLE points_history 
        ADD CONSTRAINT check_point_type_valid 
        CHECK (point_type IN (
            'help_provided',
            'mentorship_accepted',
            'mentorship_completed',
            'study_group_created',
            'study_group_joined',
            'profile_completed',
            'resume_uploaded',
            'experience_added',
            'daily_login'
        ));
    """)
    
    # Step 3: Drop the PostgreSQL enum type (only if it exists and isn't used elsewhere)
    # Note: We check if it's used by other tables before dropping
    op.execute("""
        DO $$ 
        BEGIN
            -- Only drop if not used by other tables
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                JOIN pg_attribute a ON a.atttypid = t.oid
                JOIN pg_class c ON a.attrelid = c.oid
                WHERE t.typname = 'pointtype'
                AND c.relname != 'points_history'
            ) THEN
                DROP TYPE IF EXISTS pointtype;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """
    Revert back to enum type (if needed).
    
    Note: This recreates the enum type and converts the column back.
    All data must be valid enum values for this to work.
    """
    # Recreate the enum type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE pointtype AS ENUM (
                'help_provided',
                'mentorship_accepted',
                'mentorship_completed',
                'study_group_created',
                'study_group_joined',
                'profile_completed',
                'resume_uploaded',
                'experience_added',
                'daily_login'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Remove CHECK constraint
    op.execute("""
        ALTER TABLE points_history 
        DROP CONSTRAINT IF EXISTS check_point_type_valid;
    """)
    
    # Convert column back to enum type
    op.execute("""
        ALTER TABLE points_history 
        ALTER COLUMN point_type TYPE pointtype 
        USING point_type::pointtype;
    """)

