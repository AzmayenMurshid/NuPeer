"""
Python script to migrate grade column from VARCHAR(10) to VARCHAR(20)
Alternative to Alembic migration - can be run directly
"""
from app.core.database import engine
from sqlalchemy import text, inspect

def check_current_column_type():
    """Check the current type of the grade column"""
    inspector = inspect(engine)
    columns = inspector.get_columns('courses')
    grade_col = next((c for c in columns if c['name'] == 'grade'), None)
    
    if grade_col:
        col_type = str(grade_col['type'])
        max_length = grade_col.get('type').length if hasattr(grade_col.get('type'), 'length') else None
        print(f"Current grade column type: {col_type}")
        if max_length:
            print(f"Current max length: {max_length}")
        return max_length
    else:
        print("❌ Grade column not found!")
        return None

def migrate_grade_column():
    """Migrate grade column from VARCHAR(10) to VARCHAR(20)"""
    print("=" * 60)
    print("GRADE COLUMN MIGRATION")
    print("=" * 60)
    
    # Check current state
    print("\n1. Checking current column type...")
    current_length = check_current_column_type()
    
    if current_length == 20:
        print("✅ Column is already VARCHAR(20). No migration needed.")
        return
    
    if current_length is None:
        print("❌ Could not determine current column type. Aborting.")
        return
    
    print(f"\n2. Current length: {current_length}, Target: 20")
    
    # Perform migration
    print("\n3. Executing migration...")
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20)"))
            connection.commit()
            print("✅ Migration successful: grade column updated to VARCHAR(20)")
            
            # Verify
            print("\n4. Verifying migration...")
            new_length = check_current_column_type()
            if new_length == 20:
                print("✅ Verification successful: Column is now VARCHAR(20)")
            else:
                print(f"⚠️  Warning: Column length is {new_length}, expected 20")
                
        except Exception as e:
            connection.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    try:
        migrate_grade_column()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        exit(1)

