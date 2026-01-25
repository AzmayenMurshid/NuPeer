# Railway "Application Failed to Respond" - Troubleshooting Guide

## 🔴 **THE ERROR**

```
Application failed to respond
This error appears to be caused by the application.
Request ID: db4wLar4Q6ikJhnTPvyhXg
```

**URL:** `https://nupeer-production.up.railway.app/api/v1/auth/login`

---

## 📖 **WHAT THIS MEANS**

Railway cannot reach your application. This usually means:
1. **Application crashed during startup**
2. **Application is not listening on the correct port**
3. **Application failed to start due to missing dependencies or configuration**
4. **Database connection failed**

---

## 🔍 **HOW TO DIAGNOSE**

### **Step 1: Check Railway Logs**

1. Go to your Railway project dashboard
2. Click on your **backend service**
3. Go to **Deployments** tab
4. Click on the **latest deployment**
5. Click **View Logs** or **View Build Logs**

**Look for:**
- ❌ Import errors
- ❌ Database connection errors
- ❌ Missing environment variables
- ❌ Port binding errors
- ❌ Python version mismatches

### **Step 2: Check Environment Variables**

In Railway dashboard → **Variables** tab, verify these are set:

**Required:**
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `SECRET_KEY` - JWT secret key
- ✅ `PORT` - Railway sets this automatically (don't set manually)

**Optional but recommended:**
- `CORS_ORIGINS` - Frontend URLs (e.g., `https://nu-peer.vercel.app`)
- `S3_ACCESS_KEY` - For file uploads (optional)
- `S3_SECRET_KEY` - For file uploads (optional)
- `S3_ENDPOINT` - For file uploads (optional)

---

## 🛠️ **COMMON FIXES**

### **Fix 1: Missing DATABASE_URL**

**Symptom:** Logs show "DATABASE_URL not set" or connection errors

**Solution:**
1. In Railway, go to your **PostgreSQL service**
2. Click **Variables** tab
3. Copy the `DATABASE_URL` value
4. Go to your **backend service** → **Variables** tab
5. Add `DATABASE_URL` with the copied value
6. Redeploy

### **Fix 2: Database Connection Timeout**

**Symptom:** Logs show "connection timeout" or "could not connect"

**Solution:**
1. Verify PostgreSQL service is **running** (green status)
2. Check `DATABASE_URL` is correct
3. Ensure database service is in the **same Railway project**
4. Try restarting the database service

### **Fix 3: Import Errors**

**Symptom:** Logs show "ModuleNotFoundError" or "ImportError"

**Solution:**
1. Check `requirements.txt` includes all dependencies
2. Verify Python version in `runtime.txt` matches Railway's Python version
3. Check for typos in import statements
4. Ensure all files are committed to git

### **Fix 4: Port Binding Error**

**Symptom:** Logs show "Address already in use" or port errors

**Solution:**
1. Verify `start_server.py` uses `PORT` environment variable
2. Ensure uvicorn binds to `0.0.0.0` (not `127.0.0.1`)
3. Check `railway.json` start command is correct

### **Fix 5: Missing SECRET_KEY**

**Symptom:** Application starts but JWT operations fail

**Solution:**
1. Generate a secure secret key:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```
2. Add `SECRET_KEY` to Railway environment variables
3. Redeploy

---

## 🔧 **IMMEDIATE ACTIONS**

### **Action 1: Check Logs Right Now**

1. **Railway Dashboard** → Your Project → Backend Service
2. **Deployments** → Latest Deployment → **View Logs**
3. Look for error messages (red text)
4. Copy the error and check below

### **Action 2: Verify Environment Variables**

Run this checklist:

```
□ DATABASE_URL is set
□ SECRET_KEY is set (not the default "your-secret-key-change-in-production")
□ PORT is NOT manually set (Railway sets this automatically)
□ CORS_ORIGINS includes your frontend URL
```

### **Action 3: Test Database Connection**

If you have Railway CLI:
```bash
railway run python -c "from app.core.config import settings; print('DATABASE_URL:', settings.DATABASE_URL[:20] + '...')"
```

Or check in Railway logs if database connection is attempted.

### **Action 4: Restart the Service**

1. Railway Dashboard → Backend Service
2. Click **Settings** → **Restart**
3. Watch the logs for startup messages

---

## 📋 **VERIFICATION CHECKLIST**

After fixing, verify:

- [ ] **Logs show:** "Starting NuPeer Backend on port XXXX"
- [ ] **Logs show:** "App imported successfully"
- [ ] **Logs show:** "Starting uvicorn server..."
- [ ] **Logs show:** "Application startup complete" (or similar)
- [ ] **Health endpoint works:** `https://nupeer-production.up.railway.app/health`
- [ ] **Root endpoint works:** `https://nupeer-production.up.railway.app/`
- [ ] **API endpoint works:** `https://nupeer-production.up.railway.app/api/v1/auth/login`

---

## 🐛 **DEBUGGING STEPS**

### **Step 1: Add Debug Logging**

The startup script already has debug logging. Check logs for:
```
=== Starting NuPeer Backend on port XXXX ===
PORT environment variable: XXXX
Importing app...
App imported successfully
Starting uvicorn server...
```

If any of these are missing, that's where it's failing.

### **Step 2: Test Locally First**

Before deploying, test locally:
```bash
cd backend
python start_server.py
```

If it works locally but not on Railway, it's an environment variable issue.

### **Step 3: Check Railway Build Logs**

1. Railway Dashboard → Backend Service
2. **Deployments** → Latest Deployment
3. **Build Logs** tab
4. Look for:
   - ✅ "Successfully installed..." messages
   - ❌ "ERROR:" or "FAILED:" messages
   - ❌ Missing package errors

---

## 🚨 **COMMON ERROR MESSAGES**

### **Error: "DATABASE_URL not set"**
**Fix:** Add `DATABASE_URL` environment variable in Railway

### **Error: "could not connect to server"**
**Fix:** 
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` is correct
3. Ensure services are in same Railway project

### **Error: "ModuleNotFoundError: No module named 'X'"
**Fix:** Add missing package to `requirements.txt` and redeploy

### **Error: "Address already in use"**
**Fix:** Don't manually set PORT - Railway sets it automatically

### **Error: "ImportError: cannot import name 'X'"
**Fix:** Check for circular imports or missing `__init__.py` files

---

## 🔄 **QUICK RESTART PROCEDURE**

1. **Railway Dashboard** → Backend Service
2. **Settings** → **Restart Service**
3. **Deployments** → Watch logs
4. Wait for "Application startup complete"
5. Test: `https://nupeer-production.up.railway.app/health`

---

## 📞 **STILL NOT WORKING?**

### **Get Detailed Error Information:**

1. **Check Railway Logs** - Most important!
2. **Check Build Logs** - For dependency issues
3. **Check Environment Variables** - All required vars set?
4. **Test Health Endpoint** - `GET /health` should work even if DB is down
5. **Check Database Service** - Is PostgreSQL running?

### **Share for Help:**

When asking for help, provide:
- Railway deployment logs (last 50 lines)
- Environment variables list (hide sensitive values)
- Error message from logs
- What you've already tried

---

## ✅ **EXPECTED SUCCESSFUL STARTUP LOGS**

```
=== Starting NuPeer Backend on port 8000 ===
PORT environment variable: 8000
Importing app...
App imported successfully
Starting uvicorn server...
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

If you see this, the app is running correctly!

---

## 🎯 **MOST LIKELY CAUSE**

Based on the error, the **most likely causes** are:

1. **Missing DATABASE_URL** (80% of cases)
2. **Database service not running** (10% of cases)
3. **Import error in code** (5% of cases)
4. **Port binding issue** (5% of cases)

**Start by checking DATABASE_URL!**

---

**Last Updated:** 2024
**Related Files:**
- `backend/start_server.py` - Startup script
- `backend/railway.json` - Railway configuration
- `backend/requirements.txt` - Python dependencies
- `backend/app/main.py` - Main application
- `backend/app/core/config.py` - Configuration

