"""add index on user points

Revision ID: add_index_user_points
Revises: create_academic_teams
Create Date: 2026-02-23 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_index_user_points'
down_revision = 'create_academic_teams'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add index on users.points for optimized leaderboard queries (O(log n) instead of O(n))
    op.create_index('idx_users_points', 'users', ['points'], unique=False)
    
    # Add index on battle_buddy_teams.points for optimized team leaderboard queries
    op.create_index('idx_battle_buddy_teams_points', 'battle_buddy_teams', ['points'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_battle_buddy_teams_points', table_name='battle_buddy_teams')
    op.drop_index('idx_users_points', table_name='users')

