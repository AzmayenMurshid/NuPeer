#!/usr/bin/env python
"""
Test script to verify CORS configuration parsing
"""
import os
import sys
from app.core.config import Settings

def test_cors_parsing():
    """Test different CORS_ORIGINS formats"""
    print("=" * 60)
    print("Testing CORS Configuration Parsing")
    print("=" * 60)
    
    # Test 1: Default values
    print("\n1. Testing default CORS_ORIGINS:")
    settings = Settings()
    print(f"   Result: {settings.CORS_ORIGINS}")
    
    # Test 2: JSON array format
    print("\n2. Testing JSON array format:")
    os.environ['CORS_ORIGINS'] = '["https://nupeerzx.vercel.app"]'
    settings = Settings()
    print(f"   Input: [\"https://nupeerzx.vercel.app\"]")
    print(f"   Result: {settings.CORS_ORIGINS}")
    assert "https://nupeerzx.vercel.app" in settings.CORS_ORIGINS, "JSON array parsing failed!"
    
    # Test 3: Comma-separated format
    print("\n3. Testing comma-separated format:")
    os.environ['CORS_ORIGINS'] = 'https://nupeerzx.vercel.app,https://nupeer.com'
    settings = Settings()
    print(f"   Input: https://nupeerzx.vercel.app,https://nupeer.com")
    print(f"   Result: {settings.CORS_ORIGINS}")
    assert "https://nupeerzx.vercel.app" in settings.CORS_ORIGINS, "Comma-separated parsing failed!"
    
    # Test 4: Single value
    print("\n4. Testing single value format:")
    os.environ['CORS_ORIGINS'] = 'https://nupeerzx.vercel.app'
    settings = Settings()
    print(f"   Input: https://nupeerzx.vercel.app")
    print(f"   Result: {settings.CORS_ORIGINS}")
    assert "https://nupeerzx.vercel.app" in settings.CORS_ORIGINS, "Single value parsing failed!"
    
    # Test 5: Multiple domains in JSON
    print("\n5. Testing multiple domains (JSON array):")
    os.environ['CORS_ORIGINS'] = '["https://nupeerzx.vercel.app","https://nupeer.com","https://www.nupeer.com"]'
    settings = Settings()
    print(f"   Input: [\"https://nupeerzx.vercel.app\",\"https://nupeer.com\",\"https://www.nupeer.com\"]")
    print(f"   Result: {settings.CORS_ORIGINS}")
    assert len(settings.CORS_ORIGINS) == 3, "Multiple domains parsing failed!"
    
    # Clean up
    if 'CORS_ORIGINS' in os.environ:
        del os.environ['CORS_ORIGINS']
    
    print("\n" + "=" * 60)
    print(">>> All CORS parsing tests passed!")
    print("=" * 60)
    return True

def test_app_loading():
    """Test that the FastAPI app loads correctly"""
    print("\n" + "=" * 60)
    print("Testing FastAPI App Loading")
    print("=" * 60)
    
    try:
        from app.main import app
        print("\n>>> FastAPI app loaded successfully")
        print(f">>> CORS middleware configured")
        print(f">>> App title: {app.title}")
        print(f">>> App version: {app.version}")
        
        # Check routes
        routes = [route.path for route in app.routes]
        print(f"\n>>> Found {len(routes)} routes")
        print(f"   Health endpoint: /health" if "/health" in routes else "   [X] Health endpoint missing")
        print(f"   API docs: /api/docs" if "/api/docs" in routes else "   [X] API docs missing")
        
        return True
    except Exception as e:
        print(f"\n[X] Error loading app: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n>>> Starting Configuration Tests...\n")
    
    try:
        # Test CORS parsing
        cors_ok = test_cors_parsing()
        
        # Test app loading
        app_ok = test_app_loading()
        
        if cors_ok and app_ok:
            print("\n" + "=" * 60)
            print(">>> ALL TESTS PASSED!")
            print("=" * 60)
            print("\nYour backend configuration is ready for Railway deployment.")
            print("Make sure to set CORS_ORIGINS in Railway to:")
            print('  ["https://nupeerzx.vercel.app"]')
            sys.exit(0)
        else:
            print("\n[X] Some tests failed. Please check the errors above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n[X] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
