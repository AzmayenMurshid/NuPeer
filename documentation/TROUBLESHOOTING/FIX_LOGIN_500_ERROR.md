# Fix Login 500 Internal Server Error

## 🔴 **THE ERROR**

```
POST https://nupeerzx-production.up.railway.app/api/v1/auth/login 500 (Internal Server Error)
```

**Common Error:**
```
relation "users" does not exist
```

## 📖 **WHAT THIS MEANS**

The backend is receiving the login request but encountering an internal server error. This is typically caused by:

1. **Database tables don't exist** (most common - migrations not run)
2. **Database connection issues**
3. **Missing SECRET_KEY** environment variable
4. **Database query errors**
5. **JWT token generation errors**

## ✅ **THE FIX**

### **Step 1: Check Railway Logs**

The login endpoint logs detailed error information. Check Railway logs to see the actual error:

1. Go to **Railway Dashboard** → Your Backend Service
2. Click **Deployments** tab
3. Click the **latest deployment**
4. Scroll to **Deploy Logs** (not Build Logs)
5. Look for error messages that start with:
   - `ERROR: Login error:`
   - `relation "users" does not exist` ← **This means migrations haven't run**
   - `Traceback (most recent call last):`
   - `OperationalError`
   - `Database connection`

### **Step 1.5: If You See "relation 'users' does not exist"**

**This means database tables haven't been created!**

**Solution:** The app now automatically runs migrations on startup. Simply:
1. **Redeploy your backend** on Railway
2. Check logs for: `✓ Database migrations: Applied`
3. Tables will be created automatically

**Manual Fix (if auto-migration fails):**
1. Railway → Backend Service → **Deployments**
2. Click **latest deployment** → **View Logs**
3. Or use Railway's **Shell** to run:
   ```bash
   alembic upgrade head
   ```

### **Step 2: Check Environment Variables**

Verify these are set in Railway:

#### **Required Variables:**

1. **`SECRET_KEY`** - Must be set for JWT tokens
   - Railway → Backend Service → Variables
   - Should be a long random string (not the default `"your-secret-key-change-in-production"`)
   - Generate one: `openssl rand -hex 32` or use an online generator

2. **`DATABASE_URL`** - PostgreSQL connection string
   - Railway → PostgreSQL Service → Variables
   - Copy the `DATABASE_URL` value
   - Add to Backend Service → Variables
   - Format: `postgresql://user:password@host:port/database?sslmode=require`

3. **`CORS_ORIGINS`** - Your frontend URL
   - Format: `["https://nu-peer.vercel.app"]` (JSON array)
   - Or: `https://nu-peer.vercel.app` (single value)

### **Step 3: Verify Database Connection**

Test if the database is accessible:

1. **Check Health Endpoint:**
   ```
   https://nupeerzx-production.up.railway.app/health
   ```
   - Should return: `{"status": "healthy", "database": "connected"}`
   - If it shows `"database": "disconnected"`, the database connection is the issue

2. **Check Railway PostgreSQL Service:**
   - Railway → PostgreSQL Service
   - Make sure it's **Running** (not stopped)
   - Check the service status

### **Step 4: Common Issues & Solutions**

#### **Issue 1: Database Connection Failed**

**Error in logs:**
```
OperationalError: connection to server at ... failed
```

**Solution:**
1. Verify `DATABASE_URL` is correct in Railway
2. Make sure PostgreSQL service is running
3. Check that `DATABASE_URL` includes `?sslmode=require` for Railway
4. Restart the backend service

#### **Issue 2: Missing SECRET_KEY**

**Error in logs:**
```
AttributeError: 'Settings' object has no attribute 'SECRET_KEY'
```

**Solution:**
1. Railway → Backend Service → Variables
2. Add `SECRET_KEY` with a secure random value
3. Generate: `openssl rand -hex 32`
4. Redeploy backend

#### **Issue 3: JWT Token Generation Error**

**Error in logs:**
```
JWTError: ...
```

**Solution:**
1. Verify `SECRET_KEY` is set and not empty
2. Check `ALGORITHM` is `HS256` (default)
3. Verify `ACCESS_TOKEN_EXPIRE_MINUTES` is a valid integer

### **Step 5: Test After Fix**

1. **Test Health Endpoint:**
   ```
   GET https://nupeerzx-production.up.railway.app/health
   ```
   Should return: `{"status": "healthy", "database": "connected"}`

2. **Test Login:**
   - Go to your Vercel frontend
   - Try to login
   - Check browser console for errors
   - Check Railway logs for any new errors

## 🔍 **Debugging Steps**

### **Check Railway Logs in Real-Time:**

1. Railway → Backend Service → **Deployments**
2. Click **latest deployment**
3. Click **View Logs** or scroll to **Deploy Logs**
4. Try logging in from frontend
5. Watch logs for error messages

### **Test API Directly:**

Use curl or Postman to test the login endpoint:

```bash
curl -X POST "https://nupeerzx-production.up.railway.app/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpassword"
```

This will show you the exact error response.

## 📋 **Checklist**

- [ ] Checked Railway logs for error details
- [ ] Verified `SECRET_KEY` is set in Railway
- [ ] Verified `DATABASE_URL` is set and correct
- [ ] Verified PostgreSQL service is running
- [ ] Tested `/health` endpoint - shows database connected
- [ ] Redeployed backend after changing environment variables
- [ ] Tested login from frontend
- [ ] Checked browser console for errors

## 🆘 **Still Not Working?**

If the error persists:

1. **Share Railway Logs:**
   - Copy the full error traceback from Railway logs
   - Look for lines starting with `ERROR: Login error:`

2. **Check Database:**
   - Railway → PostgreSQL Service
   - Verify service is running
   - Check connection details

3. **Verify All Environment Variables:**
   - Railway → Backend Service → Variables
   - Ensure all required variables are set
   - No typos in variable names

4. **Test Database Connection:**
   - Use Railway's database connection tool
   - Or test with a simple query

---

**Note:** The 401 error on `/auth/me` is expected if you're not logged in. The main issue is the 500 error on login.

