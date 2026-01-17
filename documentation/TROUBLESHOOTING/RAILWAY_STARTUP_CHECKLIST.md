# Railway Backend Startup Checklist

## ✅ Configuration Files Verified

I've verified and optimized your Railway configuration:

1. **`backend/railway.json`** ✅
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
   - Uses `$PORT` variable (Railway provides this)
   - Build command: `pip install -r requirements.txt`

2. **`backend/Procfile`** ✅
   - Correct start command with `$PORT`

3. **`backend/requirements.txt`** ✅
   - All dependencies listed
   - uvicorn included

4. **`backend/start.sh`** ✅
   - Created startup script for Railway

---

## 🔧 What You Need to Do in Railway Dashboard

### Step 1: Verify Root Directory
1. Railway → Your Project → Backend Service
2. **Settings** → **Root Directory**
3. Should be: `backend`
4. If not, set it and save

### Step 2: Verify Start Command
1. Railway → Backend Service → **Settings** → **Deploy**
2. **Start Command** should be:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
   ```
3. Or leave it empty (Railway will use `railway.json` or `Procfile`)

### Step 3: Add All Environment Variables
Go to **Variables** tab and add:

**Required:**
- `DATABASE_URL` - From PostgreSQL service
- `SECRET_KEY` - Generate secure key
- `CORS_ORIGINS` - Your Vercel domain(s)
- `S3_ENDPOINT` - `https://s3.amazonaws.com`
- `S3_ACCESS_KEY` - Your AWS access key
- `S3_SECRET_KEY` - Your AWS secret key
- `S3_BUCKET_NAME` - `nupeer-transcripts`
- `S3_USE_SSL` - `True`
- `REDIS_URL` - From Redis service

**Optional (have defaults):**
- `APP_NAME` - `NuPeer`
- `DEBUG` - `False`
- `ALGORITHM` - `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` - `30`

### Step 4: Check Deployment
1. Go to **Deployments** tab
2. Watch the latest deployment
3. Check **Logs** for:
   - ✅ "Application startup complete" = Success!
   - ❌ Any errors = Check below

---

## 🐛 Common Startup Issues & Fixes

### Issue: "ModuleNotFoundError"
**Fix:** Missing dependency in `requirements.txt`
- Check logs for which module
- Add to `requirements.txt`
- Commit and push (Railway auto-redeploys)

### Issue: "Database connection failed"
**Fix:** Missing or wrong `DATABASE_URL`
- Railway → PostgreSQL Service → Variables
- Copy `DATABASE_URL`
- Add to Backend Service → Variables

### Issue: "Port already in use"
**Fix:** Start command not using `$PORT`
- Settings → Deploy → Start Command
- Must include `--port $PORT`

### Issue: "No module named 'app'"
**Fix:** Root Directory not set
- Settings → Root Directory → Set to `backend`

### Issue: Service keeps restarting
**Fix:** Check logs for crash reason
- Usually missing env variable or import error
- Fix the error shown in logs

---

## ✅ Verification Steps

After deployment, verify:

1. **Deployment Status = "Active"**
   - Railway → Deployments → Latest shows "Active"

2. **Logs Show Success**
   - Logs show: "Application startup complete"
   - No error messages

3. **Health Endpoint Works**
   - Visit: `https://your-backend-url/health`
   - Returns: `{"status":"healthy"}`

4. **API Docs Accessible**
   - Visit: `https://your-backend-url/api/docs`
   - Shows Swagger UI

---

## 🚀 Quick Start Commands

If you need to manually verify in Railway CLI:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Check service status
railway status

# View logs
railway logs

# Run migrations (if needed)
railway run python -m alembic upgrade head
```

---

## 📋 Final Checklist

Before considering it "done", verify:

- [ ] Root Directory set to `backend` in Railway
- [ ] Start Command uses `$PORT` variable
- [ ] All required environment variables added
- [ ] `DATABASE_URL` from PostgreSQL service added
- [ ] Deployment shows "Active" status
- [ ] Logs show "Application startup complete"
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] API docs accessible at `/api/docs`
- [ ] No errors in deployment logs

---

## 🆘 Still Not Starting?

1. **Check the Logs Tab** - This shows the exact error
2. **Verify Environment Variables** - All required vars must be set
3. **Check Database is Running** - PostgreSQL service must be active
4. **Verify Root Directory** - Must be `backend`

The logs will tell you exactly what's wrong!

