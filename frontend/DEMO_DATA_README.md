# Frontend Demo Data

This frontend uses a JSON file (`lib/demo-data.json`) to populate all pages with demo data for presentations.

## 🎯 How It Works

The app automatically uses demo data when:
1. **Environment variable** `NEXT_PUBLIC_USE_DEMO_DATA=true` is set
2. **LocalStorage** has `use_demo_data=true` set
3. **API fails** - automatically falls back to demo data

## 📋 Demo Data Structure

The `lib/demo-data.json` file contains data for:

- **Academic Analytics** - GPA trends, grade distributions, course analysis
- **Courses** - Complete course history with grades
- **Points** - User points and leaderboard rankings
- **Calendar Events** - Tutoring and group study sessions
- **Help Requests** - Course help requests with recommendations
- **Mentorship** - Alumni profiles and mentorship requests
- **Transcripts** - Uploaded transcript records

## 🚀 Enabling Demo Data

### Option 1: Environment Variable (Recommended for Production)

Add to your `.env.local` or Vercel environment variables:
```
NEXT_PUBLIC_USE_DEMO_DATA=true
```

### Option 2: LocalStorage (For Testing)

Open browser console and run:
```javascript
localStorage.setItem('use_demo_data', 'true')
// Then refresh the page
```

Or disable:
```javascript
localStorage.removeItem('use_demo_data')
```

### Option 3: Automatic Fallback

Demo data is automatically used when API calls fail, so the app always shows data even if the backend is down.

## 📊 What Gets Populated

### Dashboard Page
- Academic analytics with GPA trends
- 15+ courses (mix of completed and current)
- Group study recommendations
- Brothers in major matches
- Points and leaderboard preview

### Analytics Page
- Complete GPA trend over 9 semesters
- Grade distribution (A+ to C)
- Credits by semester
- Course distribution by department (CS, MATH, PHYS, ECON, ENGL, PSYC)
- Points trend over time

### Leaderboard Page
- 20 users with rankings
- Points from 70 to 1250
- Realistic rankings with varied distributions

### Calendar Page
- 10 calendar events
- Mix of tutoring and group study
- Events with 2-5 participants each
- Various locations (in-person and online)

### Help Page
- 18 help requests
- Recommendations for each request (1-3 tutors per request)
- Previous tutors section
- Connected brothers with course history

### Mentorship Page
- 10 alumni profiles with diverse industries
- 8 mentorship requests with various statuses
- Work experiences and company information
- LinkedIn and website URLs

### Profile Page
- User stats
- Transcripts
- Courses
- Help requests
- Points history

## 🔧 Customizing Demo Data

Edit `frontend/lib/demo-data.json` to customize:

1. **Add more data** - Expand arrays with more entries
2. **Change values** - Update grades, points, dates, etc.
3. **Add new fields** - Match your API response structure

## 🐛 Troubleshooting

**Demo data not showing:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_USE_DEMO_DATA` is set
- Check localStorage: `localStorage.getItem('use_demo_data')`

**API still being called:**
- Demo data is used as fallback, but API is still attempted first
- Set environment variable to force demo mode

**Data not matching:**
- Ensure JSON structure matches TypeScript interfaces
- Check hook implementations in `lib/hooks/`

## 📝 Notes

- Demo data includes realistic delays (500ms) to simulate API calls
- All hooks automatically fall back to demo data on API errors
- Demo data is cached by React Query like real API data
- You can mix demo data with real API data (demo as fallback)

## ✨ Benefits

1. **No backend required** - Present the app without a running backend
2. **Consistent data** - Same data every time for reliable demos
3. **Fast loading** - No network delays (simulated delay is minimal)
4. **Easy customization** - Just edit the JSON file
5. **Automatic fallback** - Works even if backend is down

Perfect for presentations! 🎉


