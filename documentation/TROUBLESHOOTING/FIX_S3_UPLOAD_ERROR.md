# Fix S3/MinIO Upload Error

## 🔴 **THE ERROR**

```
Failed to upload file to storage: An error occurred (InvalidBucketName) when calling the PutObject operation: 
The specified bucket is not valid.. Please ensure MinIO/S3 is running at http://bucket.railway.internal:9000
```

## 📖 **WHAT THIS MEANS**

The error indicates one of these issues:

1. **Invalid bucket name** - S3 bucket names have strict naming rules
2. **S3 service not configured** - No S3/MinIO service is set up on Railway
3. **Incorrect S3 endpoint** - The `S3_ENDPOINT` is pointing to the wrong URL
4. **Missing S3 credentials** - `S3_ACCESS_KEY` or `S3_SECRET_KEY` not set

## ✅ **THE FIX**

### **Option 1: Use AWS S3 (Recommended for Production)**

AWS S3 is the most reliable option for production deployments.

#### **Step 1: Create AWS S3 Bucket**

1. Go to [AWS Console](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**
3. **Bucket name**: `nupeer-transcripts` (or your preferred name)
   - Must be globally unique
   - Must be 3-63 characters
   - Only lowercase letters, numbers, dots, and hyphens
   - Must start and end with a letter or number
4. **Region**: Choose your preferred region (e.g., `us-east-1`)
5. **Block Public Access**: Keep enabled (we'll use presigned URLs)
6. Click **Create bucket**

#### **Step 2: Create IAM User for S3 Access**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. **User name**: `nupeer-s3-user`
4. Click **Next**
5. **Set permissions**: Attach policies directly
6. Click **Create policy**
7. Use this JSON policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::nupeer-transcripts",
           "arn:aws:s3:::nupeer-transcripts/*"
         ]
       }
     ]
   }
   ```
8. **Policy name**: `NuPeerS3Access`
9. Attach the policy to the user
10. Go to **Security credentials** tab
11. Click **Create access key**
12. **Use case**: Application running outside AWS
13. Copy the **Access key ID** and **Secret access key**

#### **Step 3: Configure Railway Environment Variables**

Railway → Backend Service → Variables:

1. **`S3_ENDPOINT`**: 
   ```
   https://s3.amazonaws.com
   ```
   Or for a specific region:
   ```
   https://s3.us-east-1.amazonaws.com
   ```

2. **`S3_ACCESS_KEY`**: Your AWS Access Key ID

3. **`S3_SECRET_KEY`**: Your AWS Secret Access Key

4. **`S3_BUCKET_NAME`**: `nupeer-transcripts` (or your bucket name)

5. **`S3_USE_SSL`**: `true`

6. **Redeploy** the backend service

---

### **Option 2: Use Railway's Object Storage (If Available)**

If Railway offers object storage:

1. Railway → **+ New** → **Database** → **Object Storage** (if available)
2. Copy the connection details
3. Set environment variables:
   - `S3_ENDPOINT`: Provided by Railway
   - `S3_ACCESS_KEY`: Provided by Railway
   - `S3_SECRET_KEY`: Provided by Railway
   - `S3_BUCKET_NAME`: Your bucket name
   - `S3_USE_SSL`: `true` or `false` (check Railway docs)

   
#### **FAQ: Is `S3_USE_SSL` required?**

- For **AWS S3**:  
  - `S3_USE_SSL=true` is **required and recommended**. It ensures all communication with AWS S3 uses HTTPS (encrypted).
- For **Railway Object Storage**:
  - Check Railway's documentation. Usually, use `true` if the endpoint is `https://`, but **some Railway endpoints may require `false`** if they only support plain HTTP.
- For **MinIO (Local/Custom Endpoint)**:
  - If your endpoint is `http://localhost:9000` or similar, set `S3_USE_SSL=false`.
  - If using MinIO with HTTPS (`https://...`), set `S3_USE_SSL=true`.

