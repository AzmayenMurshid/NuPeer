# Fix "Storage service not available" Error

## 🔴 **THE ERROR**

```
Upload failed
Storage service not available. Please ensure MinIO/S3 is running at http://localhost:9000
```

**HTTP Status:** `503 Service Unavailable`

## 📖 **WHAT THIS MEANS**

Your Railway backend is trying to connect to `http://localhost:9000`, which is the **default value** from the code. This means:

- ❌ **S3/MinIO environment variables are NOT set in Railway**
- ❌ The backend can't find your storage service
- ❌ File uploads will fail

## ✅ **THE FIX**

You need to set 5 environment variables in Railway to connect to your storage service.

---

## 🚀 **Quick Fix: Set Environment Variables in Railway**

### **Step 1: Go to Railway Variables**

1. Open [Railway Dashboard](https://railway.app)
2. Select your **project**
3. Click on your **backend service** (Python/FastAPI)
4. Click **Variables** tab (left sidebar)

### **Step 2: Add These 5 Variables**

Click **+ New Variable** for each:

#### **1. S3_ENDPOINT**

**For AWS S3:**
```
Name: S3_ENDPOINT
Value: https://s3.amazonaws.com
```
Or region-specific (recommended):
```
Value: https://s3.us-east-1.amazonaws.com
```
(Replace `us-east-1` with your bucket's region)

**For MinIO:**
```
Name: S3_ENDPOINT
Value: https://your-minio-service.up.railway.app
```
Or for local MinIO:
```
Value: http://localhost:9000
```

#### **2. S3_ACCESS_KEY**

```
Name: S3_ACCESS_KEY
Value: <Your AWS Access Key or MinIO Access Key>
```

**For AWS:** Your IAM user's Access Key ID (starts with `AKIA...`)  
**For MinIO:** Your MinIO access key (default: `minioadmin`)

#### **3. S3_SECRET_KEY**

```
Name: S3_SECRET_KEY
Value: <Your AWS Secret Key or MinIO Secret Key>
```

**For AWS:** Your IAM user's Secret Access Key  
**For MinIO:** Your MinIO secret key (default: `minioadmin`)

⚠️ **Note:** Railway will hide this value after saving (shows as `••••••••`)

#### **4. S3_BUCKET_NAME**

```
Name: S3_BUCKET_NAME
Value: nupeer-transcripts
```

**Important:** Must match your bucket name exactly (lowercase, no spaces)

#### **5. S3_USE_SSL**

**For AWS S3:**
```
Name: S3_USE_SSL
Value: true
```

**For MinIO:**
- If endpoint is `https://`: `true`
- If endpoint is `http://`: `false`

```
Name: S3_USE_SSL
Value: false
```

### **Step 3: Verify All Variables**

Your Variables tab should show all 5:

```
S3_ENDPOINT          https://s3.amazonaws.com
S3_ACCESS_KEY        AKIA... (or hidden)
S3_SECRET_KEY        •••••••• (hidden)
S3_BUCKET_NAME       nupeer-transcripts
S3_USE_SSL           true
```

### **Step 4: Wait for Redeploy**

- Railway **automatically redeploys** when you add/update variables
- Wait 1-2 minutes for deployment to complete
- Or manually trigger: **Deployments** → **Redeploy**

### **Step 5: Check Logs**

1. Go to **Deployments** → Latest deployment → **View Logs**
2. Look for:
   ```
   ✓ Storage service: Available
   ```
3. If you see this ✅, storage is connected!

---

## 🔍 **Troubleshooting**

### **Still seeing "Storage service not available"?**

1. **Verify all 5 variables exist:**
   - Railway → Backend Service → Variables
   - Count them - should be exactly 5

2. **Check variable names:**
   - Must be exact: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_USE_SSL`
   - No typos, no extra spaces

3. **Check variable values:**
   - `S3_ENDPOINT`: Should be a valid URL (starts with `http://` or `https://`)
   - `S3_ACCESS_KEY`: Should not be empty
   - `S3_SECRET_KEY`: Should not be empty
   - `S3_BUCKET_NAME`: Should match your bucket name exactly
   - `S3_USE_SSL`: Should be `true` or `false` (lowercase)

4. **Verify credentials:**
   - **For AWS:** Test your Access Key and Secret Key in AWS Console
   - **For MinIO:** Verify MinIO is running and credentials are correct

5. **Check endpoint URL:**
   - **For AWS:** Use `https://s3.amazonaws.com` or region-specific endpoint
   - **For MinIO:** Use the actual MinIO service URL from Railway

6. **Redeploy manually:**
   - **Deployments** → **Redeploy**
   - Wait for completion
   - Check logs again

---

## 📋 **Quick Checklist**

- [ ] All 5 environment variables added in Railway
- [ ] Variable names are correct (no typos)
- [ ] `S3_ENDPOINT` is a valid URL
- [ ] `S3_ACCESS_KEY` is set (not empty)
- [ ] `S3_SECRET_KEY` is set (not empty)
- [ ] `S3_BUCKET_NAME` matches your bucket name
- [ ] `S3_USE_SSL` is `true` for HTTPS, `false` for HTTP
- [ ] Backend redeployed (automatic or manual)
- [ ] Logs show "✓ Storage service: Available"
- [ ] Tested upload - works! ✅

---

## 💡 **Common Mistakes**

1. **Using default values:**
   - ❌ Don't leave variables unset (uses `http://localhost:9000`)
   - ✅ Always set all 5 variables

2. **Wrong endpoint:**
   - ❌ `http://localhost:9000` (won't work on Railway)
   - ✅ Use your actual S3/MinIO endpoint URL

3. **SSL mismatch:**
   - ❌ `S3_USE_SSL=false` with `https://` endpoint
   - ✅ Match SSL setting to endpoint protocol

4. **Bucket name mismatch:**
   - ❌ `S3_BUCKET_NAME=NuPeer-Transcripts` (uppercase)
   - ✅ `S3_BUCKET_NAME=nupeer-transcripts` (lowercase, exact match)

---

## 🎯 **Next Steps**

After setting variables and redeploying:

1. **Check logs** for "✓ Storage service: Available"
2. **Test upload** from your frontend
3. **Verify file** appears in your S3/MinIO bucket

**If it still doesn't work, check the logs for specific error messages and share them for further troubleshooting.**

