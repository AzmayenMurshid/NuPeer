# Fix: CORS Error + 502 Bad Gateway

You have **two separate issues** that need to be fixed:

## Issue 1: CORS Error (Still Happening)

**Error:** "No 'Access-Control-Allow-Origin' header is present"

**Cause:** `CORS_ORIGINS` in Railway doesn't include `https://nupeerzx.vercel.app`

**Fix:**
1. Railway → Backend Service → **Variables** tab
2. Find `CORS_ORIGINS`
3. Set to exactly: `["https://nupeerzx.vercel.app"]`
4. Save and wait for redeploy

---

## Issue 2: 502 Bad Gateway (Backend Down/Crashing)

**Error:** `502 (Bad Gateway)` means your backend is either:
- Not running
- Crashing on startup
- Not responding

**Fix Steps:**

### Step 1: Check if Backend is Running
1. Railway → Backend Service → **Deployments** tab
2. Check latest deployment status:
   - ✅ **Active** = Running (but might be crashing)
   - ❌ **Failed** = Deployment failed
   - ⏸️ **Stopped** = Service stopped

### Step 2: Check Logs for Errors
1. Railway → Backend Service → **Deployments** → Latest
2. Click on the deployment
3. Go to **Logs** tab
4. **What errors do you see?**
   - Look for Python errors
   - Look for "Application startup complete" (good sign)
   - Look for crash messages

### Step 3: Common 502 Causes & Fixes

**A. Backend Crashed on Startup**
- **Check logs** for the error
- Common causes:
  - Missing environment variable
  - Database connection failed
  - Import error

**B. Missing Environment Variables**
- Railway → Variables tab
- Verify these exist:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `CORS_ORIGINS`
  - `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`
  - `REDIS_URL`

**C. Database Connection Failed**
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL service is running in Railway
- Check logs for database connection errors

**D. Service Stopped**
- Railway → Backend Service
- If status is "Stopped", click **Start** or **Restart**

### Step 4: Test Backend Directly
1. Visit: `https://nupeer-production.up.railway.app/health`
2. **If you get 502:**
   - Backend is definitely down/crashing
   - Check Railway logs for the error
3. **If you get `{"status":"healthy"}`:**
   - Backend is running
   - Issue is just CORS configuration

---

## Quick Fix Checklist

### For CORS Error:
- [ ] Railway → Backend Service → Variables
- [ ] `CORS_ORIGINS` = `["https://nupeerzx.vercel.app"]`
- [ ] Save and wait for redeploy

### For 502 Error:
- [ ] Check Railway → Deployments → Latest status
- [ ] Check Logs tab for errors
- [ ] Verify all environment variables are set
- [ ] Check if PostgreSQL service is running
- [ ] Test `/health` endpoint directly

---

## Most Likely Scenario

Based on the errors, your backend is probably:
1. **Crashing on startup** (causing 502)
2. **CORS not configured** (causing CORS errors when it does respond)

**Fix both:**
1. Check Railway logs to see why backend is crashing
2. Fix the crash issue (usually missing env var or database issue)
3. Update `CORS_ORIGINS` to include your Vercel domain
4. Redeploy and test

---

## What to Check First

**Go to Railway → Backend Service → Deployments → Latest → Logs**

**Look for:**
- ❌ "ModuleNotFoundError" → Missing dependency
- ❌ "Database connection failed" → DATABASE_URL issue
- ❌ "SECRET_KEY not found" → Missing env variable
- ❌ "Application startup complete" → Backend started (good!)
- ❌ Any Python traceback → Shows the exact error

**The logs will tell you exactly what's wrong!**

---

## After Fixing

Once both are fixed:
1. Backend should show "Active" in Railway
2. `/health` endpoint should return `{"status":"healthy"}`
3. CORS errors should be gone
4. API calls from Vercel should work

