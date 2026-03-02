"""add tagged members to points

Revision ID: add_tagged_members_points
Revises: add_index_user_points
Create Date: 2026-03-01 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_tagged_members_points'
down_revision = 'add_index_user_points'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tagged_members table to track which team members were tagged when points were awarded
    op.create_table(
        'tagged_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('points_history_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['points_history_id'], ['points_history.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('idx_tagged_members_points_history_id', 'tagged_members', ['points_history_id'])
    op.create_index('idx_tagged_members_user_id', 'tagged_members', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_tagged_members_user_id', table_name='tagged_members')
    op.drop_index('idx_tagged_members_points_history_id', table_name='tagged_members')
    op.drop_table('tagged_members')

