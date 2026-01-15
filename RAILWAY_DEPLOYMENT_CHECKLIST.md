# Railway Deployment Checklist - Quick Fix

## ✅ What I've Fixed For You

I've created the following files to make Railway deployment easier:

1. **`backend/Procfile`** - Tells Railway how to start your app
2. **`backend/runtime.txt`** - Specifies Python version
3. **`backend/railway.json`** - Railway configuration

## 🚀 Now Follow These Steps:

### Step 1: Push to GitHub
```bash
git add backend/Procfile backend/runtime.txt backend/railway.json
git commit -m "Add Railway deployment configuration"
git push
```

### Step 2: Deploy on Railway

1. **Go to Railway**
   - Visit [https://railway.app/](https://railway.app/)
   - Sign in with GitHub

2. **Create Project**
   - Click **New Project**
   - **Deploy from GitHub repo**
   - Select your NuPeer repository
   - Click **Deploy Now**

3. **Set Root Directory**
   - Click on the service
   - **Settings** → **Root Directory**
   - Set to: `backend`
   - Click **Save**

### Step 3: Add Environment Variables

Go to your Railway service → **Variables** tab → Add these:

#### Required Variables:

```bash
# Application
APP_NAME=NuPeer
DEBUG=False

# Database (Get from Railway Postgres or Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT (Generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=CHANGE_THIS_TO_SECURE_KEY

# CORS (Your Vercel domain)
CORS_ORIGINS=["https://your-project.vercel.app"]

# AWS S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-aws-key
S3_SECRET_KEY=your-aws-secret
S3_BUCKET_NAME=nupeer-transcripts
S3_USE_SSL=True

# Redis (Get from Railway Redis or Upstash)
REDIS_URL=redis://default:password@host:6379/0
```

### Step 4: Add Database

1. In Railway project, click **+ New**
2. **Database** → **Add PostgreSQL**
3. Copy `DATABASE_URL` from Postgres service
4. Add it to your backend service variables

### Step 5: Get Your Backend URL

1. Railway → Your Service → **Settings** → **Networking**
2. Copy the **Public Domain** URL
3. Test it: `https://your-url/health` (should return `{"status":"healthy"}`)

### Step 6: Update Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add: `NEXT_PUBLIC_API_URL` = `https://your-railway-backend-url`
3. Redeploy frontend

## 🎯 That's It!

Your backend should now be running on Railway!

