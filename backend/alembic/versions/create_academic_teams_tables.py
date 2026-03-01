"""create academic teams tables

Revision ID: create_academic_teams
Revises: 009821bc0c1c
Create Date: 2026-02-23 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'create_academic_teams'
down_revision = '009821bc0c1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create academic_teams table
    op.create_table(
        'academic_teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('team_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('team_name', name='uq_academic_teams_team_name')
    )
    
    # Create academic_team_members table
    op.create_table(
        'academic_team_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['team_id'], ['academic_teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_academic_team_members_user_id')  # User can only be in one team
    )
    
    # Create indexes
    op.create_index('idx_academic_team_members_team_id', 'academic_team_members', ['team_id'])
    op.create_index('idx_academic_team_members_user_id', 'academic_team_members', ['user_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_academic_team_members_user_id', table_name='academic_team_members')
    op.drop_index('idx_academic_team_members_team_id', table_name='academic_team_members')
    
    # Drop tables
    op.drop_table('academic_team_members')
    op.drop_table('academic_teams')

