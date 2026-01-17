# Fix CORS and 502 Errors - Step by Step

I've updated your code to better handle CORS configuration. Now follow these steps in Railway:

## ✅ Code Changes Made

1. **Improved CORS parsing** - Now supports JSON array, comma-separated, or single value
2. **Added logging** - Backend will log CORS origins on startup
3. **Better error handling** - More robust CORS configuration

---

## 🔧 Step 1: Fix CORS_ORIGINS in Railway

### Go to Railway Dashboard:
1. Visit [railway.app](https://railway.app/)
2. Your Project → **Backend Service**
3. Click **Variables** tab

### Update CORS_ORIGINS:
1. Find `CORS_ORIGINS` variable
2. Click **Edit** (or delete and recreate)
3. **Set the value to exactly:**
   ```
   ["https://nupeerzx.vercel.app"]
   ```
   **Important:** Use double quotes, JSON array format, no trailing slash

4. Click **Save**

### Alternative Formats (all work now):
- JSON array: `["https://nupeerzx.vercel.app"]` ✅
- Comma-separated: `https://nupeerzx.vercel.app` ✅
- Multiple domains: `["https://nupeerzx.vercel.app","https://nupeer.com"]` ✅

---

## 🔧 Step 2: Check Backend Status (Fix 502 Error)

### Check if Backend is Running:
1. Railway → Backend Service → **Deployments** tab
2. Check latest deployment:
   - ✅ **Active** = Running
   - ❌ **Failed** = Needs fixing
   - ⏸️ **Stopped** = Start it

### Check Logs:
1. Railway → Deployments → Latest → **Logs** tab
2. **Look for:**
   - ✅ "Application startup complete" = Good!
   - ✅ "CORS Origins configured: [...]" = CORS loaded correctly
   - ❌ Any Python errors = Fix those first

### Common 502 Causes:

**A. Missing Environment Variables:**
- Railway → Variables tab
- **Required variables:**
  - `DATABASE_URL` (from PostgreSQL service)
  - `SECRET_KEY` (generate one)
  - `CORS_ORIGINS` (set above)
  - `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`
  - `REDIS_URL` (if using Redis)

**B. Database Not Connected:**
- Railway → PostgreSQL Service → Variables
- Copy `DATABASE_URL`
- Add to Backend Service → Variables

**C. Service Stopped:**
- Railway → Backend Service
- If "Stopped", click **Start** or **Restart**

---

## 🔧 Step 3: Verify Everything Works

### Test Backend Health:
1. Visit: `https://nupeer-production.up.railway.app/health`
2. Should return: `{"status":"healthy"}`
3. If 502, backend is down → check logs

### Test CORS:
1. After updating `CORS_ORIGINS` and redeploying
2. Open your Vercel site: `https://nupeerzx.vercel.app`
3. Open DevTools → Network tab
4. Try to register/login
5. Should see successful requests (200 status)
6. No CORS errors in console

### Check Railway Logs:
After redeploy, check logs for:
```
INFO: CORS Origins configured: ['https://nupeerzx.vercel.app']
INFO: Application startup complete.
```

---

## 📋 Complete Checklist

- [ ] Railway → Backend Service → Variables
- [ ] `CORS_ORIGINS` = `["https://nupeerzx.vercel.app"]`
- [ ] Save and wait for redeploy
- [ ] Check Railway → Deployments → Latest status = "Active"
- [ ] Check Logs for "Application startup complete"
- [ ] Test `/health` endpoint returns `{"status":"healthy"}`
- [ ] Test Vercel site - no CORS errors
- [ ] API calls work from Vercel

---

## 🆘 Still Not Working?

### If CORS Error Persists:
1. **Check Railway Logs** - Look for "CORS Origins configured:"
2. **Verify Format** - Must be `["https://nupeerzx.vercel.app"]` (JSON array)
3. **Check Backend Restarted** - Deployment must complete after changing variable

### If 502 Error Persists:
1. **Check Logs** - Railway → Deployments → Logs
2. **Look for Python errors** - Shows exact problem
3. **Verify All Variables** - All required env vars must be set
4. **Check Database** - PostgreSQL service must be running

---

## 🎯 Quick Summary

1. **Set CORS_ORIGINS** in Railway to: `["https://nupeerzx.vercel.app"]`
2. **Check Backend Logs** to see if it's running
3. **Fix any errors** shown in logs
4. **Test** `/health` endpoint
5. **Test** your Vercel site

The code is now updated to handle CORS better. Just set the environment variable correctly in Railway!

