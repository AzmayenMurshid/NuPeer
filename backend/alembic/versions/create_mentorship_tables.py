"""create mentorship tables

Revision ID: create_mentorship_tables
Revises: create_calendar_events
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_mentorship_tables'
down_revision = 'create_calendar_events'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create RequestStatus enum (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE requeststatus AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Check if tables already exist
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    # Add is_alumni, mentor_id, mentee_id to users table
    if 'is_alumni' not in [col['name'] for col in inspector.get_columns('users')]:
        op.add_column('users', sa.Column('is_alumni', sa.Boolean(), nullable=True, server_default='false'))
    if 'mentor_id' not in [col['name'] for col in inspector.get_columns('users')]:
        op.add_column('users', sa.Column('mentor_id', postgresql.UUID(as_uuid=True), nullable=True))
    if 'mentee_id' not in [col['name'] for col in inspector.get_columns('users')]:
        op.add_column('users', sa.Column('mentee_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add chapter column to alumni_profiles if table exists but column doesn't
    if 'alumni_profiles' in existing_tables:
        if 'chapter' not in [col['name'] for col in inspector.get_columns('alumni_profiles')]:
            op.add_column('alumni_profiles', sa.Column('chapter', sa.String(length=100), nullable=True))
        # Tables already exist, skip creation
        return
    
    # Create alumni_profiles table
    op.create_table(
        'alumni_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('chapter', sa.String(length=100), nullable=True),
        sa.Column('current_position', sa.String(length=255), nullable=True),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('linkedin_url', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('is_mentor', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('is_mentee', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('mentor_capacity', sa.Integer(), nullable=True, server_default='5'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_alumni_profiles_user_id'), 'alumni_profiles', ['user_id'], unique=True)
    
    # Create experiences table
    op.create_table(
        'experiences',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alumni_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['alumni_profile_id'], ['alumni_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_experiences_alumni_profile_id'), 'experiences', ['alumni_profile_id'], unique=False)
    
    # Create resumes table
    op.create_table(
        'resumes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alumni_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('upload_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['alumni_profile_id'], ['alumni_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resumes_alumni_profile_id'), 'resumes', ['alumni_profile_id'], unique=False)
    
    # Create mentorship_requests table
    request_status_enum = postgresql.ENUM('pending', 'accepted', 'rejected', 'cancelled', name='requeststatus', create_type=False)
    op.create_table(
        'mentorship_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mentor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('mentee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', request_status_enum, nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['mentor_id'], ['alumni_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mentee_id'], ['alumni_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mentorship_requests_mentor_id'), 'mentorship_requests', ['mentor_id'], unique=False)
    op.create_index(op.f('ix_mentorship_requests_mentee_id'), 'mentorship_requests', ['mentee_id'], unique=False)
    
    # Add foreign key constraints for mentor_id and mentee_id in users table
    op.create_foreign_key('fk_users_mentor_id', 'users', 'alumni_profiles', ['mentor_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_users_mentee_id', 'users', 'alumni_profiles', ['mentee_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Drop foreign key constraints
    op.drop_constraint('fk_users_mentee_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_mentor_id', 'users', type_='foreignkey')
    
    # Drop tables
    op.drop_index(op.f('ix_mentorship_requests_mentee_id'), table_name='mentorship_requests')
    op.drop_index(op.f('ix_mentorship_requests_mentor_id'), table_name='mentorship_requests')
    op.drop_table('mentorship_requests')
    
    op.drop_index(op.f('ix_resumes_alumni_profile_id'), table_name='resumes')
    op.drop_table('resumes')
    
    op.drop_index(op.f('ix_experiences_alumni_profile_id'), table_name='experiences')
    op.drop_table('experiences')
    
    op.drop_index(op.f('ix_alumni_profiles_user_id'), table_name='alumni_profiles')
    op.drop_table('alumni_profiles')
    
    # Drop columns from users table
    op.drop_column('users', 'mentee_id')
    op.drop_column('users', 'mentor_id')
    op.drop_column('users', 'is_alumni')
    
    # Drop enum
    op.execute("DROP TYPE requeststatus")

