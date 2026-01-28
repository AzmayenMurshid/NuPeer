# How to Connect MinIO Bucket to Railway Backend for Transcript Uploads

> **This guide explains how to configure your Railway backend to use a MinIO (S3-compatible) object storage instance for storing and uploading transcripts.**

---

## 🚀 **Quick Overview**

To enable transcript uploads to MinIO from your Railway backend, set 5 environment variables corresponding to your MinIO instance.

---

## 🛠️ **Step-by-Step Guide**

### **Step 1: Set Up Your MinIO Instance**

You have two main options:

#### **A. Use Railway's Managed MinIO (If Available)**
- In Railway Dashboard:
  1. Click **+ New** → **Database** → **MinIO**
  2. Wait for Railway to provision MinIO and display credentials.

#### **B. Deploy MinIO Yourself (Advanced)**
- You can run MinIO locally (for testing) or as a Docker service.
- Example Docker Compose for local testing:
  ```yaml
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
  ```
- Access MinIO Console at [http://localhost:9001](http://localhost:9001)

- **Create a bucket** (e.g., `nupeer-transcripts`) in the MinIO Console.

---

### **Step 2: Get Your MinIO Credentials**

- **Access Key** and **Secret Key**:
  - For Railway-managed MinIO: Shown in Railway dashboard after creating the MinIO service.
  - For local MinIO/Docker: Defaults are `minioadmin`/`minioadmin` unless changed.

- **Endpoint**:
  - For Railway: Provided as e.g. `https://storage.up.railway.app` _(the actual value may vary; check Railway's dashboard or MinIO service info)_.
  - For local: `http://localhost:9000`

- **Bucket Name**: Use the name you created (e.g. `nupeer-transcripts`).

---

### **Step 3: Configure Backend Environment Variables in Railway**

1. **Go to Railway Project Dashboard**
   - Click your backend service (e.g., "fastapi-backend")
   - Go to the **Variables** tab

2. **Add/Update These 5 Variables:**

   | Variable         | Example Value                  | Notes |
   |------------------|-------------------------------|-------|
   | `S3_ENDPOINT`    | `http://localhost:9000` or `https://storage.up.railway.app` | Use your MinIO URL (starts with `http://` if not using SSL) |
   | `S3_ACCESS_KEY`  | `minioadmin`                  | Your MinIO access key |
   | `S3_SECRET_KEY`  | `minioadmin`                  | Your MinIO secret key |
   | `S3_BUCKET_NAME` | `nupeer-transcripts`          | Use the bucket name you created |
   | `S3_USE_SSL`     | `false` (for `http://`)<br>`true` (for `https://`) | Matches your endpoint protocol |

   - Click **+ New Variable** for each and fill in your values.

   **Example:**
   ```
   S3_ENDPOINT          http://localhost:9000
   S3_ACCESS_KEY        minioadmin
   S3_SECRET_KEY        •••••••• (hidden)
   S3_BUCKET_NAME       nupeer-transcripts
   S3_USE_SSL           false
   ```

   **For Railway-managed MinIO:**
   ```
   S3_ENDPOINT          https://storage.up.railway.app
   S3_ACCESS_KEY        RWACCESSKEY123456
   S3_SECRET_KEY        •••••••• (hidden)
   S3_BUCKET_NAME       nupeer-transcripts
   S3_USE_SSL           true
   ```

---

### **Step 4: Redeploy Backend**

- Any time you update environment variables, Railway will trigger a redeploy.
- Optionally, force redeploy in the **Deployments** tab → click **Redeploy**.

---

### **Step 5: Verify Connection**

1. **Check Railway Logs:**
   - Go to Deployments → Latest deployment → View Logs
   - Look for:  
     ```
     ✓ Storage service: Available
     ```
   - If you see this ✓, MinIO is connected!

2. **Test Upload Functionality:**
   - Open your frontend and try uploading a transcript file.
   - If set up correctly, upload should succeed and the file should appear in your MinIO bucket.

---

## 🔍 **Troubleshooting**

### **Connection or Upload Failures**

- **"Storage service: Not available" in logs:**
  - Check all 5 MinIO connection variables are present, spelled correctly, and not blank.
  - Make sure MinIO endpoint works (`curl http://YOUR-ENDPOINT` from backend or local terminal).

- **SSL Errors/Certificate Issues:**
  - If your MinIO endpoint is `http://...` (not HTTPS), set `S3_USE_SSL=false`.
  - If using self-signed cert on MinIO, you may need to allow insecure SSL or use official certificates.

- **"InvalidAccessKeyId"/Permission errors:**
  - Double-check `S3_ACCESS_KEY` and `S3_SECRET_KEY`
  - For local MinIO, defaults are usually both `minioadmin`.

- **"InvalidBucketName" error:**
  - Bucket names:
    - Must be 3–63 chars, lowercase, no spaces, no underscores or uppercase.

### **Quick Checklist**

- [ ] MinIO server is running and reachable from backend
- [ ] Bucket exists in MinIO
- [ ] All connection variables (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_USE_SSL`) are set in Railway
- [ ] Backend redeployed
- [ ] Logs show “✓ Storage service: Available”
- [ ] Test upload works (appears in MinIO UI)

---

## 📝 **Reference: Required Environment Variables for MinIO**

| Variable          | Example Value                   | Notes                    |
|-------------------|--------------------------------|--------------------------|
| `S3_ENDPOINT`     | `http://localhost:9000` or your MinIO URL | For remote MinIO, use your service endpoint |
| `S3_ACCESS_KEY`   | `minioadmin`                   | From MinIO setup         |
| `S3_SECRET_KEY`   | `minioadmin`                   | From MinIO setup         |
| `S3_BUCKET_NAME`  | `nupeer-transcripts`           | Already created in MinIO |
| `S3_USE_SSL`      | `false` or `true`              | Use `false` for `http://`, `true` for `https://` |

---

## 💡 **Tips & Notes**

- **Local Testing:**  
  Test locally with a `.env` file and MinIO running on your dev machine.
- **For production, always prefer HTTPS/SSL for MinIO (`S3_USE_SSL=true`) unless testing locally.**
- **Never share your MinIO credentials publicly.**
- If you use MinIO on Railway, rotate your access keys periodically.

---

**That’s it! You can now upload transcripts to your MinIO bucket from your Railway backend.** 🎉

