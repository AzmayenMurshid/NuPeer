# Database Access Guide - UI Tools for PostgreSQL

## Your Database Connection Details

- **Host:** localhost (or 127.0.0.1)
- **Port:** 5433
- **Database:** nupeer
- **Username:** nupeer
- **Password:** nupeer
- **Connection String:** `postgresql://nupeer:nupeer@localhost:5433/nupeer`

---

## Recommended Database Management Tools

### 1. **pgAdmin** (Most Popular - Free)
**Best for:** Full-featured PostgreSQL administration

**Download:** https://www.pgadmin.org/download/

**Installation:**
1. Download pgAdmin 4 for Windows
2. Install and launch pgAdmin
3. Right-click "Servers" → "Create" → "Server"
4. Enter connection details:
   - **Name:** NuPeer Database
   - **Host:** localhost
   - **Port:** 5433
   - **Database:** nupeer
   - **Username:** nupeer
   - **Password:** nupeer (save password)
5. Click "Save"

**Features:**
- Visual query builder
- Data editing
- Schema visualization
- Query execution
- Database backup/restore

---

### 2. **DBeaver** (Free & Open Source)
**Best for:** Multi-database support, great UI

**Download:** https://dbeaver.io/download/

**Installation:**
1. Download DBeaver Community Edition (free)
2. Install and launch
3. Click "New Database Connection" (plug icon)
4. Select "PostgreSQL"
5. Enter connection details:
   - **Host:** localhost
   - **Port:** 5433
   - **Database:** nupeer
   - **Username:** nupeer
   - **Password:** nupeer
6. Click "Test Connection" → "Finish"

**Features:**
- Cross-platform
- Supports many database types
- ER diagrams
- SQL editor with syntax highlighting
- Data export/import

---

### 3. **TablePlus** (Free & Paid)
**Best for:** Modern, clean interface

**Download:** https://tableplus.com/

**Installation:**
1. Download TablePlus for Windows
2. Install and launch
3. Click "Create a new connection"
4. Select "PostgreSQL"
5. Enter:
   - **Name:** NuPeer
   - **Host:** localhost
   - **Port:** 5433
   - **User:** nupeer
   - **Password:** nupeer
   - **Database:** nupeer
6. Click "Test" → "Connect"

**Features:**
- Beautiful, modern UI
- Fast performance
- Multiple tabs
- Query history
- Dark mode

---

### 4. **Postico** (Mac Only)
**Best for:** Mac users, simple interface

**Download:** https://eggerapps.at/postico/

---

### 5. **DataGrip** (JetBrains - Paid)
**Best for:** Developers, IDE integration

**Download:** https://www.jetbrains.com/datagrip/

**Features:**
- Advanced SQL editor
- Code completion
- Refactoring tools
- Version control integration

---

### 6. **Azure Data Studio** (Free - Microsoft)
**Best for:** Cross-platform, extensible

**Download:** https://aka.ms/azuredatastudio

**Note:** Requires PostgreSQL extension

---

## Quick Connection Test

Before connecting with a UI tool, verify your database is running:

```powershell
# Check if container is running
docker ps --filter "name=nupeer-postgres"

# Test connection from command line
docker exec -it nupeer-postgres psql -U nupeer -d nupeer
```

If the container is running, you should see:
```
CONTAINER ID   IMAGE          STATUS         PORTS                    NAMES
abc123...      postgres:15    Up X minutes   0.0.0.0:5433->5432/tcp   nupeer-postgres
```

---

## Using Command Line (psql)

If you prefer command line:

```powershell
# Connect via Docker
docker exec -it nupeer-postgres psql -U nupeer -d nupeer

# Or connect from host (if psql is installed)
psql -h localhost -p 5433 -U nupeer -d nupeer
```

**Common psql commands:**
```sql
-- List all tables
\dt

-- Describe a table
\d table_name

-- List all databases
\l

-- Exit
\q
```

---

## Web-Based Options

### 1. **Adminer** (Lightweight Web UI)
Run in Docker:

```powershell
docker run -d --name adminer -p 8080:8080 adminer
```

Then access: http://localhost:8080
- **System:** PostgreSQL
- **Server:** host.docker.internal:5433 (or use your host IP)
- **Username:** nupeer
- **Password:** nupeer
- **Database:** nupeer

