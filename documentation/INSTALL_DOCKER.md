# How to Install Docker on Windows

## Quick Installation Guide

### Step 1: Download Docker Desktop

1. Go to the official Docker website:
   - **Direct link**: https://www.docker.com/products/docker-desktop/
   - Or search "Docker Desktop Windows" in your browser

2. Click **"Download for Windows"**

3. The installer file will be named something like:
   - `Docker Desktop Installer.exe`

### Step 2: Install Docker Desktop

1. **Run the installer** (you may need administrator privileges)

2. **Follow the installation wizard**:
   - Accept the license agreement
   - Choose installation location (default is fine)
   - Make sure "Use WSL 2 instead of Hyper-V" is checked (recommended for Windows 10/11)
   - Click "Install"

3. **Restart your computer** when prompted (required for Docker to work)

### Step 3: Start Docker Desktop

1. After restart, find **Docker Desktop** in your Start menu
2. Launch Docker Desktop
3. Wait for Docker to start (you'll see a whale icon in your system tray)
4. Docker Desktop may ask you to accept terms of service

### Step 4: Verify Installation

Open PowerShell and run:
```powershell
docker --version
```

You should see something like:
```
Docker version 24.0.0, build ...
```

## Alternative: Install PostgreSQL Without Docker

If you prefer not to install Docker, you can install PostgreSQL directly:

### Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download **PostgreSQL 15** (or latest version)
4. Run the installer

### During Installation

- **Installation Directory**: Default is fine
- **Data Directory**: Default is fine
- **Password**: Set password to `nupeer` (or remember what you set)
- **Port**: Keep default `5432`
- **Locale**: Default is fine

### After Installation

1. Open **pgAdmin** (comes with PostgreSQL)
2. Connect to the server (use the password you set)
3. Create a new database:
   - Right-click "Databases" → "Create" → "Database"
   - Name: `nupeer`
   - Click "Save"

### Update Backend Configuration

If you used a different password, update `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nupeer
```

## Quick Start After Docker Installation

Once Docker is installed, you can start PostgreSQL with:

```powershell
# From project root (C:\NuPeer)
docker run -d --name nupeer-postgres -e POSTGRES_USER=nupeer -e POSTGRES_PASSWORD=nupeer -e POSTGRES_DB=nupeer -p 5432:5432 postgres:15
```

Then start the backend:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## System Requirements

- **Windows 10 64-bit**: Pro, Enterprise, or Education (Build 19041 or higher)
- **Windows 11 64-bit**: Home or Pro version
- **WSL 2** feature enabled (Docker will help you enable this)
- **Virtualization** enabled in BIOS

## Troubleshooting

### "WSL 2 installation is incomplete"
- Docker Desktop will provide a link to install WSL 2
- Follow the instructions to install WSL 2
- Restart your computer

### "Hardware assisted virtualization and data execution protection must be enabled"
- Enable virtualization in your BIOS/UEFI settings
- Enable Hyper-V in Windows Features (if using Hyper-V)

### Docker Desktop won't start
- Make sure virtualization is enabled in BIOS
- Check Windows Features: Enable "Virtual Machine Platform" and "Windows Subsystem for Linux"
- Restart your computer

## Need Help?

- **Docker Documentation**: https://docs.docker.com/desktop/install/windows-install/
- **PostgreSQL Windows Installer**: https://www.postgresql.org/download/windows/

