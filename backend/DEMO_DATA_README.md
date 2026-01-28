# Demo Data Guide

Demo data for NuPeer is now imported directly from JSON in the frontend. The demo data file contains comprehensive data organized **page by page** to ensure every page has rich, realistic data for your presentation.

## 📋 What Gets Created (Page by Page)

### 📊 **Dashboard Page**
- 30 users (10 alumni, 20 students) with diverse majors
- Transcripts with 8-15 courses each
- Current courses (2-4 per student) for "Courses You're Taking"
- Points for leaderboard preview
- Group study recommendations
- Brothers in major matches

### 📈 **Analytics Page**
- Complete transcript data with GPA trends over multiple semesters
- Grade distributions (A+ to F)
- Credits earned by semester
- Course distribution by department
- Points trends over time
- Academic performance insights

### 🏆 **Leaderboard Page**
- 30 users with varied point totals (0-500+ points)
- Points history entries (3-25 per user)
- Realistic rankings with top performers
- Multiple point types (help provided, mentorship, profile completion, etc.)

### 📅 **Calendar Page**
- 25 calendar events over the next 30 days
- Mix of tutoring sessions and group study events
- Events with 3-9 participants each
- Various locations (in-person and online)
- Different event statuses (scheduled, with participants)

### 🆘 **Help Page**
- 18 help requests from students
- Each request has 1-3 tutor recommendations
- Recommendations ranked by grade (B+ or better)
- Connected brothers who have helped before
- Previous tutors section

### 🤝 **Mentorship Page**
- 10 complete alumni profiles
- Work experiences (2-4 per profile)
- Resumes (0-2 per profile)
- LinkedIn and website URLs
- 8 mentorship requests (pending, accepted, rejected)
- Mix of mentors and mentees

### 👤 **Profile Page**
- User stats (transcripts, courses, help requests)
- Points and ranking
- Complete profile information
- All user data visible

## 🚀 How to Use Demo Data

Demo data is automatically available in the frontend when demo mode is enabled. The demo data is stored in `frontend/lib/demo-data.json` and is imported directly by the frontend hooks.

### Enabling Demo Data

1. **Via Environment Variable:**
   Set `NEXT_PUBLIC_USE_DEMO_DATA=true` in your environment variables

2. **Via Local Storage:**
   The frontend includes a demo data toggle component that can enable/disable demo mode

3. **Automatic Fallback:**
   If the API fails in development mode, demo data will be used automatically

## 🔑 Demo User Credentials

**All demo users use the same password:** `demo123`

**Email format:** `firstname.lastname@demo.nupeer.com`

**Example users:**
- `john.smith0@demo.nupeer.com`
- `michael.johnson1@demo.nupeer.com`
- `david.williams2@demo.nupeer.com`
- `james.brown3@demo.nupeer.com`
- `robert.jones4@demo.nupeer.com`

You can log in with **any** user email ending in `@demo.nupeer.com` using password `demo123`.

## 📊 Data Summary

The demo data file includes:
- **Academic analytics** with GPA trends and grade distributions
- **15+ courses** with grades and credits
- **Points and leaderboard** data with rankings
- **10 calendar events** with participants
- **18 help requests** with recommendations
- **10 alumni profiles** with mentorship information
- **8 mentorship requests** with various statuses
- **Multiple transcripts** with processing status

## 🎯 Presentation Tips

1. **Start with Dashboard** - Shows overview with analytics preview
2. **Navigate to Analytics** - Deep dive into academic performance
3. **Check Leaderboard** - Show gamification and engagement
4. **View Calendar** - Demonstrate event scheduling
5. **Try Help Page** - Show tutor matching system
6. **Explore Mentorship** - Show alumni connections
7. **View Profile** - Show user's complete data

## 🗑️ Disabling Demo Data

To disable demo data:

1. **Remove environment variable:** Unset `NEXT_PUBLIC_USE_DEMO_DATA`
2. **Use the toggle:** Use the demo data toggle component in the frontend
3. **Clear local storage:** Remove `use_demo_data` from browser local storage

## ⚙️ Customization

You can customize the demo data by editing `frontend/lib/demo-data.json`:
- **Add more courses**: Add entries to the `courses` array
- **Add more calendar events**: Add entries to the `calendarEvents` array
- **Add more help requests**: Add entries to the `helpRequests` array
- **Modify alumni profiles**: Update the `alumniProfiles` array
- **Adjust leaderboard**: Modify the `leaderboard` array

The JSON structure matches the API response formats, so you can easily add or modify data.

## 🐛 Troubleshooting

**Demo data not showing:**
- Make sure demo mode is enabled (check environment variable or local storage)
- Verify `frontend/lib/demo-data.json` exists and is valid JSON
- Check browser console for any import errors

**JSON syntax errors:**
- Validate your JSON using a JSON validator
- Make sure all strings are properly quoted
- Check for trailing commas

**Data not matching expected format:**
- Verify the JSON structure matches the TypeScript interfaces in the hooks
- Check `frontend/lib/hooks/` for expected data structures

## 📝 Notes

- All demo users have the **same password** (`demo123`) for easy testing
- Dates are randomized but realistic (within past few years)
- Grades are weighted toward higher scores for better demo presentation
- Some users have more data than others for variety
- The script is **idempotent** - safe to run multiple times

## ✨ Next Steps

1. Enable demo data mode in the frontend
2. Navigate through all pages to verify data
3. Customize `demo-data.json` if needed for your presentation
4. Practice your demo flow!

The demo data is now completely frontend-based and doesn't require a backend database connection.

Good luck with your presentation! 🎉