### 2. **pgweb** (Web-based PostgreSQL client)
```powershell
docker run -d --name pgweb -p 8081:8081 sosedoff/pgweb --host=host.docker.internal --port=5433 --user=nupeer --db=nupeer --password=nupeer
```

Access: http://localhost:8081

---

## Troubleshooting Connection Issues

### Error: "Connection refused"
**Solution:** Make sure PostgreSQL container is running:
```powershell
docker start nupeer-postgres
```

### Error: "Password authentication failed"
**Solution:** Reset the password:
```powershell
docker exec -it nupeer-postgres psql -U postgres -c "ALTER USER nupeer WITH PASSWORD 'nupeer';"
```

### Error: "Database does not exist"
**Solution:** Create the database:
```powershell
docker exec -it nupeer-postgres psql -U nupeer -c "CREATE DATABASE nupeer;"
```

### Port 5433 not accessible
**Solution:** Check if port is in use:
```powershell
netstat -an | findstr 5433
```

---

## Recommended Setup for NuPeer

**For beginners:** Use **pgAdmin** or **DBeaver** (both free and user-friendly)

**For developers:** Use **DBeaver** or **TablePlus** (better SQL editing)

**For quick access:** Use **Adminer** in Docker (web-based, no installation)

---

## Quick Start with pgAdmin

1. **Download:** https://www.pgadmin.org/download/pgadmin-4-windows/
2. **Install** pgAdmin 4
3. **Launch** pgAdmin
4. **Set master password** (first time only)
5. **Right-click "Servers"** → **Create** → **Server**
6. **General Tab:**
   - Name: `NuPeer Database`
7. **Connection Tab:**
   - Host name/address: `localhost`
   - Port: `5433`
   - Maintenance database: `nupeer`
   - Username: `nupeer`
   - Password: `nupeer` (check "Save password")
8. **Click "Save"**

You should now see your database with all tables!

---

## Viewing Your Data

Once connected, you can:
- Browse tables: Expand `Databases` → `nupeer` → `Schemas` → `public` → `Tables`
- View data: Right-click table → "View/Edit Data" → "All Rows"
- Run queries: Tools → Query Tool (or press F5)
- Export data: Right-click table → "Backup..."

---

---

## Troubleshooting: "Failed to create the SSH tunnel" Error

If you see this error in pgAdmin, DBeaver, or another tool:

> **Unable to connect to server:**  
> *Failed to create the SSH tunnel. Possible causes:*  
> 1. Enter the correct tunnel password (Clear saved password if it has changed).  
> 2. If using an identity file that requires a password, enable “Prompt for Password?” in the server dialog.  
> 3. Verify the host address.

### What This Means

This error occurs when **SSH tunneling** is configured in your database tool, but the local database is running without SSH. NuPeer's default setup (with Docker) does **not** use SSH or require an SSH tunnel. You should connect directly to `localhost:5433`.

### How to Fix

**1. Remove SSH Tunnel Settings:**  
- In your database tool (pgAdmin, DBeaver, etc.), **edit the server/connection settings**.
- Look for an **"SSH Tunnel"** or **"SSH"** tab and **disable it** (uncheck "Use SSH tunnel" or similar).
- Make sure you are connecting to:
    - **Host:** `localhost`
    - **Port:** `5433`
    - **Username:** `nupeer`
    - **Password:** `nupeer`
    - **No SSH tunneling required!**

**2. Save and Reconnect:**  
- Save changes and try connecting again.

**3. If Connecting Remotely (Uncommon):**  
- Normally, you should **run your UI tool on the same machine** as Docker/Postgres.
- If you truly need remote access, set up secure port forwarding on your own (ask your dev lead for help).

---

If you are still having trouble, **double-check that the PostgreSQL Docker container is running** (see the [Database Connection Guide](./DATABASE_CONNECTION_GUIDE.md)) and ensure no firewalls are blocking port `5433`.

---

## Troubleshooting: "password authentication failed for user 'postgres'" Error

If you see this error message when trying to connect:

> **Unable to connect to server:**  
> *connection failed: connection to server at "127.0.0.1", port 5433 failed: FATAL: password authentication failed for user "postgres"*

