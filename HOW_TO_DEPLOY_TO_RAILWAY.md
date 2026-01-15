# How to Deploy Backend to Railway - Step by Step

This guide will walk you through deploying your NuPeer backend to Railway.

## Prerequisites

- Your code is on GitHub (or GitLab/Bitbucket)
- A Railway account (free tier available)
- All environment variables ready

---

## Step 1: Push Your Code to GitHub

First, make sure your latest code (including the deployment files I created) is on GitHub:

```bash
# If you haven't committed the new files yet:
git add backend/Procfile backend/runtime.txt backend/railway.json
git commit -m "Add Railway deployment configuration"
git push
```

---

## Step 2: Sign Up / Log In to Railway

1. **Go to Railway**
   - Visit [https://railway.app/](https://railway.app/)
   - Click **Start a New Project** or **Login**

2. **Sign In with GitHub**
   - Click **Login with GitHub**
   - Authorize Railway to access your repositories
   - You may need to grant permissions

---

## Step 3: Create New Project

1. **Start New Project**
   - In Railway dashboard, click **+ New Project**
   - Select **Deploy from GitHub repo**
   - If this is your first time, you may need to install the Railway GitHub app

2. **Select Repository**
   - You'll see a list of your GitHub repositories
   - Find and click on your **NuPeer** repository
   - Railway will start deploying automatically

---

## Step 4: Configure Root Directory

**Important:** Railway needs to know your backend is in the `backend/` folder.

1. **Click on the Service**
   - Railway creates a service automatically
   - Click on it to open settings

2. **Set Root Directory**
   - Go to **Settings** tab
   - Scroll to **Root Directory**
   - Click **Edit** or the folder icon
   - Type: `backend`
   - Or click the folder icon and navigate to `backend`
   - Click **Save**

3. **Verify**
   - Railway will automatically redeploy
   - Check that it's looking in the `backend` folder

---

## Step 5: Add Environment Variables

Your backend needs environment variables to work. Add them one by one:

1. **Go to Variables Tab**
   - In your Railway service, click **Variables** tab
   - Click **+ New Variable** for each variable

2. **Add Each Variable:**

   **Application Settings:**
   ```
   APP_NAME = NuPeer
   DEBUG = False
   ```

   **JWT Authentication:**
   ```
   SECRET_KEY = KcEg2JVKOQ2WjmfRPpt4maJe5qCiL6KN2YB_Z-CYi9Q
   ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   ```

   **CORS (Update with your Vercel domain):**
   ```
   CORS_ORIGINS = ["https://your-project.vercel.app"]
   ```
   *Replace `your-project.vercel.app` with your actual Vercel domain*

   **AWS S3:**
   ```
   S3_ENDPOINT = https://s3.amazonaws.com
   S3_ACCESS_KEY = your-aws-access-key-id
   S3_SECRET_KEY = your-aws-secret-access-key
   S3_BUCKET_NAME = nupeer-transcripts
   S3_USE_SSL = True
   ```

   **Optional Settings:**
   ```
   MAX_UPLOAD_SIZE = 10485760
   TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES = 30
   TRANSCRIPT_PENDING_TIMEOUT_MINUTES = 60
   ```

3. **Important Notes:**
   - For `CORS_ORIGINS`, use JSON array format: `["https://domain.com"]`
   - Don't use quotes around the value except for JSON arrays
   - Railway will auto-redeploy when you add variables

---

## Step 6: Add PostgreSQL Database

Your backend needs a database. Railway makes this easy:

1. **Add Database to Project**
   - In your Railway project (not the service), click **+ New**
   - Select **Database**
   - Click **Add PostgreSQL**
   - Railway will create a Postgres database

2. **Get Connection String**
   - Click on the PostgreSQL service
   - Go to **Variables** tab
   - Find `DATABASE_URL` or `POSTGRES_URL`
   - Click the copy icon to copy it

3. **Add to Backend Service**
   - Go back to your backend service
   - **Variables** tab → **+ New Variable**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the connection string you copied
   - Click **Add**
   - Railway will automatically redeploy

---

## Step 7: Add Redis (Optional but Recommended)

1. **Add Redis to Project**
   - In Railway project, click **+ New**
   - Select **Database** → **Add Redis**
   - Railway creates a Redis instance

2. **Get Connection String**
   - Click on Redis service
   - **Variables** tab
   - Find `REDIS_URL`
   - Copy it

3. **Add to Backend Service**
   - Backend service → **Variables**
   - Add `REDIS_URL` with the copied value

---

## Step 8: Wait for Deployment

1. **Check Deployment Status**
   - Go to **Deployments** tab
   - Watch the build logs
   - Wait for "Deploy Succeeded" message

2. **Check Logs if Issues**
   - Click on the deployment
   - Check **Logs** tab for any errors
   - Common issues:
     - Missing environment variables
     - Database connection errors
     - Import errors

---

## Step 9: Get Your Backend URL

**This is the URL you'll use for `NEXT_PUBLIC_API_URL` in Vercel!**

1. **Go to Your Backend Service in Railway**
   - In Railway, a **project** is like a folder that can contain one or more **services** (such as your backend, database, etc.).
   - The **backend service** is the part of your project that actually runs your NuPeer backend code.
   - In the Railway dashboard, first click on your **project** (it will be named something like "nupeer" or whatever you chose).
   - Inside the project, you will see a list of **services** (tiles/cards) such as "backend," "postgresql," or "redis."
   - Click on the **backend service** (it may be named "backend" or similar) – that's where you configure env variables, get the backend URL, and view deployments.

2. **Find Public Domain**
   - Click on **Settings** tab (at the top)
   - Scroll down to **Networking** section
   - Look for **Public Domain** or **Domains**
   - If you don’t see any URL or domain listed here yet, look for a button that says **"Generate Domain"** and click it — Railway may need to create a public URL for your backend the first time.
   - Click the **copy icon** (📋) next to it to copy the URL.
   - **Important:** Make sure the copied URL starts with `https://` (not `http://`). Always use the `https` version for security and compatibility with Vercel and browsers.

3. **If No Domain is Shown:**
   - Click **Generate Domain** button
   - Railway will create a public domain for you
   - Wait a few seconds, then copy the generated URL

4. **Alternative: Check Service Overview**
   - Sometimes the domain is also shown on the main service page
   - Look at the top of the service page for a URL or "Open" button
   - Click it to see your backend URL

**Visual Guide:**
```
Railway Dashboard
  └── Your Project
      └── Backend Service (click on it)
          └── Settings Tab (click)
              └── Scroll to "Networking"
                  └── Public Domain: https://your-service.up.railway.app
                      └── [Copy icon] ← Click to copy
```

**Important:** This URL is what you'll paste into Vercel as `NEXT_PUBLIC_API_URL`!

---

## Step 10: Test Your Backend

1. **Test Health Endpoint**
   - Visit: `https://your-backend-url/health`
   - Should return: `{"status":"healthy"}`

2. **Test API Docs**
   - Visit: `https://your-backend-url/api/docs`
   - Should show Swagger UI with all your API endpoints

3. **Test Root Endpoint**
   - Visit: `https://your-backend-url/`
   - Should return: `{"message":"NuPeer API","version":"1.0.0"}`

---

## Step 11: Update CORS with Vercel Domain

1. **Get Your Vercel Domain**
   - Go to Vercel → Your Project → **Settings** → **Domains**
   - Copy your Vercel domain (e.g., `https://nupeer-xxxxx.vercel.app`)

2. **Update CORS_ORIGINS**
   - Railway → Backend Service → **Variables**
   - Find `CORS_ORIGINS`
   - Click **Edit**
   - Update to: `["https://your-vercel-domain.vercel.app"]`
   - Click **Save**
   - Railway will auto-redeploy

---

## Step 12: Update Vercel Frontend

1. **Go to Vercel**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

2. **Add NEXT_PUBLIC_API_URL**
   - Click **Add New**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Railway backend URL (e.g., `https://nupeer-api-production.up.railway.app`)
   - **Environments:** Select all (Production, Preview, Development)
   - Click **Save**

3. **Redeploy Frontend**
   - Vercel will auto-redeploy
   - Or manually: **Deployments** → **Redeploy**

---

## Troubleshooting

### Deployment Fails?

1. **Check Logs**
   - Railway → Service → **Deployments** → Click on failed deployment
   - Check **Logs** tab for errors

2. **Common Issues:**
   - **"Module not found"**: Check `requirements.txt` has all dependencies
   - **"Port already in use"**: Make sure start command uses `$PORT`
   - **"Database connection failed"**: Verify `DATABASE_URL` is correct
   - **"Missing environment variable"**: Check all required vars are set

### Backend Not Starting?

1. **Check Start Command**
   - Settings → **Deploy** → Verify start command is:
     ```
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

2. **Check Logs**
   - Deployments → Latest → **Logs**
   - Look for Python errors or import errors

### Can't Access Backend URL?

1. **Check Networking**
   - Settings → **Networking**
   - Make sure public domain is enabled
   - Check if custom domain is configured correctly

2. **Test Health Endpoint**
   - Try: `https://your-url/health`
   - Should return JSON, not an error page

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] PostgreSQL database added
- [ ] `DATABASE_URL` added to backend service
- [ ] Redis added (optional)
- [ ] `REDIS_URL` added (if using Redis)
- [ ] Backend deployed successfully
- [ ] Backend URL obtained
- [ ] Health endpoint tested
- [ ] `CORS_ORIGINS` updated with Vercel domain
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend redeployed

