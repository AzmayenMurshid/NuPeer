"""create class posts table

Revision ID: create_class_posts_table
Revises: create_mentorship_tables
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_class_posts_table'
down_revision = 'create_mentorship_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if table already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'class_posts' in existing_tables:
        # Table already exists, skip creation
        return
    
    # Create class_posts table
    op.create_table(
        'class_posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('course_code', sa.String(length=20), nullable=True),
        sa.Column('course_name', sa.String(length=255), nullable=True),
        sa.Column('class_format', sa.String(length=20), nullable=False),
        sa.Column('professor_name', sa.String(length=255), nullable=False),
        sa.Column('professor_rating', sa.Numeric(3, 2), nullable=False),
        sa.Column('exam_format', sa.String(length=20), nullable=False),
        sa.Column('lockdown_browser_required', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_class_posts_user_id'), 'class_posts', ['user_id'], unique=False)
    op.create_index(op.f('ix_class_posts_course_code'), 'class_posts', ['course_code'], unique=False)
    op.create_index(op.f('ix_class_posts_professor_name'), 'class_posts', ['professor_name'], unique=False)
    op.create_index(op.f('ix_class_posts_created_at'), 'class_posts', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_class_posts_created_at'), table_name='class_posts')
    op.drop_index(op.f('ix_class_posts_professor_name'), table_name='class_posts')
    op.drop_index(op.f('ix_class_posts_course_code'), table_name='class_posts')
    op.drop_index(op.f('ix_class_posts_user_id'), table_name='class_posts')
    
    # Drop table
    op.drop_table('class_posts')

