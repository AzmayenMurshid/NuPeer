# How to Get NEXT_PUBLIC_API_URL Value

The `NEXT_PUBLIC_API_URL` is the **public URL where your backend API is deployed**. You need to deploy your backend first, then use that URL.

## Quick Answer

**`NEXT_PUBLIC_API_URL` = The URL where your backend is deployed**

Examples:
- `https://nupeer-api.up.railway.app` (if deployed on Railway)
- `https://nupeer-api.onrender.com` (if deployed on Render)
- `https://nupeer-api.herokuapp.com` (if deployed on Heroku)
- `https://api.yourdomain.com` (if using a custom domain)

---

## Step-by-Step Process

### Step 1: Deploy Your Backend

You need to deploy your FastAPI backend to a hosting platform. Choose one:

#### Option A: Railway (Recommended - Easiest)

1. **Go to Railway**
   - Visit [https://railway.app/](https://railway.app/)
   - Sign in with GitHub

2. **Create New Project**
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Choose your NuPeer repository
   - Select the `backend` folder as the root

3. **Configure Build**
   - Railway auto-detects Python
   - It will automatically install dependencies from `requirements.txt`
   - It will run your FastAPI app

4. **Get Your Backend URL**
   - After deployment, Railway provides a URL like: `https://nupeer-api-production.up.railway.app`
   - You can find it in your service dashboard
   - Or go to **Settings** → **Networking** to see the domain

5. **Test Your Backend**
   - Visit: `https://your-backend-url.up.railway.app/health`
   - Should return: `{"status":"healthy"}`
   - Visit: `https://your-backend-url.up.railway.app/api/docs`
   - Should show Swagger API documentation

6. **Use This URL:**
   ```bash
   NEXT_PUBLIC_API_URL=https://nupeer-api-production.up.railway.app
   ```

#### Option B: Render

1. **Go to Render**
   - Visit [https://render.com/](https://render.com/)
   - Sign in with GitHub

2. **Create Web Service**
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Select the `backend` folder

3. **Configure Settings**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3

4. **Get Your Backend URL**
   - After deployment, Render provides: `https://nupeer-api.onrender.com`
   - Find it in your service dashboard

5. **Use This URL:**
   ```bash
   NEXT_PUBLIC_API_URL=https://nupeer-api.onrender.com
   ```

#### Option C: Heroku

1. **Install Heroku CLI**
   ```bash
   # Windows (using installer)
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy**
   ```bash
   cd backend
   heroku create nupeer-api
   git push heroku main
   ```

3. **Get Your Backend URL**
   - Heroku provides: `https://nupeer-api.herokuapp.com`
   - Or check with: `heroku info`

4. **Use This URL:**
   ```bash
   NEXT_PUBLIC_API_URL=https://nupeer-api.herokuapp.com
   ```

#### Option D: Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Deploy**
   ```bash
   cd backend
   fly launch
   ```

3. **Get Your Backend URL**
   - Fly provides: `https://nupeer-api.fly.dev`
   - Check with: `fly status`

4. **Use This URL:**
   ```bash
   NEXT_PUBLIC_API_URL=https://nupeer-api.fly.dev
   ```

#### Option E: AWS (EC2, ECS, Lambda)

1. **Deploy to AWS**
   - Follow AWS deployment guides for your chosen service
   - Your API will be accessible at a URL like:
     - `https://api.yourdomain.com` (if using Route 53)
     - `https://xxxxx.execute-api.us-east-1.amazonaws.com` (if using API Gateway)

2. **Use This URL:**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   # or
   NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
   ```

---

### Step 2: Verify Your Backend URL Works

Before using the URL, test it:

1. **Test Health Endpoint:**
   ```bash
   curl https://your-backend-url.com/health
   # Should return: {"status":"healthy"}
   ```

2. **Test API Docs:**
   - Visit: `https://your-backend-url.com/api/docs`
   - Should show Swagger UI with your API endpoints

3. **Test Root Endpoint:**
   ```bash
   curl https://your-backend-url.com/
   # Should return: {"message":"NuPeer API","version":"1.0.0"}
   ```

---

### Step 3: Set NEXT_PUBLIC_API_URL

Once you have your backend URL, set it in your frontend:

#### For Local Development (`.env.local` file):

Create or update `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Example:**
```bash
NEXT_PUBLIC_API_URL=https://nupeer-api-production.up.railway.app
```

#### For Vercel Deployment:

1. **Go to Vercel Dashboard**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your NuPeer frontend project

2. **Add Environment Variable**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.com` (your actual backend URL)
   - **Environments:** Select **Production**, **Preview**, **Development**
   - Click **Save**

3. **Redeploy**
   - Vercel will automatically trigger a new deployment
   - Or manually: **Deployments** → Click **⋯** → **Redeploy**

---

## Important Notes

### 1. No Trailing Slash
✅ **Correct:**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

❌ **Wrong:**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com/
```

### 2. Use HTTPS in Production
✅ **Correct:**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

❌ **Wrong (for production):**
```bash
NEXT_PUBLIC_API_URL=http://api.example.com
```

### 3. Don't Include `/api/v1`
The frontend code automatically appends `/api/v1` to the base URL.

✅ **Correct:**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
# Frontend will use: https://api.example.com/api/v1
```

❌ **Wrong:**
```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
# This would result in: https://api.example.com/api/v1/api/v1 (wrong!)
```

### 4. Local Development vs Production

**Local Development:**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production:**
```bash
# Vercel Environment Variables or frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Complete Example

### Scenario: Backend deployed on Railway

1. **Backend URL from Railway:**
   ```
   https://nupeer-api-production.up.railway.app
   ```

2. **Set in `frontend/.env.local` (for local dev):**
   ```bash
   NEXT_PUBLIC_API_URL=https://nupeer-api-production.up.railway.app
   ```

3. **Set in Vercel Dashboard (for production):**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://nupeer-api-production.up.railway.app`
   - Select: Production, Preview, Development
   - Save

4. **Verify it works:**
   - Your frontend will now make API calls to: `https://nupeer-api-production.up.railway.app/api/v1/...`

---

## Troubleshooting

### Backend URL not working?

1. **Check if backend is deployed:**
   - Visit your backend URL in browser
   - Should see API response or Swagger docs

2. **Check CORS settings:**
   - Make sure your backend `CORS_ORIGINS` includes your frontend domain
   - For Vercel: Add your Vercel domain to backend CORS_ORIGINS

3. **Check network requests:**
   - Open browser DevTools → Network tab
   - Look for failed API requests
   - Check error messages

4. **Verify environment variable:**
   - In Vercel, check that `NEXT_PUBLIC_API_URL` is set correctly
   - Remember: Changes require a new deployment

---

## Quick Checklist

- [ ] Backend deployed to hosting platform (Railway, Render, etc.)
- [ ] Backend URL obtained and tested
- [ ] Backend health endpoint works (`/health`)
- [ ] Backend API docs accessible (`/api/docs`)
- [ ] `NEXT_PUBLIC_API_URL` set in `frontend/.env.local` (for local)
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel dashboard (for production)
- [ ] Frontend redeployed after setting variable
- [ ] Tested API calls from frontend work correctly

---

## Summary

**To get `NEXT_PUBLIC_API_URL`:**

1. **Deploy your backend** to Railway, Render, Heroku, etc.
2. **Get the URL** from your hosting platform (e.g., `https://nupeer-api.up.railway.app`)
3. **Set it** in `frontend/.env.local` for local development
4. **Set it** in Vercel dashboard for production deployment
5. **Test** that your frontend can connect to the backend

That's it! The `NEXT_PUBLIC_API_URL` is simply the URL where your backend API is running.

