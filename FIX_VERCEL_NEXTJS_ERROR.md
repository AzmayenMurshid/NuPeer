# Fix: Next.js Version Not Detected in Vercel

This error occurs because Vercel is looking for `package.json` in the wrong directory. Since your frontend is in the `frontend/` folder, you need to configure Vercel to use that as the Root Directory.

## Error Message
```
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.
```

## Solution: Set Root Directory in Vercel

### Step 1: Go to Vercel Project Settings

1. **Open Vercel Dashboard**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your NuPeer project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **General** in the left sidebar

### Step 2: Configure Root Directory

1. **Find Root Directory Setting**
   - Scroll down to **Root Directory** section
   - You'll see it's currently set to `/` (root of repository)

2. **Change Root Directory**
   - Click **Edit** next to Root Directory
   - Select **Other** or type: `frontend`
   - Click **Save**

   **OR**

   - Click the folder icon
   - Navigate to and select the `frontend` folder
   - Click **Save**

### Step 3: Verify Build Settings

1. **Check Build & Development Settings**
   - Still in **Settings** → **General**
   - Scroll to **Build & Development Settings**
   - Verify:
     - **Framework Preset:** Next.js (should auto-detect)
     - **Root Directory:** `frontend`
     - **Build Command:** `npm run build` (or leave default)
     - **Output Directory:** `.next` (or leave default)
     - **Install Command:** `npm install` (or leave default)

2. **Save Changes**
   - Click **Save** if you made any changes

### Step 4: Redeploy

1. **Trigger New Deployment**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

2. **Wait for Build**
   - Vercel will now look for `package.json` in the `frontend/` directory
   - The build should succeed

---

## Alternative: Create vercel.json (Optional)

If you prefer to configure this via a file, create `vercel.json` in your repository root:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "rootDirectory": "frontend"
}
```

However, **using the Vercel dashboard settings is recommended** as it's easier to manage.

---

## Verification Checklist

After making changes, verify:

- [ ] Root Directory is set to `frontend` in Vercel settings
- [ ] Framework Preset shows "Next.js"
- [ ] Build Command is correct (or default)
- [ ] New deployment triggered
- [ ] Build succeeds without the Next.js version error
- [ ] Deployment completes successfully

---

## Troubleshooting

### Still Getting the Error?

1. **Double-check Root Directory**
   - Go to Settings → General
   - Make sure Root Directory is exactly `frontend` (not `./frontend` or `/frontend`)

2. **Check package.json Location**
   - Verify `package.json` exists at: `frontend/package.json`
   - Verify it contains `"next"` in dependencies (it does: `"next": "^14.2.0"`)

3. **Clear Build Cache**
   - Go to Settings → General
   - Scroll to **Build Cache**
   - Click **Clear Build Cache**
   - Redeploy

4. **Check Repository Structure**
   - Make sure your repository structure is:
     ```
     NuPeer/
     ├── frontend/
     │   ├── package.json  ← Should be here
     │   ├── next.config.js
     │   └── ...
     ├── backend/
     └── ...
     ```

5. **Verify Git Integration**
   - Make sure Vercel is connected to the correct repository
   - Check that the `frontend` folder is committed to Git

---

## Quick Fix Summary

**The Problem:** Vercel is looking for `package.json` in the root, but it's in `frontend/`

**The Solution:** Set Root Directory to `frontend` in Vercel Settings → General

**Steps:**
1. Vercel Dashboard → Your Project → Settings → General
2. Find "Root Directory" → Click Edit
3. Set to: `frontend`
4. Save
5. Redeploy

That's it! The error should be resolved.

