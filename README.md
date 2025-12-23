# NuPeer - Sigma Nu Zeta Chi Class Matching System

A web application that pairs Sigma Nu fraternity brothers who need help with classes with brothers who have already completed those classes, ranked by their grades.

## Architecture Overview

- **Backend**: FastAPI (Python) with async processing
- **Frontend**: Next.js 14 with React and TypeScript
- **Database**: PostgreSQL
- **Object Storage**: MinIO (S3-compatible)
- **Task Queue**: Celery with Redis
- **Containerization**: Docker & Docker Compose

## Features

- 📄 Upload and process transcript PDFs
- 🔍 Extract course information automatically
- 🎯 Create help requests for specific courses
- ⭐ Get ranked recommendations based on grades
- 👥 Connect with brothers who excelled in your courses

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)

### Running with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd NuPeer
```

2. Start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- MinIO object storage (ports 9000, 9001)
- Backend API (port 8000)
- Celery worker for PDF processing

3. Initialize the database:
```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head
```

4. Access the services:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Frontend Development

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Project Structure

```
NuPeer/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Configuration, database, security
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic (PDF processing)
│   │   ├── tasks/           # Celery tasks
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API client
│   └── package.json
├── docker-compose.yml
└── ARCHITECTURE.md          # Detailed architecture documentation
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Transcripts
- `POST /api/v1/transcripts/upload` - Upload transcript PDF
- `GET /api/v1/transcripts` - List transcripts
- `GET /api/v1/transcripts/{id}` - Get transcript details
- `GET /api/v1/transcripts/{id}/status` - Check processing status
- `DELETE /api/v1/transcripts/{id}` - Delete transcript

### Courses
- `GET /api/v1/courses` - List user's courses
- `GET /api/v1/courses/search?q={query}` - Search courses

### Help Requests
- `POST /api/v1/help-requests` - Create help request
- `GET /api/v1/help-requests` - List help requests
- `GET /api/v1/help-requests/{id}` - Get help request
- `DELETE /api/v1/help-requests/{id}` - Cancel request

### Recommendations
- `GET /api/v1/recommendations/{request_id}` - Get ranked recommendations

## PDF Processing Pipeline

1. User uploads PDF → Stored in MinIO/S3
2. Transcript record created with status "pending"
3. Celery task queued for processing
4. Worker extracts text and parses courses
5. Courses stored in database
6. Status updated to "completed"

## Database Schema

See `ARCHITECTURE.md` for detailed schema documentation.

Key tables:
- `users` - Brother information
- `transcripts` - PDF metadata
- `courses` - Extracted course data
- `help_requests` - Requests for help
- `recommendations` - Ranked matches

## Development

### Backend

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start development server:
```bash
uvicorn app.main:app --reload
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## Environment Variables

See `backend/.env.example` for all configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `S3_ENDPOINT` - MinIO/S3 endpoint
- `SECRET_KEY` - JWT secret key (change in production!)

## Production Deployment

1. Update environment variables for production
2. Use managed PostgreSQL and Redis services
3. Use AWS S3 or production MinIO
4. Set up proper SSL/TLS certificates
5. Configure CORS origins
6. Use environment-specific secrets

## Security Considerations

- JWT authentication with token expiration
- Password hashing with bcrypt
- File upload validation (type, size)
- Rate limiting (recommended)
- Input validation and sanitization
- SQL injection protection (SQLAlchemy ORM)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

