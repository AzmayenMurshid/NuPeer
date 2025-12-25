from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print('Tables in database:', ', '.join(tables))
        
        required_tables = ['users', 'transcripts', 'courses', 'help_requests', 'recommendations']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f'\n✗ Missing tables: {", ".join(missing_tables)}')
            print('Run: alembic upgrade head')
            exit(1)
        else:
            print('\n✓ All required tables exist!')
            
        # Check if users table has data
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        print(f'Users in database: {user_count}')
        
except Exception as e:
    print(f'Error: {e}')
    exit(1)