Or if you see connection attempts that all fail with mentions of user `"postgres"`, this usually means:

### What This Means

- **The username is incorrect.**  
  The NuPeer database is set up to use:
  - **Username:** `nupeer`
  - **Password:** `nupeer`

By default, many database tools try to connect as `postgres` (the default superuser for PostgreSQL), but NuPeer does **not** use this user.

### How to Fix

1. **Edit your connection settings in your database tool:**  
   - Change **Username** to `nupeer`  
   - Change **Password** to `nupeer`  
   - Make sure you're connecting to:
     - **Host:** `localhost`
     - **Port:** `5433`
     - **Database:** `nupeer`

2. **Do NOT use the username `postgres`** (unless you created this user and set its password).

3. **If you're unsure or used a connection wizard:**  
   - Double-check the advanced/credential section for the username field.
   - Update it to `nupeer`.

4. **Save** and try connecting again.

---

If you still have trouble, make sure the database container is running and you have not overridden the credentials in the `docker-compose.yml` file.




---

## Accessing Transcript and Course Data

Once connected to the database, you can query and view transcript and course information that has been parsed and saved.

### Database Tables

The NuPeer database contains the following main tables for transcript data:

- **`transcripts`** - Stores uploaded transcript files and their processing status
- **`courses`** - Stores individual courses extracted from transcripts
- **`users`** - Stores user account information

### Viewing Transcript Data

#### List All Transcripts

```sql
SELECT 
    id,
    file_name,
    file_size,
    upload_date,
    processing_status,
    processed_at,
    error_message
FROM transcripts
ORDER BY upload_date DESC;
```

#### View Transcripts for a Specific User

```sql
SELECT 
    t.id,
    t.file_name,
    t.upload_date,
    t.processing_status,
    t.processed_at,
    u.email as user_email
FROM transcripts t
JOIN users u ON t.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY t.upload_date DESC;
```

#### View Transcript Processing Status

```sql
SELECT 
    processing_status,
    COUNT(*) as count,
    MAX(upload_date) as latest_upload
FROM transcripts
GROUP BY processing_status;
```

### Viewing Course Data

#### List All Courses

```sql
SELECT 
    c.course_code,
    c.course_name,
    c.grade,
    c.grade_score,
    c.credit_hours,
    c.semester,
    c.year,
    c.created_at,
    u.email as user_email
FROM courses c
JOIN users u ON c.user_id = u.id
ORDER BY c.year DESC, c.semester, c.course_code;
```

#### View Courses by Semester

```sql
SELECT 
    semester,
    year,
    COUNT(*) as course_count,
    SUM(credit_hours) as total_credits,
    ROUND(AVG(grade_score), 2) as avg_gpa
FROM courses
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
GROUP BY semester, year
ORDER BY year DESC, 
    CASE semester
        WHEN 'Fall' THEN 0
        WHEN 'Spring' THEN 1
        WHEN 'Summer' THEN 2
        WHEN 'Winter' THEN 3
        ELSE 99
    END;
```

#### View Courses for a Specific User

```sql
SELECT 
    c.course_code,
    c.course_name,
    c.grade,
    c.grade_score,
    c.credit_hours,
    c.semester,
    c.year
FROM courses c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY c.year DESC, 
    CASE c.semester
        WHEN 'Fall' THEN 0
        WHEN 'Spring' THEN 1
        WHEN 'Summer' THEN 2
        WHEN 'Winter' THEN 3
        ELSE 99
    END,
    c.course_code;
```

#### View Courses by Grade

```sql
SELECT 
    grade,
    COUNT(*) as count,
    SUM(credit_hours) as total_credits
FROM courses
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
GROUP BY grade
ORDER BY 
    CASE grade
        WHEN 'A+' THEN 0
        WHEN 'A' THEN 1
        WHEN 'A-' THEN 2
        WHEN 'B+' THEN 3
        WHEN 'B' THEN 4
        WHEN 'B-' THEN 5
        WHEN 'C+' THEN 6
        WHEN 'C' THEN 7
        WHEN 'C-' THEN 8
        WHEN 'D+' THEN 9
        WHEN 'D' THEN 10
        WHEN 'D-' THEN 11
        WHEN 'F' THEN 12
        ELSE 99
    END;
```

