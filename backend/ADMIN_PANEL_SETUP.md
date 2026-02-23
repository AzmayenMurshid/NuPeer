# Admin Panel Setup Guide

## Overview

The admin panel allows authorized administrators to:
- Search users by first name, last name, or email (username)
- Add points to users
- Remove points from users (using negative values)
- View and manage user points

## Security Features

### 1. Password Protection (Frontend)
- **Default Password**: `NuPeerAdmin2024!`
- Password is checked before accessing the admin panel
- Password verification is stored in session storage (cleared when browser closes)
- To change the password, edit `frontend/app/admin/page.tsx`:
  ```typescript
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'NuPeerAdmin2024!'
  ```
- Or set environment variable: `NEXT_PUBLIC_ADMIN_PASSWORD=YourNewPassword`

### 2. Backend Admin Check
- Only users with admin emails can access admin endpoints
- Configure admin emails in `backend/app/api/v1/admin.py`:
  ```python
  ADMIN_EMAILS = [
      "admin@nupeer.com",
      "your-admin-email@example.com",
  ]
  ```

## Features

### User Search
- Search by **first name**
- Search by **last name**  
- Search by **email** (username)
- Case-insensitive search
- Returns up to 20 matching users

### Points Management
- **Add Points**: Enter positive number (e.g., `50`)
- **Remove Points**: Enter negative number (e.g., `-25`)
- **Quick Adjustments**: Use +/- buttons to adjust by 10 points
- **Description**: Optional reason for the adjustment (logged in history)
- **Audit Trail**: All changes are logged in points history with admin email

## Usage

1. Navigate to `/admin` (link in footer)
2. Enter admin password
3. Search for user by name or email
4. Click on user to select them
5. Enter points to add/remove
6. Add optional description
7. Click "Update Points"

## API Endpoints

- `GET /api/v1/admin/check` - Check if current user is admin
- `GET /api/v1/admin/users/search?query=...` - Search users
- `POST /api/v1/admin/points/update` - Update user points

## Security Best Practices

1. **Change Default Password**: Update `ADMIN_PASSWORD` in production
2. **Use Environment Variables**: Set `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel/environment
3. **Limit Admin Emails**: Only add trusted emails to `ADMIN_EMAILS`
4. **Monitor Activity**: Check points history for all admin adjustments
5. **Session Management**: Password verification expires when browser closes

## Example Usage

### Adding Points
```
User: John Doe
Current Points: 100
Points to Add: 50
Description: "Event participation bonus"
Result: 150 points
```

### Removing Points
```
User: Jane Smith
Current Points: 200
Points to Remove: -25
Description: "Correction for duplicate award"
Result: 175 points
```

