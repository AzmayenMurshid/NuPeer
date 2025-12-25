# NuPeer API Design Documentation

## Base Information

- **Base URL**: `http://localhost:8000/api/v1` (development)
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json` (except file uploads: `multipart/form-data`)

## Authentication Flow

1. User registers with email/password
2. User logs in to receive JWT access token
3. Token included in `Authorization: Bearer <token>` header for all protected endpoints
4. Token expires after 30 minutes (configurable)

## Endpoint Specifications

### Authentication Endpoints

#### POST `/auth/register`
Register a new brother account.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "pledge_class": "Alpha",
  "graduation_year": 2025
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "pledge_class": "Alpha",
  "graduation_year": 2025
}
```

#### POST `/auth/login`
Login and receive access token.

**Request Body (form-data):**
```
username: john.doe@example.com
password: securepassword123
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET `/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "pledge_class": "Alpha",
  "graduation_year": 2025
}
```

---

### Transcript Endpoints

#### POST `/transcripts/upload`
Upload a transcript PDF file.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
file: <PDF file>
```

**Response:** `202 Accepted`
```json
{
  "id": "uuid",
  "file_name": "transcript.pdf",
  "file_size": 245678,
  "upload_date": "2024-01-15T10:30:00Z",
  "processing_status": "pending",
  "processed_at": null,
  "error_message": null
}
```

**Notes:**
- File is immediately uploaded to object storage
- Processing happens asynchronously via Celery
- Check status with `/transcripts/{id}/status`

#### GET `/transcripts`
List all transcripts for the current user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "file_name": "transcript.pdf",
    "file_size": 245678,
    "upload_date": "2024-01-15T10:30:00Z",
    "processing_status": "completed",
    "processed_at": "2024-01-15T10:31:23Z",
    "error_message": null
  }
]
```

#### GET `/transcripts/{id}`
Get specific transcript details.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "file_name": "transcript.pdf",
  "file_size": 245678,
  "upload_date": "2024-01-15T10:30:00Z",
  "processing_status": "completed",
  "processed_at": "2024-01-15T10:31:23Z",
  "error_message": null
}
```

#### GET `/transcripts/{id}/status`
Check processing status of a transcript.

**Response:** Same as `/transcripts/{id}`

**Processing Status Values:**
- `pending`: Uploaded, waiting for processing
- `processing`: Currently being processed
- `completed`: Successfully processed, courses extracted
- `failed`: Processing failed (check `error_message`)

#### DELETE `/transcripts/{id}`
Delete a transcript and all associated courses.

**Response:** `204 No Content`

---

### Course Endpoints

#### GET `/courses`
List all courses for the current user.

**Query Parameters:**
- `course_code` (optional): Filter by course code (partial match)

**Example:** `/courses?course_code=CS`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "course_code": "CS 101",
    "course_name": "Introduction to Computer Science",
    "grade": "A",
    "grade_score": 4.0,
    "credit_hours": 3.0,
    "semester": "Fall",
    "year": 2023
  }
]
```

#### GET `/courses/search`
Search courses by code or name.

**Query Parameters:**
- `q` (required): Search query

**Example:** `/courses/search?q=computer`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "course_code": "CS 101",
    "course_name": "Introduction to Computer Science",
    "grade": "A",
    "grade_score": 4.0,
    "credit_hours": 3.0,
    "semester": "Fall",
    "year": 2023
  }
]
```

---

### Help Request Endpoints

#### POST `/help-requests`
Create a new help request for a specific course.

**Request Body:**
```json
{
  "course_code": "CS 101",
  "course_name": "Introduction to Computer Science"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "course_code": "CS 101",
  "course_name": "Introduction to Computer Science",
  "status": "active",
  "created_at": "2024-01-15T11:00:00Z"
}
```

#### GET `/help-requests`
List all help requests for the current user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "course_code": "CS 101",
    "course_name": "Introduction to Computer Science",
    "status": "active",
    "created_at": "2024-01-15T11:00:00Z"
  }
]
```

#### GET `/help-requests/{id}`
Get specific help request details.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "course_code": "CS 101",
  "course_name": "Introduction to Computer Science",
  "status": "active",
  "created_at": "2024-01-15T11:00:00Z"
}
```

#### DELETE `/help-requests/{id}`
Cancel a help request (sets status to "cancelled").

**Response:** `204 No Content`

---

### Recommendation Endpoints

#### GET `/recommendations/{request_id}`
Get ranked recommendations for a help request.

**Query Parameters:**
- `limit` (optional, default: 10): Maximum number of recommendations

**Example:** `/recommendations/{request_id}?limit=5`

**Response:** `200 OK`
```json
{
  "request_id": "uuid",
  "course_code": "CS 101",
  "recommendations": [
    {
      "helper_id": "uuid",
      "helper_name": "Jane Smith",
      "helper_email": "jane.smith@example.com",
      "course_code": "CS 101",
      "grade": "A",
      "grade_score": 4.0,
      "semester": "Fall",
      "year": 2023,
      "rank": 1
    },
    {
      "helper_id": "uuid",
      "helper_name": "Bob Johnson",
      "helper_email": "bob.johnson@example.com",
      "course_code": "CS 101",
      "grade": "A-",
      "grade_score": 3.7,
      "semester": "Spring",
      "year": 2023,
      "rank": 2
    }
  ]
}
```

**Ranking Algorithm:**
1. Primary: `grade_score` (descending) - Higher grades ranked first
2. Secondary: `year` (descending) - More recent semesters preferred
3. Tertiary: `semester` (alphabetical) - Consistent ordering

**Notes:**
- Only shows brothers who have completed the course
- Excludes the requester's own courses
- Only includes courses with valid grades
- Email shown if privacy settings allow (future feature)

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Error message describing what went wrong"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

**Recommended limits (to be implemented):**
- Authentication endpoints: 5 requests per minute
- File upload: 10 requests per hour
- Other endpoints: 100 requests per minute

---

## Pagination

List endpoints support pagination (to be implemented):

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Per-Page: 20
```

---

## WebSocket Support (Future)

Real-time updates for transcript processing status:

```
ws://localhost:8000/ws/transcripts/{transcript_id}
```

**Messages:**
- `{"status": "processing", "progress": 50}`
- `{"status": "completed", "courses_count": 25}`
- `{"status": "failed", "error": "..."}`

