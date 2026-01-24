# NuPeer API Endpoints

Base URL: `http://localhost:8000` (local) or `https://nupeer-production.up.railway.app` (production)

## 📚 Interactive API Documentation

- **Swagger UI:** `/api/docs`
- **ReDoc:** `/api/redoc`

---

## 🔧 System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root - returns version info |
| GET | `/health` | Health check endpoint |
| GET | `/debug/cors` | Debug CORS configuration |

---

## 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | ❌ |
| POST | `/api/v1/auth/login` | Login user | ❌ |
| GET | `/api/v1/auth/me` | Get current user info | ✅ |
| POST | `/api/v1/auth/change-password` | Change password | ✅ |
| PUT | `/api/v1/auth/update-major` | Update user major | ✅ |
| PUT | `/api/v1/auth/update-phone` | Update phone number | ✅ |
| DELETE | `/api/v1/auth/delete-account` | Delete user account | ✅ |

---

## 📄 Transcripts (`/api/v1/transcripts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/transcripts/upload` | Upload transcript PDF | ✅ |
| GET | `/api/v1/transcripts` | Get all user transcripts | ✅ |
| GET | `/api/v1/transcripts/{transcript_id}` | Get specific transcript | ✅ |
| GET | `/api/v1/transcripts/{transcript_id}/status` | Get transcript processing status | ✅ |
| POST | `/api/v1/transcripts/{transcript_id}/process` | Manually trigger processing | ✅ |
| DELETE | `/api/v1/transcripts/{transcript_id}` | Delete transcript | ✅ |

---

## 📚 Courses (`/api/v1/courses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/courses` | Create new course | ✅ |
| GET | `/api/v1/courses` | Get all courses | ✅ |
| GET | `/api/v1/courses/search` | Search courses | ✅ |
| PUT | `/api/v1/courses/{course_id}` | Update course | ✅ |
| DELETE | `/api/v1/courses/{course_id}` | Delete course | ✅ |

---

## 🆘 Help Requests (`/api/v1/help-requests`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/help-requests` | Create help request | ✅ |
| GET | `/api/v1/help-requests` | Get all help requests | ✅ |
| GET | `/api/v1/help-requests/{request_id}` | Get specific help request | ✅ |
| DELETE | `/api/v1/help-requests/{request_id}` | Delete help request | ✅ |

---

## 💡 Recommendations (`/api/v1/recommendations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/recommendations/previous-tutors` | Get previous tutors | ✅ |
| GET | `/api/v1/recommendations/by-major` | Get recommendations by major | ✅ |
| GET | `/api/v1/recommendations/group-study` | Get group study recommendations | ✅ |
| GET | `/api/v1/recommendations/{request_id}` | Get recommendations for request | ✅ |
| GET | `/api/v1/recommendations/connected-brothers` | Get connected brothers | ✅ |

---

## 📊 Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/analytics/academic-trends` | Get academic analytics | ✅ |

---

## 📅 Calendar (`/api/v1/calendar`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/calendar` | Create calendar event | ✅ |
| GET | `/api/v1/calendar` | Get all calendar events | ✅ |
| GET | `/api/v1/calendar/{event_id}` | Get specific event | ✅ |
| PUT | `/api/v1/calendar/{event_id}` | Update event | ✅ |
| DELETE | `/api/v1/calendar/{event_id}` | Delete event | ✅ |
| POST | `/api/v1/calendar/{event_id}/participants` | Add participant to event | ✅ |
| DELETE | `/api/v1/calendar/{event_id}/participants/{participant_id}` | Remove participant | ✅ |
| GET | `/api/v1/calendar/invite-suggestions/tutors` | Get tutor invite suggestions | ✅ |
| GET | `/api/v1/calendar/invite-suggestions/brothers-major` | Get major-based invite suggestions | ✅ |
| GET | `/api/v1/calendar/invite-suggestions/study-group` | Get study group invite suggestions | ✅ |

---

## 👥 Mentorship (`/api/v1/mentorship`)

### Profile Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/mentorship/profile` | Create alumni profile | ✅ |
| GET | `/api/v1/mentorship/profile` | Get user's alumni profile | ✅ |
| GET | `/api/v1/mentorship/mentor-info/{profile_id}` | Get mentor info | ✅ |
| PUT | `/api/v1/mentorship/profile` | Update alumni profile | ✅ |

### Experiences

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/mentorship/experiences` | Add experience | ✅ |
| GET | `/api/v1/mentorship/experiences` | Get all experiences | ✅ |
| PUT | `/api/v1/mentorship/experiences/{experience_id}` | Update experience | ✅ |
| DELETE | `/api/v1/mentorship/experiences/{experience_id}` | Delete experience | ✅ |

### Resumes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/mentorship/resumes` | Upload resume | ✅ |
| GET | `/api/v1/mentorship/resumes` | Get all resumes | ✅ |

### Search

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/mentorship/search/mentors` | Search for mentors | ✅ |
| GET | `/api/v1/mentorship/search/mentees` | Search for mentees | ✅ |

### Mentorship Requests

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/mentorship/requests` | Create mentorship request | ✅ |
| GET | `/api/v1/mentorship/requests` | Get all mentorship requests | ✅ |
| PUT | `/api/v1/mentorship/requests/{request_id}/accept` | Accept mentorship request | ✅ |
| PUT | `/api/v1/mentorship/requests/{request_id}/reject` | Reject mentorship request | ✅ |

---

## 🏆 Points System (`/api/v1`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/points` | Get points summary | ✅ |
| GET | `/api/v1/points/history` | Get points history | ✅ |
| GET | `/api/v1/points/leaderboard` | Get leaderboard | ✅ |
| GET | `/api/v1/points/values` | Get points values | ✅ |

---

## 🔑 Authentication

Most endpoints require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_access_token>
```

Get your token by logging in at `/api/v1/auth/login`

---

## 📝 Notes

- All endpoints return JSON
- POST/PUT requests typically require a JSON body
- File uploads (transcripts, resumes) use `multipart/form-data`
- Error responses follow standard HTTP status codes
- See `/api/docs` for detailed request/response schemas

---

**Total Endpoints: 58+**