#### Calculate GPA by Semester

```sql
SELECT 
    semester,
    year,
    COUNT(*) as courses,
    SUM(credit_hours) as total_credits,
    ROUND(SUM(grade_score * credit_hours) / NULLIF(SUM(credit_hours), 0), 2) as gpa
FROM courses
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
    AND grade_score IS NOT NULL
    AND credit_hours > 0
GROUP BY semester, year
ORDER BY year DESC, 
    CASE semester
        WHEN 'Fall' THEN 0
        WHEN 'Spring' THEN 1
        WHEN 'Summer' THEN 2
        WHEN 'Winter' THEN 3
        ELSE 99
    END;
```

#### View Courses with Transcript Information

```sql
SELECT 
    c.course_code,
    c.course_name,
    c.grade,
    c.semester,
    c.year,
    t.file_name as transcript_file,
    t.upload_date
FROM courses c
JOIN transcripts t ON c.transcript_id = t.id
JOIN users u ON c.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY c.year DESC, c.semester, c.course_code;
```

### Advanced Queries

#### Find All Users with Transcripts

```sql
SELECT 
    u.email,
    u.id,
    COUNT(DISTINCT t.id) as transcript_count,
    COUNT(c.id) as total_courses,
    MAX(t.upload_date) as latest_upload
FROM users u
LEFT JOIN transcripts t ON u.id = t.user_id
LEFT JOIN courses c ON u.id = c.user_id
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT t.id) > 0
ORDER BY latest_upload DESC;
```

#### View Failed Transcript Processing

```sql
SELECT 
    t.id,
    t.file_name,
    t.upload_date,
    t.error_message,
    u.email as user_email
FROM transcripts t
JOIN users u ON t.user_id = u.id
WHERE t.processing_status = 'failed'
ORDER BY t.upload_date DESC;
```

#### Find Duplicate Courses

```sql
SELECT 
    course_code,
    semester,
    year,
    user_id,
    COUNT(*) as duplicate_count
FROM courses
GROUP BY course_code, semester, year, user_id
HAVING COUNT(*) > 1;
```

#### View Course Distribution by Department

```sql
SELECT 
    SUBSTRING(course_code FROM '^[A-Z]+') as department,
    COUNT(*) as course_count,
    SUM(credit_hours) as total_credits
FROM courses
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
GROUP BY department
ORDER BY course_count DESC;
```

### Using pgAdmin Query Tool

1. **Open Query Tool:**
   - Right-click on the `nupeer` database
   - Select **"Query Tool"** (or press `F5`)

2. **Run Queries:**
   - Paste any of the SQL queries above
   - Click **"Execute"** (or press `F5`)
   - View results in the data output tab

3. **Export Results:**
   - Right-click on the results grid
   - Select **"Copy"** or **"Export"** to save data

### Using DBeaver

1. **Open SQL Editor:**
   - Right-click on the `nupeer` database
   - Select **"SQL Editor"** → **"New SQL Script"**

2. **Run Queries:**
   - Type or paste SQL queries
   - Press `Ctrl+Enter` (or click Execute)
   - View results below

3. **View Table Data:**
   - Expand `nupeer` → `Schemas` → `public` → `Tables`
   - Right-click `courses` or `transcripts`
   - Select **"View Data"**

### Quick Reference: Common Queries

```sql
-- Get all courses for current user (replace email)
SELECT * FROM courses 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');

-- Get transcript processing status
SELECT file_name, processing_status, processed_at, error_message 
FROM transcripts 
ORDER BY upload_date DESC;

-- Count courses by semester
SELECT semester, year, COUNT(*) 
FROM courses 
GROUP BY semester, year 
ORDER BY year DESC, semester;

-- Calculate overall GPA
SELECT 
    ROUND(SUM(grade_score * credit_hours) / NULLIF(SUM(credit_hours), 0), 2) as overall_gpa
FROM courses
WHERE grade_score IS NOT NULL AND credit_hours > 0;
```

---

## Security Note

⚠️ **Important:** These tools are for local development only. Never expose your database port (5433) to the internet in production!

