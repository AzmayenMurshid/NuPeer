# Environment Variables Needed for Deployment

## Backend (FastAPI) - Railway

The following variables are typically set in the Railway dashboard under your backend service environment:

| Variable            | Example Value                                      | Description                                       |
|---------------------|---------------------------------------------------|---------------------------------------------------|
| `DATABASE_URL`      | `postgresql://nupeer:nupeer@postgres:5432/nupeer` | PostgreSQL database URL (set by Railway if using Railway Postgres) |
| `REDIS_URL`         | `redis://redis:6379/0`                            | Redis connection URL (if you use Redis)           |
| `S3_ENDPOINT`       | *(see below)*                                     | S3/MinIO endpoint for file storage. <br>**How to get for Railway MinIO:** In your Railway project, open the MinIO plugin or service, then check the "Endpoint" URL (often shown as `http://minio:9000` for internal services or `https://<your-minio-service>.up.railway.app` for public access). Use this exact URL as the value for `S3_ENDPOINT`.                |
| `S3_ACCESS_KEY`     | *(your access key)*                               | S3/MinIO access key. <br>**How to get for Railway:** In your Railway project, open the MinIO plugin or service, then check the "Access Key" or "ROOT_USER" value provided by Railway. Use that value here.
| `S3_SECRET_KEY`     | *(your secret key)*                               | S3/MinIO secret key. <br>**How to get for Railway:** In your Railway project, open the MinIO plugin or service, then check the "Secret Key" or "ROOT_PASSWORD" (sometimes "MINIO_ROOT_PASSWORD") value shown in your environment variables. Use that exact value here.
| `S3_BUCKET_NAME`    | `nupeer-transcripts`                              | Your S3/MinIO bucket name. <br>**How to get:** You can set this value yourself when you create a new bucket in the MinIO or S3 console (e.g., create a bucket called `nupeer-transcripts`). If using Railway MinIO, open the MinIO dashboard (`https://<your-minio-service>.up.railway.app` or via the "Open Console" button in Railway), log in with your access credentials, and create or copy your desired bucket name. Use exactly the name shown in your MinIO/S3 bucket list.

**Note:** Railway provides a `RAILWAY_STATIC_URL` or you can use your deployed backend URL for `NEXT_PUBLIC_API_URL` (see frontend below).

---

## Frontend (Next.js / React) - Vercel

Set these environment variables via the Vercel project dashboard (Settings → Environment Variables):

| Variable                   | Example Value                                | Description                                           |
|----------------------------|----------------------------------------------|-------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`      | `https://nupeer-api.up.railway.app`          | URL of deployed FastAPI backend (see backend deployment or Railway dashboard) |

---

## How to Find These Values

- For `NEXT_PUBLIC_API_URL`, use the public URL given by Railway after successful deployment (usually looks like `https://your-backend-name.up.railway.app`).
- For database, Redis, and S3 credentials, use Railway-provided service variables or your respective credential values.

---

## Example: `.env` for Backend (Railway)

```
DATABASE_URL=postgresql://nupeer:nupeer@postgres.internal:5432/nupeer
REDIS_URL=redis://redis.internal:6379/0
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=nupeer-transcripts
```

## Example: `.env` for Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://nupeer-api.up.railway.app
```

For more detailed instructions, see `HOW_TO_GET_NEXT_PUBLIC_API_URL.md` or your deployment provider's documentation.