**Rule of thumb:**  
- Set to `true` for AWS S3 and any HTTPS endpoint.  
- Set to `false` for `http://` endpoints (typically local or non-TLS MinIO).

**If you set this incorrectly, you may get "SSL validation" or connection errors.**

---

### **Option 3: Use MinIO on Railway (Advanced)**

If you want to run MinIO on Railway:

1. Railway → **+ New** → **Database** → **MinIO** (if available)
2. Or deploy MinIO as a separate service
3. Set environment variables with MinIO connection details

---

## 🔍 **Verify Configuration**

### **Check Environment Variables in Railway:**

Railway → Backend Service → Variables:

- ✅ `S3_ENDPOINT` is set and correct
- ✅ `S3_ACCESS_KEY` is set (not empty)
- ✅ `S3_SECRET_KEY` is set (not empty)
- ✅ `S3_BUCKET_NAME` is set and valid
- ✅ `S3_USE_SSL` is set (`true` for AWS, `false` for local MinIO)

### **Valid Bucket Name Rules:**

- 3-63 characters long
- Only lowercase letters, numbers, dots (.), and hyphens (-)
- Must start and end with a letter or number
- Cannot contain consecutive dots (..)
- Cannot be formatted as an IP address

**Examples:**
- ✅ `nupeer-transcripts`
- ✅ `nupeer.transcripts.2024`
- ❌ `NuPeer-Transcripts` (uppercase)
- ❌ `nupeer_transcripts` (underscore not allowed)
- ❌ `nupeer..transcripts` (consecutive dots)

### **Test After Configuration:**

1. **Redeploy backend** on Railway
2. Check Railway logs for:
   ```
   ✓ Storage service: Available
   ```
3. Try uploading a transcript from the frontend
4. Should work without errors

---

## 🆘 **Common Issues**

### **Issue 1: "InvalidBucketName" Error**

**Cause:** Bucket name doesn't follow AWS naming rules

**Solution:**
1. Check `S3_BUCKET_NAME` in Railway
2. Ensure it's lowercase, 3-63 characters
3. No uppercase, underscores, or consecutive dots
4. Redeploy after fixing

### **Issue 2: "NoSuchBucket" Error**

**Cause:** Bucket doesn't exist in S3

**Solution:**
1. Create the bucket in AWS S3 Console
2. Verify bucket name matches `S3_BUCKET_NAME` exactly
3. Check region matches `S3_ENDPOINT` region

### **Issue 3: "InvalidAccessKeyId" Error**

**Cause:** S3 credentials are wrong or missing

**Solution:**
1. Verify `S3_ACCESS_KEY` and `S3_SECRET_KEY` in Railway
2. Check they match your AWS IAM user credentials
3. Ensure IAM user has S3 permissions
4. Redeploy after fixing

### **Issue 4: "Connection Refused" or Endpoint Error**

**Cause:** `S3_ENDPOINT` is incorrect

**Solution:**
- **For AWS S3**: Use `https://s3.amazonaws.com` or `https://s3.REGION.amazonaws.com`
- **For MinIO**: Use the MinIO service URL from Railway
- Ensure protocol is correct (`https://` for AWS, `http://` or `https://` for MinIO)

---

## 📋 **Quick Checklist**

- [ ] S3 bucket created in AWS (or MinIO configured)
- [ ] IAM user created with S3 permissions (for AWS)
- [ ] `S3_ENDPOINT` set in Railway
- [ ] `S3_ACCESS_KEY` set in Railway
- [ ] `S3_SECRET_KEY` set in Railway
- [ ] `S3_BUCKET_NAME` set and valid (lowercase, 3-63 chars)
- [ ] `S3_USE_SSL` set (`true` for AWS)
- [ ] Backend redeployed
- [ ] Tested transcript upload

---

## 💡 **Recommendation**

For production, **use AWS S3**. It's:
- More reliable than self-hosted MinIO
- Better performance
- Easier to scale
- Better security and compliance
- Free tier available (5GB storage, 20,000 GET requests/month)

MinIO is fine for local development, but AWS S3 is recommended for production.

