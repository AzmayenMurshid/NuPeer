# NuPeer - Sigma Nu Zeta Chi Class Matching System

## System Overview

NuPeer is a web application that pairs Sigma Nu fraternity brothers who need help with classes with brothers who have already completed those classes. The system ranks recommendations based on the helper brother's grade in the class.

## Architecture Design

### High-Level Architecture

```
┌─────────────┐
│   Frontend  │  React + TypeScript
│  (Next.js)  │
└──────┬──────┘
       │ REST API
       │
┌──────▼──────────────────────────────────────┐
│           Backend API (FastAPI)              │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │   REST API   │  │  Background Workers  │  │
│  │   Endpoints  │  │  (Celery/Async)      │  │
│  └──────────────┘  └─────────────────────┘  │
└──────┬──────────────────────────────────────┘
       │
       ├──────────────┬──────────────────────┐
       │              │                      │
┌──────▼──────┐  ┌───▼──────┐  ┌───────────▼──────┐
│ PostgreSQL  │  │  Redis   │  │  Object Storage  │
│  Database   │  │  (Cache) │  │  (S3/MinIO)      │
└─────────────┘  └──────────┘  └──────────────────┘
```

### Technology Stack

#### Backend
- **Framework**: FastAPI (Python) - High performance, async support, automatic API docs
- **Database**: PostgreSQL - Relational data storage
- **Object Storage**: MinIO (S3-compatible) or AWS S3 - PDF file storage
- **Task Queue**: Celery with Redis - Async PDF processing
- **ORM**: SQLAlchemy - Database abstraction
- **PDF Processing**: pdfplumber, PyPDF2, or Tesseract OCR
- **Authentication**: JWT tokens

#### Frontend
- **Framework**: Next.js 14+ (React with TypeScript)
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios or fetch API

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (production)
- **CI/CD**: GitHub Actions (optional)

## Database Schema

### Core Tables

#### `users` (Brothers)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    pledge_class VARCHAR(50),
    graduation_year INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `transcripts`
```sql
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,  -- Path in object storage
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT NOW(),
    processing_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `courses` (Extracted from transcripts)
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,  -- e.g., "CS 101"
    course_name VARCHAR(255),
    grade VARCHAR(10),  -- e.g., "A", "B+", "3.5"
    credit_hours DECIMAL(3,1),
    semester VARCHAR(50),  -- e.g., "Fall 2023"
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_code, semester, year)
);
```

#### `help_requests`
```sql
CREATE TABLE help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',  -- active, fulfilled, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `recommendations` (Pre-computed or on-demand)
```sql
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    help_request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
    helper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    grade_score DECIMAL(3,2),  -- Normalized grade (0.0-4.0)
    rank INTEGER,  -- Ranking position
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_help_requests_requester ON help_requests(requester_id);
CREATE INDEX idx_help_requests_course ON help_requests(course_code);
CREATE INDEX idx_recommendations_request ON recommendations(help_request_id);
```

## PDF Storage Strategy

### Approach: Hybrid Storage (Object Storage + Database Metadata)

**Why not store PDFs in database?**
- Database BLOBs are inefficient for large files
- Slows down database queries
- Difficult to scale
- Expensive database storage

**Recommended Solution:**
1. **Object Storage** (MinIO/S3): Store actual PDF files
   - Path structure: `transcripts/{user_id}/{transcript_id}/{filename}.pdf`
   - Benefits: Scalable, cost-effective, CDN-ready
   
2. **Database**: Store metadata only
   - File path/reference
   - File size, upload date
   - Processing status

3. **Processing Pipeline**:
   - Upload → Store in object storage → Queue async job
   - Worker extracts course data → Store in database
   - Update transcript status

## API Design

### Base URL
```
Production: https://api.nupeer.com/v1
Development: http://localhost:8000/v1
```

### Authentication
All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
```
POST   /auth/register          - Register new brother
POST   /auth/login             - Login and get JWT token
POST   /auth/refresh           - Refresh JWT token
GET    /auth/me                - Get current user info
```

#### Transcripts
```
POST   /transcripts/upload     - Upload transcript PDF
GET    /transcripts            - List user's transcripts
GET    /transcripts/{id}       - Get transcript details
GET    /transcripts/{id}/file  - Download transcript PDF
DELETE /transcripts/{id}       - Delete transcript
GET    /transcripts/{id}/status - Get processing status
```

#### Courses
```
GET    /courses                - List user's courses
GET    /courses/{id}           - Get course details
GET    /courses/search?q={code} - Search courses
```

#### Help Requests
```
POST   /help-requests          - Create help request
GET    /help-requests          - List user's help requests
GET    /help-requests/{id}     - Get help request details
GET    /help-requests/{id}/recommendations - Get ranked recommendations
DELETE /help-requests/{id}     - Cancel help request
```

#### Recommendations
```
GET    /recommendations/{request_id} - Get ranked recommendations
POST   /recommendations/{id}/contact - Request contact info (optional)
```

### Request/Response Examples

#### Upload Transcript
```http
POST /v1/transcripts/upload
Content-Type: multipart/form-data

