"""create_points_system

Revision ID: create_points_system
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_points_system'
down_revision = 'create_mentorship_tables'  # Points to latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create PointType enum
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
                'calendar_event_created',
                'calendar_event_joined',
                'daily_login'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Add points column to users table
    op.add_column('users', sa.Column('points', sa.Integer(), nullable=False, server_default='0'))
    
    # Create points_history table
    # Use the existing enum type (create_type=False)
    pointtype_enum = postgresql.ENUM(
        'help_provided', 'mentorship_accepted', 'mentorship_completed', 
        'study_group_created', 'study_group_joined', 'profile_completed',
        'resume_uploaded', 'experience_added', 'calendar_event_created',
        'calendar_event_joined', 'daily_login',
        name='pointtype',
        create_type=False  # Use existing enum
    )
    
    op.create_table(
        'points_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('point_type', pointtype_enum, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('related_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['related_user_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Create indexes
    op.create_index('idx_points_history_user_id', 'points_history', ['user_id'])
    op.create_index('idx_points_history_point_type', 'points_history', ['point_type'])
    op.create_index('idx_points_history_created_at', 'points_history', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_points_history_created_at', table_name='points_history')
    op.drop_index('idx_points_history_point_type', table_name='points_history')
    op.drop_index('idx_points_history_user_id', table_name='points_history')
    op.drop_table('points_history')
    op.drop_column('users', 'points')
    op.execute('DROP TYPE IF EXISTS pointtype')