---

## Visual Guide

```
Railway Dashboard
  └── + New Project
      └── Deploy from GitHub repo
          └── Select NuPeer repository
              └── Service Created
                  └── Settings
                      └── Root Directory: "backend"
                  └── Variables
                      └── Add all environment variables
                  └── Settings → Networking
                      └── Copy Public Domain URL
```
### How to Get the Other Environment Variables to Connect Your Backend on Railway

To ensure your backend on Railway has access to all the environment variables it needs (besides `DATABASE_URL`), follow these steps:

1. **Identify Required Variables**  
   Review your backend project's configuration to determine what environment variables are required.  
   - Typical variables might include:  
     - `SECRET_KEY` (for FastAPI or Django)  
     - `REDIS_URL` (if you use Redis)  
     - `EMAIL_HOST`, `EMAIL_PASSWORD`, etc. (for email sending)  
     - Any third-party API keys  
   - Check your codebase for `os.environ["..."]` or a `.env` file for a list of expected variables.

2. **Add Environment Variables in Railway**  
   - Go to your service in the [Railway Dashboard](https://railway.app/dashboard)
   - Click on your backend service.
   - Navigate to **Settings** → **Variables** (or **Environment** tab).
   - Click **New Variable** for each key-value pair you need (e.g. `SECRET_KEY`, `REDIS_URL`, etc.).
   - Copy values from your local `.env` file if you have one.

     **Example:**
     | Key            | Value (example)                        |
     |----------------|----------------------------------------|
     | SECRET_KEY     | some-very-secret-string                |
     | REDIS_URL      | redis://default:xxxxx@...railway.app:6379 |
     | EMAIL_HOST     | smtp.gmail.com                         |
     | EMAIL_USER     | myemail@gmail.com                      |
     | EMAIL_PASSWORD | strongpassword                         |

3. **Database and Redis URLs**  
   - If you have already deployed your `backend` folder on Railway and added a PostgreSQL or Redis service, Railway will usually generate `DATABASE_URL` and/or `REDIS_URL` environment variables for you automatically.
   - These variables are still needed for your backend to function properly (for example, to connect to your database or Redis), even after deployment.
   - Check the **Variables** or **Connect** tab of your service in Railway to confirm that these are set—if not, copy them from the appropriate plugin and add them manually.

4. **Updating Variables**  
   - Whenever you add or change variables, **redeploy your backend** so changes take effect.

5. **For Frontend Access**  
   - If the frontend needs to know about your backend’s public URL:  
     - Copy the deployed backend's public URL (`https://...up.railway.app`)  
     - Add it as `NEXT_PUBLIC_API_URL` in your frontend's Vercel dashboard (see further instructions above).

---

**Tip:**  
Keep your environment variables private and never commit them to source control!

---

See also:  
- [Railway Environment Variables Docs](https://docs.railway.app/development/environment-variables)
- [How to get NEXT_PUBLIC_API_URL](./HOW_TO_GET_NEXT_PUBLIC_API_URL.md)



---

## Need Help?

- **Railway Docs:** [https://docs.railway.app/](https://docs.railway.app/)
- **Railway Discord:** [https://discord.gg/railway](https://discord.gg/railway)
- **Check Logs:** Railway → Service → Deployments → Logs

---

## Summary

1. Push code to GitHub ✅
2. Sign up for Railway ✅
3. Create project from GitHub ✅
4. Set root directory to `backend` ✅
5. Add environment variables ✅
6. Add PostgreSQL database ✅
7. Get backend URL ✅
8. Test backend ✅
9. Update CORS with Vercel domain ✅
10. Update Vercel with backend URL ✅

Your backend should now be live on Railway! 🚀

### Troubleshooting: "Cannot connect to server" on Railway

If you've followed all the steps above but your backend is still not working, here are additional troubleshooting steps:

#### 1. Check Backend Deployment Status
- Go to your Railway project dashboard.
- Select your backend service.
- Check if the service status is **Running** and not **Stopped** or **Errored**.
- Visit the "Deployments" tab and review the **Logs** for errors (startup problems, missing dependencies, etc.).

#### 2. Confirm Health Endpoint Works
- Open your backend's public URL (copied from Railway's Networking/Domain section) plus `/health` in your browser:
  - Example: `https://your-backend.up.railway.app/health`
- You should see something like:
  ```
  {"status":"healthy"}
  ```
- If not, check your logs for errors.

#### 3. Verify Environment Variables
- Double check that all required environment variables are set in Railway (`Settings` → `Variables`).
- If you use a database, make sure the database URL and credentials are correctly configured.

#### 4. Double Check CORS Settings
- Make sure your backend's `CORS_ORIGINS` *includes* your deployed frontend URL (from Vercel).
  - Example: `https://your-frontend.vercel.app`
- If the value is wrong or missing, calls from your frontend may fail.

#### 5. Confirm Your API URL in Vercel
- In Vercel Dashboard → Settings → Environment Variables, verify that `NEXT_PUBLIC_API_URL` is set to your Railway backend public URL (no trailing slash, uses HTTPS).

#### 6. Test Directly from Vercel Frontend
- Go to your production frontend (on Vercel).
- Try accessing an API endpoint directly in a new browser tab:
  - Example: `https://your-backend.up.railway.app/api/docs`
- If you receive a CORS error or the page does not load, work through steps 3 and 4 above.

#### 7. Common Issues & Solutions

| Symptom                                     | Likely Cause                         | Solution                                                      |
|---------------------------------------------|--------------------------------------|---------------------------------------------------------------|
| "Cannot connect" or "Network Error"         | Wrong `NEXT_PUBLIC_API_URL`          | Set correct Railway URL in Vercel                             |
| 5XX error on `/health` or `/api/docs`       | Backend crash or misconfig           | Check Railway logs, fix errors, redeploy                      |
| CORS error in browser console               | Wrong or missing CORS settings       | Update `CORS_ORIGINS` in backend env variables                |
| API works in browser but not from frontend  | CORS, HTTP/HTTPS mismatch, or typo   | Double check all URLs and CORS config                         |
| `.env` changes not reflected                | Environment not redeployed           | Redeploy on Railway and Vercel after making changes           |

#### 8. Still Stuck?
- **Check the Railway logs** carefully (Dashboard → Service → Deployments → Logs).
- **Check Vercel build and runtime logs** for configuration errors.
- Try searching or asking in the [Railway Discord](https://discord.gg/railway) or [GitHub Discussions](https://github.com/railwayapp/railway/discussions).
- See also: [`FIX_VERCEL_BACKEND_CONNECTION.md`](FIX_VERCEL_BACKEND_CONNECTION.md) for more debugging steps.

---

If your backend `/health` and `/api/docs` endpoints are accessible from the public internet but your frontend still says "Cannot connect," the issue is almost always with:
- The value of `NEXT_PUBLIC_API_URL` in Vercel,
- Or CORS misconfiguration on your backend.

Correct those, then **redeploy both backend and frontend**. This usually resolves the issue!