{
  "file": <PDF file>
}

Response: 202 Accepted
{
  "transcript_id": "uuid",
  "status": "pending",
  "message": "Transcript uploaded and queued for processing"
}
```

#### Get Recommendations
```http
GET /v1/help-requests/{id}/recommendations

Response: 200 OK
{
  "request_id": "uuid",
  "course_code": "CS 101",
  "recommendations": [
    {
      "helper_id": "uuid",
      "helper_name": "John Doe",
      "grade": "A",
      "grade_score": 4.0,
      "semester": "Fall 2023",
      "rank": 1,
      "contact_info": "john.doe@email.com"  // if permission granted
    },
    ...
  ]
}
```

## Processing Pipeline

### PDF Processing Flow

```
1. User uploads PDF
   ↓
2. Store PDF in object storage (MinIO/S3)
   ↓
3. Create transcript record (status: 'pending')
   ↓
4. Queue Celery task for processing
   ↓
5. Worker picks up task:
   a. Download PDF from storage
   b. Extract text using pdfplumber/OCR
   c. Parse course information (regex/NLP)
   d. Extract: course code, name, grade, semester, year
   e. Store courses in database
   f. Update transcript status to 'completed'
   ↓
6. User can view extracted courses
```

### Matching Algorithm

```
1. User creates help request for course_code
   ↓
2. Query database for all courses matching course_code
   WHERE course_code = ? AND user_id != requester_id
   ↓
3. Rank by grade_score (normalized to 0.0-4.0):
   - A/A+ = 4.0
   - A- = 3.7
   - B+ = 3.3
   - B = 3.0
   - B- = 2.7
   - C+ = 2.3
   - C = 2.0
   - etc.
   ↓
4. Secondary sorting: recency (most recent semester first)
   ↓
5. Return top N recommendations (default: 10)
```

## Performance Optimizations

### Backend
1. **Async Processing**: Use Celery for PDF processing (non-blocking)
2. **Caching**: Redis cache for frequently accessed recommendations
3. **Database Indexing**: Indexes on course_code, user_id, etc.
4. **Connection Pooling**: SQLAlchemy connection pool
5. **Pagination**: All list endpoints support pagination

### Frontend
1. **Code Splitting**: Next.js automatic code splitting
2. **Image Optimization**: Next.js Image component
3. **Caching**: React Query for API response caching
4. **Lazy Loading**: Load recommendations on demand

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **File Upload**: 
   - Validate file type (PDF only)
   - Limit file size (e.g., 10MB)
   - Virus scanning (optional)
3. **Authorization**: Users can only access their own data
4. **Rate Limiting**: Prevent abuse of upload endpoints
5. **Data Privacy**: Only show contact info with permission

## Deployment Architecture

### Development
```
docker-compose up
- PostgreSQL container
- Redis container
- MinIO container
- Backend API container
- Frontend dev server
```

### Production
```
- Load Balancer (Nginx)
- Backend API (multiple instances)
- Celery Workers (separate containers)
- PostgreSQL (managed service or container)
- Redis
- MinIO/S3 (object storage)
- Frontend (static build on CDN)
```

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API allows multiple instances
2. **Worker Scaling**: Add more Celery workers for PDF processing
3. **Database**: Read replicas for query scaling
4. **CDN**: Serve static assets and PDFs via CDN
5. **Caching**: Redis for hot data (recommendations, user profiles)

