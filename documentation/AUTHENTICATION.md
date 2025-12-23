# Authentication & User Profiles

## Overview

NuPeer now includes a complete authentication system that allows brothers to:
- Create personalized profiles
- Securely upload and manage their transcripts
- Access all their data through their profile
- Keep their transcripts organized under their account

## Features

### Authentication
- **Registration**: Brothers can create accounts with:
  - Email and password
  - First and last name
  - Pledge class (optional)
  - Graduation year (optional)
  
- **Login**: Secure JWT-based authentication
- **Session Management**: Tokens stored in localStorage, automatically included in API requests

### User Profiles
- **Profile Page** (`/profile`): Shows:
  - User information (name, email, pledge class, graduation year)
  - Statistics (number of transcripts, help requests, courses)
  - List of all uploaded transcripts with status
  - List of all help requests
  - Quick links to upload new transcripts or create help requests

### Data Organization
- **User-Specific Data**: All transcripts and help requests are automatically linked to the authenticated user
- **Backend Integration**: The API uses JWT tokens to identify users and associate data correctly
- **Protected Routes**: Upload and Help pages require authentication

## Pages

### `/login`
- Email/password login form
- Redirects to home after successful login
- Link to registration page

### `/register`
- Complete registration form
- Password confirmation
- Redirects to login after successful registration

### `/profile`
- Protected route (requires authentication)
- Displays user information and statistics
- Shows all user's transcripts and help requests
- Quick access to upload and help features

### `/upload` (Protected)
- Requires authentication
- Only shows transcripts for the logged-in user
- Automatically links uploaded transcripts to user account

### `/help` (Protected)
- Requires authentication
- Only shows help requests for the logged-in user
- Recommendations are personalized based on user's courses

## Technical Implementation

### Authentication Flow
1. User registers → Account created in database
2. User logs in → Receives JWT access token
3. Token stored in localStorage
4. All API requests include token in Authorization header
5. Backend validates token and extracts user ID
6. All data operations use authenticated user's ID

### Protected Routes
- Uses `ProtectedRoute` component wrapper
- Automatically redirects to `/login` if not authenticated
- Shows loading state while checking authentication

### API Integration
- All API hooks automatically include JWT token
- Backend endpoints use `get_current_user` dependency
- Transcripts automatically linked via `user_id` foreign key
- Help requests automatically linked via `requester_id` foreign key

## Security Features

- **Password Hashing**: Passwords hashed with bcrypt
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Tokens expire after 30 minutes (configurable)
- **Automatic Logout**: Redirects to login on 401 errors
- **Protected Endpoints**: All data endpoints require authentication

## User Experience

### For New Users
1. Visit homepage → See welcome message
2. Click "Get Started" → Register account
3. After registration → Redirected to login
4. After login → Access to all features

### For Existing Users
1. Visit homepage → See profile link and main features
2. Click "Sign In" → Login with credentials
3. After login → Full access to profile, upload, and help features

### Profile Management
- View all transcripts in one place
- Track processing status
- Manage help requests
- Quick navigation to upload or request help

## Database Organization

All data is properly organized by user:

```
users
  ├── id (UUID)
  ├── email
  ├── first_name, last_name
  ├── pledge_class, graduation_year
  └── hashed_password

transcripts
  ├── id (UUID)
  ├── user_id → users.id (Foreign Key)
  ├── file_path, file_name
  └── processing_status

courses
  ├── id (UUID)
  ├── user_id → users.id (Foreign Key)
  ├── transcript_id → transcripts.id (Foreign Key)
  └── course_code, grade, etc.

help_requests
  ├── id (UUID)
  ├── requester_id → users.id (Foreign Key)
  └── course_code, status
```

This ensures:
- Each user only sees their own data
- Transcripts are properly linked to users
- Recommendations are based on authenticated user's needs
- Data is secure and organized

