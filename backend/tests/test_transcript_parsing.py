"""
Test script to verify transcript parsing without MINIO storage
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Test that all necessary imports work"""
    print("Testing imports...")
    try:
        from app.models.transcript import Transcript
        from app.api.v1.transcripts import router, _process_transcript_internal
        from app.tasks.process_transcript import celery_app, process_transcript_task
        from app.services.pdf_processor import pdf_processor
        print("[OK] All imports successful")
        return True
    except Exception as e:
        print(f"[FAIL] Import failed: {e}")
        return False

def test_model():
    """Test that Transcript model allows None file_path"""
    print("\nTesting Transcript model...")
    try:
        from app.models.transcript import Transcript
        from sqlalchemy import inspect
        
        # Check if file_path is nullable
        mapper = inspect(Transcript)
        file_path_column = mapper.columns.get('file_path')
        if file_path_column is None:
            print("[FAIL] file_path column not found")
            return False
        
        is_nullable = file_path_column.nullable
        if is_nullable:
            print("[OK] file_path is nullable (correct)")
            return True
        else:
            print("[FAIL] file_path is not nullable (needs migration)")
            return False
    except Exception as e:
        print(f"[FAIL] Model test failed: {e}")
        return False

def test_celery_config():
    """Test Celery configuration for binary data"""
    print("\nTesting Celery configuration...")
    try:
        from app.tasks.process_transcript import celery_app
        
        serializer = celery_app.conf.task_serializer
        accept_content = celery_app.conf.accept_content
        
        if serializer == 'pickle' and 'pickle' in accept_content:
            print("[OK] Celery configured for pickle serialization (can handle binary data)")
            return True
        else:
            print(f"[WARN] Celery serializer: {serializer}, accept_content: {accept_content}")
            print("       This may cause issues with binary PDF data")
            return False
    except Exception as e:
        print(f"[FAIL] Celery config test failed: {e}")
        return False

def test_processing_function_signature():
    """Test that processing function can read from database"""
    print("\nTesting processing function signature...")
    try:
        from app.tasks.process_transcript import _process_transcript_internal
        import inspect
        
        sig = inspect.signature(_process_transcript_internal)
        params = list(sig.parameters.keys())
        
        # Function should accept transcript_id and user_id, pdf_content is optional
        if 'transcript_id' in params and 'user_id' in params:
            print("[OK] _process_transcript_internal has correct signature")
            print(f"       Parameters: {params}")
            return True
        else:
            print(f"[FAIL] _process_transcript_internal missing required parameters")
            print(f"       Parameters: {params}")
            return False
    except Exception as e:
        print(f"[FAIL] Signature test failed: {e}")
        return False

def test_migration_exists():
    """Test that migration file exists and is valid"""
    print("\nTesting migration file...")
    try:
        migration_path = os.path.join(os.path.dirname(__file__), 'alembic', 'versions', 'make_file_path_nullable.py')
        if os.path.exists(migration_path):
            print("[OK] Migration file exists")
            
            # Check migration content
            with open(migration_path, 'r') as f:
                content = f.read()
                if 'nullable=True' in content and 'file_path' in content:
                    print("[OK] Migration contains correct nullable=True for file_path")
                    return True
                else:
                    print("[WARN] Migration file exists but may not be correct")
                    return False
        else:
            print("[FAIL] Migration file not found")
            return False
    except Exception as e:
        print(f"[FAIL] Migration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Testing Transcript Parsing Implementation (No MINIO)")
    print("=" * 60)
    
    tests = [
        test_imports,
        test_model,
        test_celery_config,
        test_processing_function_signature,
        test_migration_exists,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"[FAIL] Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("[SUCCESS] All tests passed! Ready for deployment.")
        return 0
    else:
        print("[FAILURE] Some tests failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

