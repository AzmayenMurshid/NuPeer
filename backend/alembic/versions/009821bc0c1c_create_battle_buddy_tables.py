"""create battle buddy tables

Revision ID: 009821bc0c1c
Revises: increase_grade_column_length
Create Date: 2026-02-23 16:34:25.735883

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '009821bc0c1c'
down_revision = 'increase_grade_column_length'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create battle_buddy_teams table
    op.create_table(
        'battle_buddy_teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('team_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('team_name', name='uq_battle_buddy_teams_team_name')
    )
    
    # Create battle_buddy_members table
    op.create_table(
        'battle_buddy_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['team_id'], ['battle_buddy_teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_battle_buddy_members_user_id')  # User can only be in one team
    )
    
    # Create indexes
    op.create_index('idx_battle_buddy_members_team_id', 'battle_buddy_members', ['team_id'])
    op.create_index('idx_battle_buddy_members_user_id', 'battle_buddy_members', ['user_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_battle_buddy_members_user_id', table_name='battle_buddy_members')
    op.drop_index('idx_battle_buddy_members_team_id', table_name='battle_buddy_members')
    
    # Drop tables
    op.drop_table('battle_buddy_members')
    op.drop_table('battle_buddy_teams')
