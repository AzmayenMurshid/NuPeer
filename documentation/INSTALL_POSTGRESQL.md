# How to Download and Install PostgreSQL on Windows

## Quick Download & Install Guide

### Step 1: Download PostgreSQL

1. **Go to the official PostgreSQL download page:**
   - **Direct link**: https://www.postgresql.org/download/windows/
   - Or visit: https://www.postgresql.org/download/ and select "Windows"

2. **Click "Download the installer"**
   - This will take you to EnterpriseDB's installer page
   - Or use direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

3. **Select your version:**
   - Choose **PostgreSQL 15** (or latest version)
   - Select **Windows x86-64** (for 64-bit Windows)
   - Click **Download**

4. **The installer file will be named:**
   - `postgresql-15.x-windows-x64.exe` (or similar)

### Step 2: Install PostgreSQL

1. **Run the installer** (you may need administrator privileges)

2. **Follow the installation wizard:**

   **Installation Directory:**
   - Default: `C:\Program Files\PostgreSQL\15`
   - Click **Next**

   **Select Components:**
   - ✅ PostgreSQL Server (required)
   - ✅ pgAdmin 4 (GUI tool - recommended)
   - ✅ Stack Builder (optional)
   - ✅ Command Line Tools (recommended)
   - Click **Next**

   **Data Directory:**
   - Default: `C:\Program Files\PostgreSQL\15\data`
   - Click **Next**

   **Password:**
   - **IMPORTANT**: Set password to `nupeer` (or remember what you set)
   - This is the password for the `postgres` superuser
   - Click **Next**

   **Port:**
   - Keep default: `5432`
   - Click **Next**

   **Advanced Options:**
   - Locale: Default (usually `[Default locale]`)
   - Click **Next**

   **Pre Installation Summary:**
   - Review settings
   - Click **Next**

   **Ready to Install:**
   - Click **Next** to begin installation
   - Wait for installation to complete

   **Completing the Setup Wizard:**
   - ✅ Uncheck "Launch Stack Builder" (optional)
   - Click **Finish**

### Step 3: Verify Installation

1. **Open Command Prompt or PowerShell**

2. **Test PostgreSQL:**
   ```powershell
   psql --version
   ```

   You should see something like:
   ```
   psql (PostgreSQL) 15.x
   ```

3. **Or check if service is running:**
   ```powershell
   Get-Service -Name postgresql*
   ```

### Step 4: Create Database for NuPeer

**Option A: Using pgAdmin (GUI - Easier)**

1. **Open pgAdmin 4** (from Start menu)

2. **Connect to server:**
   - When pgAdmin opens, it will ask for the master password
   - Enter the password you set during installation (`nupeer`)

3. **Expand "Servers" → "PostgreSQL 15"**

4. **Right-click "Databases" → "Create" → "Database"**

5. **Enter database details:**
   - **Database name**: `nupeer`
   - Click **Save**

**Option B: Using Command Line**

1. **Open Command Prompt or PowerShell**

2. **Connect to PostgreSQL:**
   ```powershell
   psql -U postgres
   ```
   (Enter password: `nupeer`)

3. **Create database:**
   ```sql
   CREATE DATABASE nupeer;
   ```

4. **Create user (optional, but recommended):**
   ```sql
   CREATE USER nupeer WITH PASSWORD 'nupeer';
   GRANT ALL PRIVILEGES ON DATABASE nupeer TO nupeer;
   ```

5. **Exit:**
   ```sql
   \q
   ```

### Step 5: Update Backend Configuration

If you used a different password than `nupeer`, update the backend configuration:

1. **Create/Edit `backend/.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nupeer
   ```

   Or if you created a separate user:
   ```env
   DATABASE_URL=postgresql://nupeer:nupeer@localhost:5432/nupeer
   ```

### Step 6: Test Database Connection

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.core.database import engine; engine.connect(); print('Database connection OK!')"
```

## Troubleshooting

### "psql: command not found"
- PostgreSQL bin directory not in PATH
- Add to PATH: `C:\Program Files\PostgreSQL\15\bin`
- Or use full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres`

### "Connection refused" or "Server not running"
- Start PostgreSQL service:
  ```powershell
  Start-Service postgresql-x64-15
  ```
  (Service name may vary - check with `Get-Service -Name postgresql*`)

### "Password authentication failed"
- Make sure you're using the correct password
- Default user is `postgres`
- Password is what you set during installation

### "Database does not exist"
- Create the database (see Step 4)

### Port 5432 already in use
- Another PostgreSQL instance is running
- Stop it or use a different port

## Quick Start After Installation

Once PostgreSQL is installed and database is created:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Useful PostgreSQL Commands

**Connect to database:**
```powershell
psql -U postgres -d nupeer
```

**List all databases:**
```sql
\l
```

**List all tables:**
```sql
\dt
```

**Exit psql:**
```sql
\q
```

## Need Help?

- **PostgreSQL Windows Installer**: https://www.postgresql.org/download/windows/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **pgAdmin Documentation**: https://www.pgadmin.org/docs/

