# NuPeer Setup Guide

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Start all services:**
```bash
docker-compose up -d
```

2. **Initialize database:**
```bash
# Create initial migration
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"

# Apply migration
docker-compose exec backend alembic upgrade head
```

3. **Access services:**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Option 2: Local Development

#### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start PostgreSQL, Redis, and MinIO:**
```bash
# Using Docker Compose for just these services
docker-compose up -d postgres redis minio
```

5. **Run migrations:**
```bash
alembic upgrade head
```

6. **Start backend:**
```bash
uvicorn app.main:app --reload
```

7. **Start Celery worker (separate terminal):**
```bash
celery -A app.tasks.process_transcript worker --loglevel=info
```

#### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:**
http://localhost:3000

## Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback:
```bash
alembic downgrade -1
```

## Testing the API

### 1. Register a user:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Login:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpassword123"
```

Save the `access_token` from the response.

### 3. Upload a transcript:
```bash
curl -X POST http://localhost:8000/api/v1/transcripts/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/transcript.pdf"
```

### 4. Check processing status:
```bash
curl -X GET http://localhost:8000/api/v1/transcripts/TRANSCRIPT_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create a help request:
```bash
curl -X POST http://localhost:8000/api/v1/help-requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CS 101",
    "course_name": "Introduction to Computer Science"
  }'
```

### 6. Get recommendations:
```bash
curl -X GET http://localhost:8000/api/v1/recommendations/REQUEST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Backend won't start
- Check that PostgreSQL, Redis, and MinIO are running
- Verify DATABASE_URL in .env is correct
- Check port 8000 is not in use

### PDF processing fails
- Ensure Celery worker is running
- Check Redis connection
- Verify MinIO is accessible
- Check transcript format matches parser expectations

### Database connection errors
- Verify PostgreSQL is running: `docker-compose ps postgres`
- Check connection string in .env
- Ensure database exists: `docker-compose exec postgres psql -U nupeer -d nupeer`

### MinIO connection errors
- Access MinIO console at http://localhost:9001
- Verify credentials in .env match MinIO setup
- Check bucket is created (auto-created on first upload)

## Production Deployment Checklist

- [ ] Change `SECRET_KEY` to a secure random value
- [ ] Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
- [ ] Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
- [ ] Use AWS S3 or production MinIO instance
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS origins for production domain
- [ ] Set up environment-specific environment variables
- [ ] Configure logging and monitoring
- [ ] Set up backup strategy for database
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling for workers
- [ ] Set up error tracking (Sentry, etc.)

## Environment Variables Reference

See `backend/.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `S3_ENDPOINT`: MinIO/S3 endpoint URL
- `S3_ACCESS_KEY`: Object storage access key
- `S3_SECRET_KEY`: Object storage secret key
- `SECRET_KEY`: JWT signing key (MUST change in production)
- `CORS_ORIGINS`: Allowed frontend origins

