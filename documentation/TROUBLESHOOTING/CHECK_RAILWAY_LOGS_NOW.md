# How to Check Railway Logs - Step by Step

## 🎯 **What You Should See in Railway Logs**

When you check Railway deployment logs, you should see **Python application output**, not markdown text.

### **✅ GOOD Logs Look Like This:**

```
=== Starting NuPeer Backend on port 8000 ===
PORT environment variable: 8000

=== Checking Environment Variables ===
✓ DATABASE_URL: postgresql://...
✓ SECRET_KEY: Set (hidden for security)

=== Importing Application ===
✓ App imported successfully

=== Starting Uvicorn Server ===
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **❌ BAD Logs Look Like This:**

```
❌ ERROR: Failed to import app: ...
ModuleNotFoundError: No module named 'X'
```

OR

```
⚠️  WARNING: DATABASE_URL is not set!
```

---

## 📋 **Step-by-Step: Check Your Railway Logs**

### **Step 1: Go to Railway Dashboard**
1. Visit: https://railway.app/
2. Login to your account
3. Click on your **project**

### **Step 2: Open Backend Service**
1. Click on your **backend service** (the one that runs Python)
2. You should see tabs: **Deployments**, **Variables**, **Settings**, etc.

### **Step 3: View Deployment Logs**
1. Click **Deployments** tab
2. Click on the **latest deployment** (top of the list)
3. You'll see:
   - **Build Logs** - Shows pip install, building
   - **Deploy Logs** - Shows application startup

### **Step 4: Read the Logs**
Look for these key messages:

**✅ Success Indicators:**
- `=== Starting NuPeer Backend on port XXXX ===`
- `✓ App imported successfully`
- `INFO: Application startup complete`
- `Uvicorn running on http://0.0.0.0:XXXX`

**❌ Error Indicators:**
- `❌ ERROR:`
- `ModuleNotFoundError`
- `ImportError`
- `DATABASE_URL is not set`
- `could not connect to server`
- `Traceback (most recent call last):`

---

## 🔍 **What to Do Based on What You See**

### **If You See: "DATABASE_URL is not set"**

**Fix:**
1. Railway → Backend Service → **Variables** tab
2. Click **+ New Variable**
3. Name: `DATABASE_URL`
4. Value: Copy from PostgreSQL service → Variables → `DATABASE_URL`
5. Save and redeploy

### **If You See: "ModuleNotFoundError"**

**Fix:**
1. Check which module is missing (e.g., `No module named 'fastapi'`)
2. Add it to `backend/requirements.txt`
3. Commit and push (Railway auto-redeploys)

### **If You See: "could not connect to server"**

**Fix:**
1. Verify PostgreSQL service is **running** (green status)
2. Check `DATABASE_URL` is correct
3. Ensure both services are in same Railway project

### **If You See: "Application startup complete"**

**✅ Your app is running!** But if you still get "Application failed to respond":
- Check if port is correct
- Verify Railway is routing traffic correctly
- Test health endpoint: `https://nupeer-production.up.railway.app/health`

---

## 🚨 **If Logs Show Markdown Text**

If Railway logs literally show markdown text (like `# Railway "Application Failed to Respond"`), this means:

1. **Wrong file is being executed** - Check Railway Root Directory setting
2. **Start command is wrong** - Should be `python start_server.py`
3. **File structure issue** - Railway might be in wrong directory

**Fix:**
1. Railway → Backend Service → **Settings**
2. Check **Root Directory** = `backend` (or empty if backend is root)
3. Check **Start Command** = `python start_server.py`
4. Redeploy

---

## 📸 **What to Share for Help**

If you need help, share:

1. **Last 20-30 lines of Railway Deploy Logs**
   - Copy from Railway dashboard
   - Include any error messages

2. **Environment Variables (hide sensitive values)**
   - List which ones are set
   - Don't share actual values (especially SECRET_KEY, DATABASE_URL password)

3. **Deployment Status**
   - Active / Failed / Stopped?

4. **What you've tried**
   - What fixes have you attempted?

---

## ✅ **Quick Verification**

After checking logs, verify:

1. **Logs show:** `Application startup complete` ✅
2. **Health endpoint works:** 
   - Visit: `https://nupeer-production.up.railway.app/health`
   - Should return: `{"status":"healthy","database":"connected"}`

3. **API endpoint works:**
   - Visit: `https://nupeer-production.up.railway.app/api/v1/auth/login`
   - Should return JSON (even if error, it's responding)

---

## 🎯 **Most Common Issues**

1. **Missing DATABASE_URL** (80% of cases)
   - Fix: Add DATABASE_URL from PostgreSQL service

2. **Database not running** (10% of cases)
   - Fix: Start PostgreSQL service in Railway

3. **Import errors** (5% of cases)
   - Fix: Check requirements.txt, add missing packages

4. **Port binding** (5% of cases)
   - Fix: Verify start command uses PORT env variable

---

**Next Step:** Go check your Railway logs now and share what you see!

