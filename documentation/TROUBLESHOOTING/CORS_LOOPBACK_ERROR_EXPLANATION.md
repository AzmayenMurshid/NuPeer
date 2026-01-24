# CORS Loopback Address Space Error - Complete Explanation

## 🔴 **THE ERROR**

```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/auth/me' from origin 
'https://nu-peer.vercel.app' has been blocked by CORS policy: Permission was 
denied for this request to access the `loopback` address space.
```

---

## 📖 **WHAT IS THIS ERROR?**

This is a **browser security feature** that prevents websites from making HTTP requests to localhost/127.0.0.1 addresses. This is called the **"Private Network Access"** or **"Loopback Address Space"** restriction.

### **Why Does This Exist?**

Browsers block requests to localhost from production websites to prevent:
1. **SSRF Attacks** (Server-Side Request Forgery) - malicious sites trying to access your local services
2. **Local Network Scanning** - websites probing your local network
3. **Privacy Protection** - preventing external sites from accessing your local development servers

---

## 🎯 **WHEN DOES THIS ERROR OCCUR?**

This error occurs when:

1. **Frontend is deployed** (e.g., on Vercel: `https://nu-peer.vercel.app`)
2. **Backend URL is set to localhost** (e.g., `http://localhost:8000`)
3. **Browser blocks the request** because:
   - Production HTTPS site (`https://nu-peer.vercel.app`)
   - Trying to access HTTP localhost (`http://localhost:8000`)
   - Different protocols (HTTPS → HTTP) + localhost = **BLOCKED**

### **The Request Flow:**
```
User's Browser (visiting https://nu-peer.vercel.app)
    ↓
Frontend JavaScript tries to call: http://localhost:8000/api/v1/auth/login
    ↓
Browser Security Check: "Is this a loopback address?" → YES
    ↓
Browser Security Check: "Is the origin a production site?" → YES
    ↓
Browser: "BLOCKED! Security violation!"
    ↓
Error: "Permission denied for loopback address space"
```

---

## 🔍 **WHERE IS THE PROBLEM?**

### **Location 1: Frontend API Configuration**
**File:** `frontend/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

**Problem:** When `NEXT_PUBLIC_API_URL` is not set in Vercel, it defaults to `http://localhost:8000`

### **Location 2: Vercel Environment Variables**
**Missing:** `NEXT_PUBLIC_API_URL` environment variable in Vercel project settings

---

## ⚠️ **WHY IS THIS HAPPENING?**

1. **Environment Variable Not Set**: `NEXT_PUBLIC_API_URL` is not configured in Vercel
2. **Default Fallback**: Code falls back to `http://localhost:8000`
3. **Browser Security**: Modern browsers (Chrome, Firefox, Safari) block localhost requests from production sites
4. **Protocol Mismatch**: HTTPS site trying to access HTTP localhost

---

## ✅ **SOLUTION**

### **Step 1: Get Your Production Backend URL**

Your production backend is deployed on Railway:
- **Production Backend URL:** `https://nupeer-production.up.railway.app`

### **Step 2: Set Environment Variable in Vercel**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://nupeer-production.up.railway.app`
   - **Environment:** Select all (Production, Preview, Development)
4. **Save** the environment variable
5. **Redeploy** your frontend (Vercel will automatically redeploy, or trigger manually)

### **Step 3: Verify the Fix**

After redeployment, check:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Check the request URL - it should be:
   - ✅ `https://nupeer-production.up.railway.app/api/v1/auth/login`
   - ❌ NOT `http://localhost:8000/api/v1/auth/login`

---

## 🔧 **ALTERNATIVE: Update Code to Handle Missing Env Var**

You can also update `frontend/lib/api.ts` to provide a better error message:

```typescript
// Get API URL from environment
const getApiUrl = () => {
  // In production (Vercel), NEXT_PUBLIC_API_URL must be set
  if (typeof window !== 'undefined') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl || apiUrl.includes('localhost')) {
      console.error(
        'NEXT_PUBLIC_API_URL is not set or points to localhost. ' +
        'Please set it in Vercel environment variables to your production backend URL.'
      )
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

const API_URL = getApiUrl()
```

---

## 📋 **QUICK FIX CHECKLIST**

- [ ] 1. Get production backend URL: `https://nupeer-production.up.railway.app`
- [ ] 2. Go to Vercel project → Settings → Environment Variables
- [ ] 3. Add `NEXT_PUBLIC_API_URL` = `https://nupeer-production.up.railway.app`
- [ ] 4. Select all environments (Production, Preview, Development)
- [ ] 5. Save and redeploy
- [ ] 6. Test login/register functionality
- [ ] 7. Verify requests go to production backend (not localhost)

---

## 🧪 **TESTING LOCALLY**

For **local development**, you can still use localhost:

1. Create `frontend/.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. This will override the Vercel environment variable when running locally
3. The browser will allow localhost requests when the frontend is also on localhost

---

## 📚 **TECHNICAL DETAILS**

### **What is "Loopback Address Space"?**

Loopback addresses are:
- `127.0.0.1` (IPv4)
- `::1` (IPv6)
- `localhost` (hostname that resolves to 127.0.0.1)

These addresses refer to the **local machine** itself.

### **Browser Security Policy**

Modern browsers implement the **Private Network Access** specification:
- **Blocked:** HTTPS site → HTTP localhost
- **Blocked:** HTTPS site → HTTP 127.0.0.1
- **Allowed:** HTTP localhost → HTTP localhost (same origin)
- **Allowed:** HTTPS production → HTTPS production

### **Why Not Just Allow It?**

If browsers allowed this, malicious websites could:
1. Scan your local network
2. Access your local development servers
3. Attack services running on your machine
4. Steal data from local applications

---

## 🎓 **SUMMARY**

| Aspect | Details |
|--------|---------|
| **What** | Browser blocking localhost requests from production sites |
| **Why** | Security feature to prevent SSRF and network scanning |
| **When** | Production frontend trying to access localhost backend |
| **Where** | `frontend/lib/api.ts` - API_URL defaults to localhost |
| **How to Fix** | Set `NEXT_PUBLIC_API_URL` in Vercel to production backend URL |
| **Solution** | `NEXT_PUBLIC_API_URL=https://nupeer-production.up.railway.app` |

---

## 🚀 **IMMEDIATE ACTION REQUIRED**

**Set this environment variable in Vercel NOW:**

```
NEXT_PUBLIC_API_URL=https://nupeer-production.up.railway.app
```

Then redeploy your frontend. The error will be resolved immediately.

---

## 📞 **TROUBLESHOOTING**

### **Still seeing localhost in requests?**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel deployment logs to verify env var is set
- Verify the environment variable is set for the correct environment

### **Getting CORS errors after fix?**
- Ensure backend CORS_ORIGINS includes `https://nu-peer.vercel.app`
- Check backend is running and accessible
- Verify backend URL is correct

### **Local development broken?**
- Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Restart Next.js dev server after adding env var

---

**Last Updated:** 2024
**Related Files:**
- `frontend/lib/api.ts` - API configuration
- `backend/app/main.py` - CORS configuration
- Vercel Environment Variables - Production configuration

