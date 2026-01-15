# Fix: "Cannot connect to server" Error in Vercel

This error occurs because your frontend is trying to connect to `http://localhost:8000` (the default) instead of your actual deployed backend URL.

## The Problem

When `NEXT_PUBLIC_API_URL` is not set in Vercel, the frontend defaults to:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

This means your production frontend is trying to connect to `localhost`, which won't work!

## Solution: Set NEXT_PUBLIC_API_URL in Vercel

### Step 1: Deploy Your Backend (If Not Already Done)

First, make sure your backend is deployed. You need a backend URL like:
- `https://nupeer-api.up.railway.app` (Railway)
- `https://nupeer-api.onrender.com` (Render)
- `https://nupeer-api.herokuapp.com` (Heroku)
- `https://api.yourdomain.com` (Custom domain)

**See:** `HOW_TO_GET_NEXT_PUBLIC_API_URL.md` for detailed instructions on deploying your backend.

### Step 2: Get Your Backend URL

1. **Go to your backend hosting platform** (Railway, Render, Heroku, etc.)
2. **Where to find this:**  
   - **Railway:** On your backend service page, look for the URL section at the top (e.g., `https://<your-project>.up.railway.app`)
   - **Render:** In the service dashboard, it's under "Service URL" (e.g., `https://nupeer-api.onrender.com`)
   - **Heroku:** On your app's dashboard, look for the "Open app" or copy the URL shown (e.g., `https://nupeer-api.herokuapp.com`)
   - **Custom Domain:** Use the custom domain you assigned to your backend (e.g., `https://api.yourdomain.com`)
3. **Test it works:**
   - Visit: `https://your-backend-url.com/health`
   - Should return: `{"status":"healthy"}`
   - Visit: `https://your-backend-url.com/api/docs`
   - Should show Swagger API documentation

### Step 3: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your NuPeer frontend project

2. **Navigate to Environment Variables**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add NEXT_PUBLIC_API_URL**
   - Click **Add New**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your backend URL (e.g., `https://nupeer-api.up.railway.app`)
   - **Important:** 
     - ✅ Use `https://` (not `http://`)
     - ✅ No trailing slash (not `https://api.com/`)
     - ✅ Don't include `/api/v1` (the frontend adds this automatically)
   - **Environments:** Select all:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **Save**

4. **Example Values:**
   ```
   ✅ Correct: https://nupeer-api.up.railway.app
   ✅ Correct: https://nupeer-api.onrender.com
   ✅ Correct: https://api.nupeer.com
   
   ❌ Wrong: http://nupeer-api.up.railway.app (use https)
   ❌ Wrong: https://nupeer-api.up.railway.app/ (no trailing slash)
   ❌ Wrong: https://nupeer-api.up.railway.app/api/v1 (don't include /api/v1)
   ```

### Step 4: Redeploy Your Frontend

After setting the environment variable:

1. **Automatic Redeploy:**
   - Vercel will automatically trigger a new deployment
   - Wait for it to complete

2. **Or Manual Redeploy:**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on the latest deployment
   - Click **Redeploy**

3. **Verify:**
   - After deployment, test your app
   - The "Cannot connect to server" error should be gone
   - API calls should work correctly

---

## Step 5: Update Backend CORS Settings

Make sure your backend allows requests from your Vercel domain:

### Update Backend CORS_ORIGINS

1. **Get Your Vercel Domain**
   - Go to Vercel → Your Project → **Settings** → **Domains**
   - Your domain will be: `https://your-project.vercel.app`
   - Or your custom domain if you added one

2. **Update Backend Environment Variable**
   - Go to your backend hosting platform (Railway, Render, etc.)
   - Find `CORS_ORIGINS` environment variable
   - Add your Vercel domain(s):

   ```bash
   CORS_ORIGINS=["https://your-project.vercel.app","https://yourdomain.com"]
   ```

   **Example:**
   ```bash
   CORS_ORIGINS=["https://nupeer-xxxxx.vercel.app","https://nupeer.com"]
   ```

3. **Redeploy Backend** (if needed)
   - Some platforms auto-redeploy when env vars change
   - Others require manual redeploy

---

## Troubleshooting

### Still Getting "Cannot connect to server"?

1. **Check Environment Variable is Set:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL` exists and has the correct value
   - Make sure it's enabled for **Production** environment

2. **Check Backend is Running:**
   - Visit your backend URL: `https://your-backend-url.com/health`
   - Should return: `{"status":"healthy"}`
   - If not, your backend might be down

3. **Check CORS Settings:**
   - Open browser DevTools → Network tab
   - Try to make an API call
   - Look for CORS errors in the console
   - If you see CORS errors, update `CORS_ORIGINS` in backend

4. **Check Browser Console:**
   - Open DevTools → Console
   - Look for network errors
   - Check what URL the frontend is trying to connect to
   - Should be your backend URL, not `localhost:8000`

5. **Verify Environment Variable Format:**
   - ✅ `https://api.example.com` (correct)
   - ❌ `http://api.example.com` (wrong - use https)
   - ❌ `https://api.example.com/` (wrong - no trailing slash)
   - ❌ `https://api.example.com/api/v1` (wrong - don't include /api/v1)

6. **Clear Browser Cache:**
   - Sometimes old builds are cached
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

7. **Check Build Logs:**
   - Vercel Dashboard → Deployments → Click on deployment
   - Check build logs for any errors
   - Verify environment variables are being used

---

## Quick Checklist

- [ ] Backend is deployed and accessible
- [ ] Backend URL tested and working (`/health` endpoint)
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables
- [ ] Environment variable value is correct (https, no trailing slash)
- [ ] Environment variable enabled for Production environment
- [ ] Frontend redeployed after setting variable
- [ ] Backend `CORS_ORIGINS` includes Vercel domain
- [ ] Tested in browser - error should be gone

---

## Example: Complete Setup

### Vercel Environment Variables:
```
NEXT_PUBLIC_API_URL=https://nupeer-api-production.up.railway.app
```

### Backend Environment Variables (Railway/Render/etc.):
```bash
CORS_ORIGINS=["https://nupeer-xxxxx.vercel.app","https://nupeer.com"]
```

### Result:
- Frontend at: `https://nupeer-xxxxx.vercel.app`
- Backend at: `https://nupeer-api-production.up.railway.app`
- Frontend can successfully connect to backend ✅

---

## Need Help?

- **Backend Deployment:** See `HOW_TO_GET_NEXT_PUBLIC_API_URL.md`
- **Vercel Docs:** [https://vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)
- **CORS Issues:** Check browser console for specific CORS error messages

