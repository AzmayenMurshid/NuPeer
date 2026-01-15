# Deploy Backend to Railway (Step-by-Step Guide)

This guide will help you deploy your NuPeer backend to Railway so it's accessible from your Vercel frontend.

## Prerequisites

- Your NuPeer repository on GitHub (or GitLab/Bitbucket)
- A Railway account (free tier available)
- All your backend environment variables ready (see `ENVIRONMENT_VARIABLES.md`)

---

## Step 1: Sign Up for Railway

1. **Go to Railway**
   - Visit [https://railway.app/](https://railway.app/)
   - Click **Start a New Project** or **Login**

2. **Sign In with GitHub**
   - Click **Login with GitHub**
   - Authorize Railway to access your repositories

---

## Step 2: Create New Project

1. **Create Project**
   - In Railway dashboard, click **New Project**
   - Select **Deploy from GitHub repo**
   - If prompted, authorize Railway to access your repositories

2. **Select Repository**
   - Find and select your **NuPeer** repository
   - Click **Deploy Now**

---

## Step 3: Configure Service

1. **Set Root Directory**
   - Railway will detect your repository
   - Click on the service that was created
   - Go to **Settings** tab
   - Find **Root Directory**
   - Set it to: `backend`
   - Click **Save**

2. **Configure Build Settings** (if needed)
   - Railway should auto-detect Python
   - If not, go to **Settings** → **Build**
   - **Build Command:** Leave default or set to: `pip install -r requirements.txt`
   - **Start Command:** Railway should auto-detect, but verify it's: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Step 4: Set Environment Variables

**This is critical!** Your backend needs all these environment variables to work.

1. **Go to Variables Tab**
   - In your Railway service, click **Variables** tab
   - Click **+ New Variable** for each one

2. **Add Required Variables:**

   ```bash
   # Application
   APP_NAME=NuPeer
   DEBUG=False
   
   # Database (REQUIRED - Get from Vercel Postgres, Supabase, etc.)
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   
   # JWT (REQUIRED - Generate a secure key)
   SECRET_KEY=your-secure-random-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # CORS (REQUIRED - Your Vercel frontend domain)
   CORS_ORIGINS=["https://your-project.vercel.app"]
   
   # AWS S3 (REQUIRED - Get from AWS IAM)
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY=your-aws-access-key
   S3_SECRET_KEY=your-aws-secret-key
   S3_BUCKET_NAME=nupeer-transcripts
   S3_USE_SSL=True
   
   # Redis (REQUIRED - Get from Upstash, Vercel KV, etc.)
   REDIS_URL=redis://default:password@host:6379/0
   
   # Optional
   MAX_UPLOAD_SIZE=10485760
   TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES=30
   TRANSCRIPT_PENDING_TIMEOUT_MINUTES=60
   ```

3. **Important Notes:**
   - For `CORS_ORIGINS`, use JSON array format: `["https://your-project.vercel.app"]`
   - Generate `SECRET_KEY` using: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Get `DATABASE_URL` from your database provider (see below)
   - Get `REDIS_URL` from your Redis provider (see below)

---

## Step 5: Set Up Database

### Option A: Railway Postgres (Easiest)

1. **Add Postgres to Project**
   - In Railway project, click **+ New**
   - Select **Database** → **Add PostgreSQL**
   - Railway will create a Postgres database

2. **Get Connection String**
   - Click on the Postgres service
   - Go to **Variables** tab
   - Find `DATABASE_URL` or `POSTGRES_URL`
   - Copy the connection string

3. **Add to Backend Service**
   - Go back to your backend service
   - **Variables** tab → **+ New Variable**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the connection string from Postgres
   - Click **Add**

### Option B: Vercel Postgres

1. **Create in Vercel**
   - Go to your Vercel project
   - **Storage** tab → **Create Database** → **Postgres**
   - Copy the connection string

2. **Add to Railway**
   - In Railway backend service → **Variables**
   - Add `DATABASE_URL` with the Vercel Postgres connection string

### Option C: Supabase

1. **Get from Supabase**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project → **Settings** → **Database**
   - Copy the connection string (URI format)

2. **Add to Railway**
   - Add `DATABASE_URL` with Supabase connection string

---

## Step 6: Set Up Redis

### Option A: Railway Redis

1. **Add Redis to Project**
   - In Railway project, click **+ New**
   - Select **Database** → **Add Redis**
   - Railway will create a Redis instance

2. **Get Connection String**
   - Click on Redis service
   - Go to **Variables** tab
   - Find `REDIS_URL`
   - Copy it

3. **Add to Backend Service**
   - Go to backend service → **Variables**
   - Add `REDIS_URL` with the Redis connection string

### Option B: Upstash Redis (Recommended)

1. **Sign Up**
   - Visit [https://upstash.com/](https://upstash.com/)
   - Create free account

2. **Create Database**
   - Click **Create Database**
   - Choose region
   - Click **Create**

3. **Get Connection String**
   - Go to **Details** tab
   - Copy the **Redis URL**

4. **Add to Railway**
   - In Railway backend service → **Variables**
   - Add `REDIS_URL` with Upstash Redis URL

---

## Step 7: Set Up AWS S3

1. **Create IAM User** (if not done)
   - Go to [AWS Console](https://console.aws.amazon.com/) → **IAM**
   - **Users** → **Create user**
   - Name: `nupeer-s3-user`
   - Attach policy: `AmazonS3FullAccess`
   - Create user

2. **Create Access Key**
   - Click on the user → **Security credentials**
   - **Create access key**
   - Copy **Access Key ID** and **Secret Access Key**

3. **Create S3 Bucket**
   - Go to **S3** → **Create bucket**
   - Name: `nupeer-transcripts` (must be globally unique)
   - Region: Choose closest to you
   - Click **Create**

4. **Add to Railway**
   - In Railway backend service → **Variables**
   - Add:
     - `S3_ENDPOINT=https://s3.amazonaws.com`
     - `S3_ACCESS_KEY=your-access-key-id`
     - `S3_SECRET_KEY=your-secret-access-key`
     - `S3_BUCKET_NAME=nupeer-transcripts`
     - `S3_USE_SSL=True`

---

## Step 8: Deploy and Get URL

1. **Deploy**
   - Railway will automatically deploy when you:
     - Connect the repository
     - Set environment variables
   - Watch the **Deployments** tab for progress

2. **Get Your Backend URL**
   - Once deployed, go to **Settings** → **Networking**
   - Find **Public Domain** or **Custom Domain**
   - Copy the URL (e.g., `https://nupeer-api-production.up.railway.app`)

3. **Test Your Backend**
   - Visit: `https://your-backend-url.up.railway.app/health`
   - Should return: `{"status":"healthy"}`
   - Visit: `https://your-backend-url.up.railway.app/api/docs`
   - Should show Swagger API documentation

---

## Step 9: Update CORS in Backend

1. **Get Your Vercel Domain**
   - Go to Vercel → Your Project → **Settings** → **Domains**
   - Copy your Vercel domain (e.g., `https://nupeer-xxxxx.vercel.app`)

2. **Update CORS_ORIGINS in Railway**
   - Go to Railway → Backend Service → **Variables**
   - Find `CORS_ORIGINS`
   - Update to include your Vercel domain:
     ```bash
     CORS_ORIGINS=["https://nupeer-xxxxx.vercel.app"]
     ```
   - Railway will auto-redeploy

---

## Step 10: Set NEXT_PUBLIC_API_URL in Vercel

1. **Go to Vercel**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

2. **Add Variable**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Railway backend URL (e.g., `https://nupeer-api-production.up.railway.app`)
   - **Environments:** Production, Preview, Development
   - Click **Save**

3. **Redeploy Frontend**
   - Vercel will auto-redeploy
   - Or manually: **Deployments** → **Redeploy**

---

## Troubleshooting

### Backend Not Starting?

1. **Check Logs**
   - Railway → Your Service → **Deployments** → Click on deployment
   - Check **Logs** tab for errors

2. **Common Issues:**
   - **Missing environment variables:** Check all required vars are set
   - **Database connection error:** Verify `DATABASE_URL` is correct
   - **Port error:** Make sure start command uses `$PORT` variable
   - **Import errors:** Check `requirements.txt` has all dependencies

### Backend URL Not Working?

1. **Check Deployment Status**
   - Railway → Service → Should show "Active"

2. **Test Health Endpoint**
   - Visit: `https://your-backend-url/health`
   - Should return JSON response

3. **Check Networking**
   - Railway → Settings → Networking
   - Make sure public domain is enabled

### Database Connection Issues?

1. **Verify DATABASE_URL Format**
   ```bash
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. **Test Connection**
   - Check Railway logs for database connection errors
   - Verify database is running and accessible

---

## Quick Checklist

- [ ] Railway account created and logged in
- [ ] Project created from GitHub repository
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Database set up and `DATABASE_URL` added
- [ ] Redis set up and `REDIS_URL` added
- [ ] AWS S3 credentials added
- [ ] Backend deployed successfully
- [ ] Backend URL obtained and tested
- [ ] `CORS_ORIGINS` includes Vercel domain
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend redeployed

---

## Need Help?

- **Railway Docs:** [https://docs.railway.app/](https://docs.railway.app/)
- **Railway Discord:** [https://discord.gg/railway](https://discord.gg/railway)
- **Environment Variables:** See `ENVIRONMENT_VARIABLES.md`

