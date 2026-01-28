# How to Set SECRET_KEY in Railway

## 🔴 **THE WARNING**

```
WARNING: SECRET_KEY is not set or using default value!
JWT tokens will not be secure. Set SECRET_KEY in Railway.
```

## 📖 **WHAT THIS MEANS**

Your backend is using the default `SECRET_KEY` value, which is **insecure**. This means:
- ❌ JWT tokens can be easily forged
- ❌ User authentication is not secure
- ❌ Anyone could potentially create fake tokens

## ✅ **THE FIX**

Set a secure `SECRET_KEY` in Railway environment variables.

---

## 🚀 **Quick Fix (2 Steps)**

### **Step 1: Generate a Secure Secret Key**

You need a long, random string. Here are options:

#### **Option A: Use Python (Recommended)**


Run this command locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or in PowerShell:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

This will output something like:
```
xK9mP2qR5vT8wY1zA4bC7dE0fG3hJ6kL9nO2pQ5rS8tU1vW4xY7zA0bC3dE6f
```

**Copy this value** - you'll need it in Step 2.

#### **Option B: Use OpenSSL**

```bash
openssl rand -hex 32
```

Or in PowerShell:
```powershell
openssl rand -hex 32
```

#### **Option C: Use Online Generator**

Visit: https://generate-secret.vercel.app/32 (or any secure random string generator)

**Generate a 32+ character random string.**

---

### **Step 2: Set SECRET_KEY in Railway**

1. **Go to Railway Dashboard:**
   - Visit [railway.app](https://railway.app)
   - Login and select your **project**
   - Click on your **backend service** (Python/FastAPI)

2. **Open Variables Tab:**
   - Click **Variables** tab (left sidebar)

3. **Add SECRET_KEY Variable:**
   - Click **+ New Variable**
   - **Name**: `SECRET_KEY`
   - **Value**: Paste the secret key you generated in Step 1
   - Click **Add**

4. **Verify:**
   - You should see `SECRET_KEY` in your variables list
   - Railway will hide the value (shows as `••••••••`)

5. **Redeploy:**
   - Railway will automatically redeploy
   - Or manually: **Deployments** → **Redeploy**
   - Wait for deployment to complete

6. **Check Logs:**
   - Go to **Deployments** → Latest deployment → **View Logs**
   - You should **NOT** see the warning anymore
   - Should see: `✓ SECRET_KEY: Set (hidden for security)`

---

## 🔍 **Verify It's Working**

After redeploying, check Railway logs:

**Before (Bad):**
```
⚠️  WARNING: SECRET_KEY is not set or using default value!
   JWT tokens will not be secure. Set SECRET_KEY in Railway.
```

**After (Good):**
```
✓ SECRET_KEY: Set (hidden for security)
```

---

## ⚠️ **Important Security Notes**

1. **Never commit SECRET_KEY to git:**
   - Keep it only in Railway environment variables
   - Don't put it in `.env` files that are committed
   - Don't share it publicly

2. **Use a strong random value:**
   - At least 32 characters
   - Mix of letters, numbers, and special characters
   - Don't use predictable values like "my-secret-key-123"

3. **Rotate periodically:**
   - Change SECRET_KEY every few months
   - When rotating, users will need to log in again (tokens become invalid)

4. **Different environments:**
   - Use different SECRET_KEY for development and production
   - Never use production SECRET_KEY in development

---

## 📋 **Quick Checklist**

- [ ] Generated a secure random secret key (32+ characters)
- [ ] Added `SECRET_KEY` variable in Railway
- [ ] Value is set (not empty)
- [ ] Backend redeployed
- [ ] Logs show "✓ SECRET_KEY: Set" (no warning)
- [ ] Tested login - works correctly

---

## 🆘 **Troubleshooting**

### **Still seeing the warning?**

1. **Check variable name:**
   - Must be exactly: `SECRET_KEY`
   - No typos, no spaces
   - Case-sensitive (uppercase)

2. **Check variable value:**
   - Not empty
   - At least 32 characters
   - Copied correctly (no extra spaces)

3. **Verify in Railway:**
   - Railway → Backend Service → Variables
   - Should see `SECRET_KEY` in the list
   - Value should be hidden (`••••••••`)

4. **Redeploy:**
   - Changes to environment variables require redeploy
   - **Deployments** → **Redeploy**
   - Wait for completion

5. **Check logs again:**
   - After redeploy, check logs
   - Warning should be gone

---

## 💡 **Pro Tips**

1. **Generate locally:**
   ```python
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   This is the most secure method.

2. **Save it securely:**
   - Keep a copy in a password manager
   - Don't lose it (you'll need it if you redeploy from scratch)

3. **Test after setting:**
   - Try logging in
   - Should work normally
   - Tokens will be properly signed

---

**That's it! Your SECRET_KEY is now secure.** 🔒

