# Upload Troubleshooting Guide

## Common Error: "Upload failed. Please try again."

### Most Likely Cause: MinIO Not Running

The upload feature requires **MinIO** (S3-compatible object storage) to be running. MinIO stores the uploaded PDF files.

### Quick Fix

#### Option 1: Start MinIO with Docker (Recommended)

```powershell
# Start MinIO container
docker run -d \
  --name nupeer-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

Then verify it's running:
```powershell
docker ps | findstr minio
```

Access MinIO Console: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

#### Option 2: Use Docker Compose

If you have a `docker-compose.yml` file, start all services:

```powershell
cd backend
docker-compose up -d
```

This should start:
- PostgreSQL
- Redis
- MinIO
- Backend API
- Celery Worker

### Verify Backend is Running

1. Check if backend is running:
   ```powershell
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy"}`

2. Check if MinIO is accessible:
   ```powershell
   curl http://localhost:9000/minio/health/live
   ```
   Should return: `200 OK`

### Check Error Details

The error message should now show:
- **Connection Error**: "Storage service not available. Please ensure MinIO/S3 is running at http://localhost:9000"
- **Other Errors**: Specific error messages from the backend

### Development Mode (Optional)

If you want to develop without MinIO, you can modify the storage service to use local file storage temporarily. However, this is not recommended for production.

### Still Having Issues?

1. **Check Backend Logs**: Look at the terminal where the backend is running for error messages
2. **Check Browser Console**: Open DevTools (F12) and check the Console tab for detailed errors
3. **Verify Network**: Make sure the frontend can reach the backend at `http://localhost:8000`
4. **Check File Size**: Ensure your PDF is under 10MB (the maximum upload size)

### Required Services

For uploads to work, you need:
- ✅ Backend API running (port 8000)
- ✅ PostgreSQL running (port 5432)
- ✅ MinIO running (port 9000)
- ✅ Redis running (port 6379) - for background processing

### Quick Start All Services

```powershell
# Start all services with Docker Compose
cd backend
docker-compose up -d

# Or start individually:
# 1. PostgreSQL
docker start nupeer-postgres

# 2. MinIO
docker run -d --name nupeer-minio -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# 3. Redis
docker run -d --name nupeer-redis -p 6379:6379 redis:alpine

# 4. Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

