# Railway Environment Variables - Quick Reference

## 🔴 **Current Error**

```
Storage service not available. Please ensure MinIO/S3 is running at http://localhost:9000
```

**This means:** S3/MinIO environment variables are NOT set in Railway.

---

## ✅ **Required Environment Variables**

You need to set **5 variables** in Railway:

| Variable | Example Value | Where to Get It |
|----------|--------------|-----------------|
| `S3_ENDPOINT` | `https://s3.amazonaws.com` | AWS S3 endpoint (or your MinIO URL) |
| `S3_ACCESS_KEY` | `AKIAIOSFODNN7EXAMPLE` | AWS IAM Access Key ID (or MinIO access key) |
| `S3_SECRET_KEY` | `wJalrXUtnFEMI/K7MDENG...` | AWS IAM Secret Key (or MinIO secret key) |
| `S3_BUCKET_NAME` | `nupeer-transcripts` | Your S3/MinIO bucket name |
| `S3_USE_SSL` | `true` | `true` for HTTPS, `false` for HTTP |

---

## 🚀 **Quick Setup: AWS S3**

### **1. Create AWS S3 Bucket**
- Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
- Create bucket → Name: `nupeer-transcripts`
- Choose region (e.g., `us-east-1`)

### **2. Create IAM User**
- Go to [IAM Console](https://console.aws.amazon.com/iam/)
- Users → Create user → `nupeer-s3-user`
- Create policy (JSON):
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::nupeer-transcripts", "arn:aws:s3:::nupeer-transcripts/*"]
    }]
  }
  ```
- Attach policy to user
- Create access key → Copy Access Key ID and Secret Access Key

### **3. Set in Railway**
Railway → Backend Service → Variables → Add:

```
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_ACCESS_KEY=<your-access-key-id>
S3_SECRET_KEY=<your-secret-access-key>
S3_BUCKET_NAME=nupeer-transcripts
S3_USE_SSL=true
```

---

## 📍 **Where to Set in Railway**

1. **Railway Dashboard** → Your Project
2. **Backend Service** (Python/FastAPI)
3. **Variables** tab (left sidebar)
4. Click **+ New Variable** for each
5. Railway auto-redeploys

---

## ✅ **Verify It's Working**

After setting variables and redeploying:

1. **Check Logs:**
   - Deployments → Latest → View Logs
   - Should see: `✓ Storage service: Available`

2. **Test Upload:**
   - Try uploading a transcript
   - Should work without errors

---

## 🔍 **Troubleshooting**

### **Still seeing error?**

1. ✅ All 5 variables set? (Count them)
2. ✅ Variable names correct? (Exact spelling, no typos)
3. ✅ Values not empty?
4. ✅ `S3_ENDPOINT` starts with `http://` or `https://`?
5. ✅ Backend redeployed? (Check Deployments tab)

### **Common Mistakes**

- ❌ Using `http://localhost:9000` (won't work on Railway)
- ❌ Variable name typos (`S3_ENDPOINT` not `S3_ENDPOINT_URL`)
- ❌ Missing `S3_USE_SSL` variable
- ❌ Bucket name doesn't match (case-sensitive)

---

## 📚 **Detailed Guides**

- **Set up AWS S3:** `documentation/HOW TO/CONNECT_S3_TO_RAILWAY.md`
- **Set up MinIO:** `documentation/HOW TO/CONNECT_S3_TO_RAILWAY.md`
- **Troubleshooting:** `documentation/TROUBLESHOOTING/FIX_STORAGE_NOT_AVAILABLE.md`

---

**Set all 5 variables → Redeploy → Check logs → Done!** ✅

