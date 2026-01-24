# Quick Start Guide - Backend

## ✅ All Dependencies Installed!

Your virtual environment has all required packages including FastAPI.

## 🚀 To Run the Backend:

### Option 1: Use the Startup Script (Recommended)
```powershell
cd backend
.\start_backend.ps1
```

### Option 2: Manual Start
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python start_server.py
```

### Option 3: Direct Uvicorn
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ⚠️ Important:

**Always activate the virtual environment first!**

If you see `ModuleNotFoundError: No module named 'fastapi'`, it means:
- You're not in the virtual environment
- Solution: Run `.\venv\Scripts\Activate.ps1` first

## 🔍 Verify Environment:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from fastapi import FastAPI; print('✅ All good!')"
```

## 📍 Server URLs:

Once running:
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Health:** http://localhost:8000/health

---

**The virtual environment is at:** `backend\venv\`
**Activate it with:** `.\venv\Scripts\Activate.ps1`

