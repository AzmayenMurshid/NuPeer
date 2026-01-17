# Quick Deploy Checklist: Railway Backend

This is all you need to get your backend running on Railway (short, step-by-step):

## 1. Prerequisites
- Backend code is on GitHub.
- You have a Railway account: [railway.app](https://railway.app/).

## 2. Push Latest Code
```bash
git add backend/
git commit -m "deploy configs"
git push
```

## 3. Create Railway Project
- Log in at [railway.app](https://railway.app/).
- Click **+ New Project** → **Deploy from GitHub Repo**.
- Select your repo.

## 4. Set Root Directory
- In your new Railway project, open your backend service.
- Go to **Settings** → **Root Directory** → set to `backend`.
- Save.

## 5. Add Environment Variables
Go to **Variables** tab and add these (and any your code needs):

- `APP_NAME` = NuPeer
- `DEBUG` = False
- `SECRET_KEY` = a4e69fc170c771d8ecd3ea2bc3736a50aafd324f561ccb5f5fbfeb4aad2e623b
- `ALGORITHM` = HS256
- `ACCESS_TOKEN_EXPIRE_MINUTES` = 30
- `CORS_ORIGINS` = Enter your frontend/production domain(s) here in JSON format.  
  **How to get this?**  
  Use your deployed frontend domain(s). For example:  
  `["https://your-frontend.vercel.app"]`  
  If you have multiple domains, list them all inside the array.
  Make sure you use **square brackets** and double quotes for valid JSON.
- (add AWS S3 keys if needed, e.g., `S3_ENDPOINT`, `S3_ACCESS_KEY`, etc.)
- `MAX_UPLOAD_SIZE`, etc (optional)
- Add others from your local `.env`

---

### What .env variables do I need for my backend in Railway?

**Backend (Railway) — Common .env Vars:**

- `APP_NAME` — Name of your app/service
- `DEBUG` — Should be `False` in production
- `SECRET_KEY` — A long, random key for cryptographic signing (never share)
- `ALGORITHM` — Token/signing algorithm (e.g. `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — JWT expiration window (e.g. `30`)
- `CORS_ORIGINS` — JSON list of allowed origins (e.g. `["https://myfrontend.com"]`)
- `DATABASE_URL` — Railway attaches this automatically if you add a Railway PostgreSQL database
- `REDIS_URL` — If using Redis (optional)
- S3-related variables, **if you use object storage**:
  - `S3_ENDPOINT` — You must add this manually in your Railway **Variables** tab (get this value from your S3 provider, not from Railway).  
    **Is this required?** Only if your backend uses S3 or object storage.
  - `S3_ACCESS_KEY` — Add manually in Railway from your S3 provider.  
    **Is this required?** Only if you use S3/object storage.
  - `S3_SECRET_KEY` — Add manually from your S3 provider.  
    **Is this required?** Only if you use S3/object storage.
  - `S3_BUCKET_NAME` — Add manually; this is your storage bucket name.  
    **Is this required?** Only if your backend uploads/reads files from S3.
- `MAX_UPLOAD_SIZE`, or any other size/config limits you use
- (Copy any other necessary keys from your local `.env`)

https://nupeer-production.up.railway.app

**Does this app require object storage (e.g., S3)?**

No, this app does **not** require object storage or S3. You can ignore and do not need to set any S3/object storage related environment variables unless you add such features in the future.


**Tip:** After changing variables, you must trigger a redeploy.

---

### What env variables do I need for my frontend in Vercel?

**Frontend (Vercel) — Common .env Vars:**

- `NEXT_PUBLIC_API_URL` — Set this to the public URL of your deployed backend.  
  To find this, in Railway: go to your backend service, open the **Settings** tab, scroll to **Networking**, and look for **Public Domain** (this is where the public URL is shown, starting with `https://`). Copy that URL here.
- Any other `NEXT_PUBLIC_...` variables your frontend needs to interact with backend or for third-party services

> **Prefix with `NEXT_PUBLIC_`** — Only variables with this prefix are exposed to the frontend at build/runtime in Next.js/Vercel.

**Example:**
```
NEXT_PUBLIC_API_URL=https://your-backend-production.railway.app
NEXT_PUBLIC_STRIPE_PK=pk_live_xxx   # if you use Stripe
```

Check your frontend `.env.local` or README for any other required keys. Always update Vercel env vars if backend URLs or sensitive config changes!

---

## 6. Add PostgreSQL
- Click **+ New** → **Database** → **PostgreSQL**, Railway creates it.
- Copy `DATABASE_URL` from database service's **Variables** tab.
- Add it to your backend service as `DATABASE_URL`.

## 7. Add Redis (optional)
- **+ New** → **Database** → Redis.
- Copy `REDIS_URL` from its service and add to backend service vars if used.

## 8. Get Public Backend URL
- Go to backend service → **Settings** → **Networking**.
- Copy the **Public Domain** (starts with `https://`).
- Use this for `NEXT_PUBLIC_API_URL` in your frontend.

## 9. Test Your Deployed Backend
- Hit: `https://your-backend-url/health`
- Hit: `https://your-backend-url/api/docs`
- Update CORS if you get CORS errors.

## 10. Set Frontend Env Var
- In Vercel: add or update `NEXT_PUBLIC_API_URL` to the Railway backend URL.
- Redeploy frontend if needed.

---

## Troubleshooting (Fast!)

- If deploy fails: Check Railway **Deployments → Logs**.
- "Cannot connect"? Double check:
  - Correct `NEXT_PUBLIC_API_URL` in Vercel (copy/paste no typos, uses `https://`)
  - CORS setup: `CORS_ORIGINS` in Railway backend envs must match frontend domain.
- Changing env vars? Redeploy on Railway after changes.
- Backend not running? Check that start command is:
  ```
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- Need help? [Railway Docs](https://docs.railway.app/) | [Discord](https://discord.gg/railway)

---

**Done! Backend is now live on Railway.**
