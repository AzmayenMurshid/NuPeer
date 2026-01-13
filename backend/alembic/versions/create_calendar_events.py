"""create calendar events

Revision ID: create_calendar_events
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_calendar_events'
down_revision = 'make_transcript_id_nullable'  # Points to latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create EventType enum (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE eventtype AS ENUM ('tutoring', 'group_study');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Check if table already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()
    
    if 'calendar_events' in existing_tables:
        # Table already exists, skip creation
        return
    
    # Create calendar_events table
    # Use postgresql.ENUM with create_type=False since we already created it above
    event_type_enum = postgresql.ENUM('tutoring', 'group_study', name='eventtype', create_type=False)
    
    op.create_table(
        'calendar_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organizer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', event_type_enum, nullable=False),
        sa.Column('course_code', sa.String(length=20), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('max_participants', sa.String(length=10), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='scheduled'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organizer_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_calendar_events_organizer_id'), 'calendar_events', ['organizer_id'], unique=False)
    op.create_index(op.f('ix_calendar_events_course_code'), 'calendar_events', ['course_code'], unique=False)
    op.create_index(op.f('ix_calendar_events_start_time'), 'calendar_events', ['start_time'], unique=False)
    op.create_index(op.f('ix_calendar_events_end_time'), 'calendar_events', ['end_time'], unique=False)
    
    # Create event_participants table
    op.create_table(
        'event_participants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='accepted'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['calendar_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'user_id', name='unique_event_participant')
    )
    op.create_index(op.f('ix_event_participants_event_id'), 'event_participants', ['event_id'], unique=False)
    op.create_index(op.f('ix_event_participants_user_id'), 'event_participants', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_event_participants_user_id'), table_name='event_participants')
    op.drop_index(op.f('ix_event_participants_event_id'), table_name='event_participants')
    op.drop_table('event_participants')
    op.drop_index(op.f('ix_calendar_events_end_time'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_start_time'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_course_code'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_organizer_id'), table_name='calendar_events')
    op.drop_table('calendar_events')
    op.execute("DROP TYPE eventtype")

