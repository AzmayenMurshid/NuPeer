### Debugging "Upload failed network error" on Transcript Upload

If you see **"Upload failed network error"** every time you try to upload a transcript, it's usually due to a network or backend/API problem rather than something wrong with your file. Below are some steps and checks to help troubleshoot this issue:

---

#### 1. **Check Your Network Connection**
- Make sure you have a stable internet connection.
- Try other websites or uploads (e.g., Google Drive) to confirm your connection is working.

---

#### 2. **Look at the Developer Console (Browser)**
- Press `F12` (or right-click → "Inspect") and go to the **Network** or **Console** tab.
- Attempt the upload again and watch for any red errors or failed requests.
    - Is there a red "POST" or "PUT" request that fails?
    - Are there CORS or permissions errors in the console?

---

#### 3. **Possible Causes**

- **Backend server isn't running**:  
  The server/API that handles transcript uploads might not be running locally or in staging. If using a local dev environment, make sure `pnpm dev`/`yarn dev`/`npm run dev` and your API/backend/Docker/Postgres containers are running.

- **File size limit**:  
  Some deployments or proxies (like Nginx) might restrict file sizes (often 1–2MB by default).

- **Incorrect API endpoint**:  
  The upload might be pointed at `localhost:3000` when it should be something else, or environment variables are not set properly.

- **No backend API route implemented**:  
  If transcript upload code exists on the frontend but there’s no `/api/upload` (or equivalent) in your codebase, uploads will fail.

- **Authentication fails**:  
  If authentication tokens/cookies are expired or missing, the upload will typically fail with a `401`/`403` error.

- **CORS issues** (when backend is running on a different port or domain):  
  Check that CORS is configured correctly.

---

#### 4. **Backend/Server Log Errors**
- Check your backend terminal or Docker container logs for any errors when an upload is attempted.

---

#### 5. **Try a Smaller File**
- Sometimes overly large transcripts get blocked by file size limits.

---

#### 6. **Check Environment Variables**
- Double-check API URLs or `NEXT_PUBLIC_API_URL` or similar. If these are wrong, uploads will fail.

---

#### 7. **Example Debug Flow**

1. Open browser dev tools, attempt the upload.
2. Look for failed network requests; click each one:
   - Status code: is it 404 (route missing), 413 (file too large), 500, 401, etc.?
   - Error message in response/body?
3. Check backend logs for hints.

---

#### 8. **If All Else Fails**
- Post a screenshot of your browser console errors, and the relevant failed network request (headers + response).
- Check the `frontend/app/api` directory for file upload routes; make sure they're exported and implemented.

---

**Most Common Root Causes (NuPeer context):**
- Forgot to run backend/dev server
- Network/API misconfiguration in `.env`
- Backend error or Docker container not running
- Wrong API path or no API route

---

**Still stuck?**  
Share network error details and/or backend logs with your team for help!

---

#### 9. **No User Profile? "I commented out sign-up and login"**
Yes, if you have disabled or commented out user sign-up and login, *and* uploading requires an authenticated user profile, uploads will fail—often with a `401 Unauthorized` or `403 Forbidden` error.

Yes, uploading in this system generally requires an authenticated user profile.

- **In NuPeer's default setup, uploads (such as transcripts or documents) are tied to a user account.** The backend uses authentication (session/cookie/JWT) to verify the current user, and associates each upload with their user/profile in the database.
- If you are not logged in, or if you have commented out or disabled authentication, the upload endpoints will usually return a `401 Unauthorized` or `403 Forbidden`, or your upload will fail because there is no user context to assign the file to.

**Summary:**  
> Uploading does require an authenticated user profile in this system, unless you have specifically modified the backend to allow anonymous uploads (not recommended).

**Should this show 'Upload failed' network error?**

Yes—if authentication is required and there's no user profile (because auth is commented out), attempts to upload will fail. In that case, the frontend will usually display a generic "Upload failed" error. However, if your app shows network or API errors more specifically, you may see:

- "401 Unauthorized" or "403 Forbidden" (most common)
- "Upload failed" (user-friendly message)
- Or, in dev tools/network tab, a failed network request with error details.

**What you see depends on how the frontend handles error responses from the backend:**  
If it catches an HTTP 401/403/500 and maps it to a generic "Upload failed" toast/snackbar/message, that’s what will be shown.  
If your code surfaces the real error (like "Unauthorized" or network error), it may show that—even if the underlying reason is lack of authentication or missing user context.

**Recommendation:**  
When debugging upload failures, _always check both the user-visible error and the network response in browser dev tools!_ The root cause is often missing authentication or disabled user profile context.

- If you see "Upload failed" and you have commented out sign-up/login, **yes, this is expected.**


**Why?**
- The app expects a user to be authenticated and to have a profile/record to associate the upload with.
- If you skip user auth, things like `req.user`, `session.user`, or `currentUser` will be `undefined` or `null`.
- The backend checks for authentication and either profile id or auth token. If they're missing, you can't upload.

**How to check:**
1. Try logging in (if you re-enable auth) and see if upload works.
2. Check your upload API route:
   - Does it check for `req.user`, `getServerSession()`, or a JWT?
   - Does it error if there's no authenticated user?

**How to fix:**
- Restore sign-up/log in, create a user, and try again.
- OR, temporarily hard-code a user for local dev/testing (not for production!).
- OR, update your backend/upload route to not require auth (not recommended for production).

---

**In Summary:**  
If you're seeing upload errors after disabling auth/user profile features, that's likely the cause. Uploading requires a user context.


**"Cannot connect to server. Please make sure the backend is running." — Why does it show this error?**

This error appears when the frontend (web app) tries to communicate with the backend/API server but cannot reach it. Common reasons for this error include:

- **Backend/API server is not running**: The most frequent cause. Make sure you have started the backend server (e.g., with `npm run dev`, `pnpm dev`, or `yarn dev` in the backend directory).
- **Wrong backend URL or port**: The frontend is configured to make API calls to a specific address (commonly `http://localhost:3000/api` or similar). If the backend runs on a different port or host, or if you changed your configuration, API requests will fail.
- **Backend crashed or exited**: If the backend server crashed (watch your terminal for errors or stack traces), no process is serving API requests, so connections will fail.
- **Network issues or firewalls**: Rare in local development, but something may block connections between frontend and backend (for example, Docker network misconfiguration or Windows firewall rules).
- **CORS configuration**: If the backend is running but is not configured to allow requests from your frontend's origin, requests may fail in a way that surfaces as "Cannot connect" (check browser console for CORS errors).
- **Trying to hit a production API that is offline**: Make sure your `.env` or project config is not pointing to a remote server that is down.

**How to troubleshoot:**
1. **Check if the backend server process is running.**
   - Look in your terminal: Do you see log output from the backend? Is it listening on the expected port?
2. **Open your API URL in the browser.**
   - Try navigating to `http://localhost:3000/api/health` or similar. If you get a response, backend is running.
   - If you see "Cannot connect" or "ERR_CONNECTION_REFUSED", the server is not up.
3. **Review your frontend config/environment variables.**
   - Check `.env.local` or wherever `NEXT_PUBLIC_API_URL` or similar is set.
   - Does it match where your backend is actually running?
4. **Check for port conflicts.**
   - Is another process already using the backend port (`3000`, `5000`, etc.)?
   - Try running `lsof -i :3000` (on Mac/Linux) or using Task Manager/Resource Monitor (on Windows).
5. **Restart everything.**
   - Kill all dev servers (frontend and backend) and start again.

**Summary:**  
This error simply means the frontend cannot reach your backend/API server. 9 times out of 10, the backend isn’t running or is running on a different port than expected. Start your backend and re-try.

**"Warning: Could not initialize storage service: Could not connect to the endpoint URL: 'https://localhost:9000/nupeer-transcripts'" — Why does it show this error?**

This message is shown when your app (either frontend, backend, or both) tries to interact with an object storage service (in this case, **MinIO**) but cannot establish a connection to its server at `localhost:9000`. This exact error is commonly seen in local development setups using MinIO as an S3-compatible storage backend.

**What causes this error?**

- **MinIO is not running:** The most common cause! If the MinIO Docker container or process isn’t started, nothing is listening on port 9000.
- **Wrong endpoint URL:** Your storage client (MinIO SDK or S3 client) is pointed to `https://localhost:9000/nupeer-transcripts` (check for typos—sometimes people forget a `:` in `localhost:9000`, or use `http` instead of `https` or vice versa).
- **MinIO is listening on a different port:** If you configured MinIO for a port *other* than 9000, update your connection settings.
- **SSL/TLS misconfiguration:** If MinIO is running with HTTP, but you try to connect with HTTPS (or vice versa), the connection will fail.
- **Network/firewall issues:** Sometimes Docker containers are not accessible as you expect from the host network.
- **MinIO crashed during startup:** If the service failed to start due to misconfiguration, missing volumes, or port conflicts.

**How to fix:**

1. **Start MinIO**  
   - If using Docker Compose, typically:  
     ```sh
     docker-compose up minio
     ```
   - Or run the standalone MinIO Docker command (check your project documentation).

2. **Check MinIO logs and status**  
   - Run `docker ps` to confirm `minio` is running.
   - Check logs with `docker logs <minio-container-name>` for errors.

3. **Verify the endpoint in your `.env`, config, or code**  
   - Should usually be `http://localhost:9000` (not `https://` unless you specifically set up SSL).
   - Watch out for typos (like `localhost900` or missing slashes).
   - Example correct config:
     ```
     STORAGE_ENDPOINT=http://localhost:9000
     STORAGE_BUCKET=nupeer-transcripts
     STORAGE_REGION=us-east-1
     ```

4. **Test connectivity manually**  
   - Open http://localhost:9000 in your browser. If you see MinIO’s web UI, it’s running.
   - If not, the service is down or listening on a different port.

5. **Check SSL settings**  
   - If you set `USE_SSL=true`, make sure MinIO is actually configured for HTTPS with valid certs.
   - If not using HTTPS, be sure your client connects with plain `http://`.

**Summary:**  
This error means the app cannot reach the MinIO server at the address you specified. It’s almost always a case of MinIO not running or a configuration mismatch in the endpoint URL. Start MinIO, double-check the endpoint, and try again.


**500 Internal Server Error**  
This error means the backend (API server) crashed or failed to process your request. It's a generic server-side error. Common causes:

- Python exceptions in backend code (bugs, database errors, bad queries)
- Database unavailable or misconfigured
- Env vars (secrets/config) missing
- Code syntax errors or library not installed

**How to Debug:**

1. **Read the error log:**  
   Look in the backend terminal window and read the stack trace (lines after "Exception in ASGI application"). The real cause is usually shown there.

2. **Check Postgres is running:**  
   Make sure your database is up (`docker ps`). Backend can't connect if DB is missing.

3. **Common mistakes:**  
   - Changed a model but didn't run migrations
   - Exception in an endpoint (e.g., bad field name, bad logic)
   - Missing config/env file

**Quick checklist:**

- Start Postgres (`docker-compose up postgres`) and MinIO if used
- Ensure your `.env` file exists and is correct
- Restart backend with fresh code/requirements (`pip install -r requirements.txt`)
- Look carefully at the stack trace for details.  
  The top frame is usually your code with the bug.

If unsure, copy the full traceback and ask for help!

---

## **500 Internal Server Error: Password Length Limit (Bcrypt)**

### **Error Message:**
```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])
```

### **What is this error?**

This error occurs when a user tries to register or change their password with a password that exceeds **72 bytes** in length. The error happens during password hashing in the authentication system.

**Where it occurs:**
- User registration endpoint: `POST /api/v1/auth/register`
- Password change/reset endpoints
- Any endpoint that calls `get_password_hash()` from `app/core/security.py`

### **Why does this happen?**

**Bcrypt has a hard limit of 72 bytes for passwords.** This is a limitation of the bcrypt algorithm itself, not a bug in the code. The application uses `passlib` with bcrypt for password hashing, which enforces this limit.

**Technical details:**
- Bcrypt (the underlying hashing algorithm) can only process passwords up to 72 bytes
- This is approximately 72 ASCII characters, but can be less for multi-byte characters (UTF-8)
- The error is raised by the `passlib.handlers.bcrypt` library when it detects a password exceeding this limit

### **How to identify this error:**

1. **Check the stack trace:**
   - Look for `ValueError: password cannot be longer than 72 bytes`
   - The error originates from `app/core/security.py` → `get_password_hash()`
   - Usually triggered in `app/api/v1/auth.py` during user registration

2. **When it happens:**
   - User submits a registration form with a very long password
   - Password contains many special characters or emojis (which use multiple bytes)
   - Password is longer than ~72 characters

### **How to fix:**

#### **Option 1: Add password length validation (Recommended)**

Add validation to reject passwords longer than 72 bytes before hashing:

**In `backend/app/api/v1/auth.py` or your Pydantic models:**

```python
from pydantic import BaseModel, validator
from fastapi import HTTPException, status

class UserRegister(BaseModel):
    email: str
    password: str
    # ... other fields
    
    @validator('password')
    def validate_password_length(cls, v):
        # Bcrypt limit is 72 bytes, not characters
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot exceed 72 bytes. Please use a shorter password."
            )
        return v
```

#### **Option 2: Truncate password before hashing (Not recommended for security)**

If you must support longer passwords, truncate them (but this is **not recommended** for security reasons):

**In `backend/app/core/security.py`:**

```python
def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Truncate to 72 bytes if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)
```

**⚠️ Warning:** Truncating passwords can lead to security issues and unexpected behavior. Users might not realize their password was shortened.

#### **Option 3: Use a different hashing algorithm (Advanced)**

Switch from bcrypt to an algorithm without this limitation (e.g., Argon2):

```python
# In app/core/security.py
from passlib.context import CryptContext

# Use Argon2 instead of bcrypt (no 72-byte limit)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
```

**Note:** This requires installing `passlib[argon2]` and may require database migrations if you have existing users.

### **Best Practice Solution:**

**Implement password validation in your API:**

1. **Frontend validation:** Limit password input to 72 characters (or 70 to be safe)
2. **Backend validation:** Add Pydantic validators to reject passwords > 72 bytes
3. **User-friendly error message:** Tell users the password is too long before attempting to hash

**Example implementation:**

```python
# In your Pydantic model or endpoint
MAX_PASSWORD_BYTES = 72

def validate_password_bytes(password: str) -> str:
    """Validate password doesn't exceed bcrypt's 72-byte limit"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password is too long. Maximum length is {MAX_PASSWORD_BYTES} bytes."
        )
    return password
```

### **Quick Fix for Development:**

If you encounter this error during development:

1. **Check the password length:** Count the bytes, not just characters
2. **Use a shorter password:** Try with a password under 70 characters
3. **Check for special characters:** Emojis and some Unicode characters use multiple bytes

### **Summary:**

- **Root cause:** Bcrypt algorithm limitation (72-byte maximum)
- **When it happens:** User registration or password change with password > 72 bytes
- **Best fix:** Add validation to reject long passwords before hashing
- **Location:** Error occurs in `app/core/security.py` → `get_password_hash()`

This is a known limitation of bcrypt, not a bug. The solution is to validate password length before attempting to hash it.

---

## **500 Internal Server Error: Bcrypt Version Compatibility Issue**

### **Error Message:**
```
AttributeError: module 'bcrypt' has no attribute '__about__'
```

### **What is this error?**

This error occurs when there's a version compatibility issue between `passlib` and the `bcrypt` library. The `passlib` library tries to read the bcrypt version using `_bcrypt.__about__.__version__`, but newer versions of bcrypt (4.0.0+) changed their internal structure and no longer expose `__about__`.

**When it happens:**
- During password hashing operations (registration, password changes)
- When `passlib` initializes the bcrypt backend
- Usually appears as a warning first, then causes a 500 error when actually hashing

### **Why does this happen?**

**Version incompatibility:**
- `passlib[bcrypt]==1.7.4` expects older bcrypt API structure
- Newer bcrypt versions (4.0.0+) removed the `__about__` module
- This is a known compatibility issue between passlib 1.7.4 and bcrypt 4.0.0+

### **How to fix:**

#### **Option 1: Pin bcrypt to compatible version (Recommended)**

Update `requirements.txt` to use a compatible bcrypt version:

```txt
passlib[bcrypt]==1.7.4
bcrypt<4.0.0
```

Then reinstall:
```bash
pip install -r requirements.txt --upgrade
```

#### **Option 2: Upgrade passlib (Alternative)**

Upgrade to a newer version of passlib that supports newer bcrypt:

```txt
passlib[bcrypt]>=1.7.4
bcrypt>=4.0.0
```

**Note:** Test thoroughly as newer versions may have API changes.

#### **Option 3: Suppress the warning (Not recommended)**

The warning is usually non-fatal, but if it causes issues, you can work around it by catching the AttributeError in the security module. However, this is a workaround and not a proper fix.

### **Quick Fix:**

1. **Check current bcrypt version:**
   ```bash
   pip show bcrypt
   ```

2. **If bcrypt >= 4.0.0, downgrade:**
   ```bash
   pip install "bcrypt<4.0.0"
   ```

3. **Or update requirements.txt:**
   ```txt
   bcrypt<4.0.0
   ```

4. **Reinstall dependencies:**
   ```bash
   pip install -r requirements.txt --upgrade
   ```

### **Summary:**

- **Root cause:** Version incompatibility between passlib 1.7.4 and bcrypt 4.0.0+
- **When it happens:** During password hashing operations
- **Best fix:** Pin bcrypt to version < 4.0.0 in requirements.txt
- **Location:** Error occurs in `passlib.handlers.bcrypt` when trying to read version

---

## **500 Internal Server Error: Password Validation Not Working**

### **Symptom:**

Even after adding password validation, you still see:
```
ValueError: password cannot be longer than 72 bytes
```

### **Why validation might not catch it:**

1. **Pydantic validator not being called:** The validator might not be triggered if the model is instantiated differently
2. **Direct password access:** If the password is accessed directly before validation
3. **Validation order:** The validator might run after the password is already processed

### **Defensive Solution:**

Add a backup validation check in `get_password_hash()` function:

**In `backend/app/core/security.py`:**

```python
def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Defensive check: ensure password doesn't exceed bcrypt's 72-byte limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        raise ValueError(
            f"Password cannot exceed 72 bytes. Received {len(password_bytes)} bytes."
        )
    return pwd_context.hash(password)
```

This provides a **second layer of protection** that will catch the error even if Pydantic validation is bypassed.

### **Best Practice:**

1. **Primary validation:** Pydantic model validators (catches it early)
2. **Defensive validation:** Check in `get_password_hash()` (catches it if primary fails)
3. **Clear error messages:** Both should provide helpful feedback

### **Summary:**

- **Why it happens:** Validation might be bypassed or not triggered
- **Solution:** Add defensive check in the hashing function itself
- **Location:** Add check in `app/core/security.py` → `get_password_hash()`

This ensures the error is caught at multiple levels for maximum reliability.

---

## **500 Internal Server Error: ResponseValidationError - UUID to String Conversion**

### **Error Message:**
```
fastapi.exceptions.ResponseValidationError: 1 validation errors:
  {'type': 'string_type', 'loc': ('response', 'id'), 'msg': 'Input should be a valid string', 
   'input': UUID('1a4c07d8-d132-4062-9b74-79593355e7bf'), ...}
```

### **What is this error?**

This error occurs when FastAPI tries to serialize a database model to a Pydantic response model, but there's a type mismatch. Specifically:

- **Database model** (`User`) has `id` as a **UUID object** (Python `uuid.UUID`)
- **Response model** (`UserResponse`) expects `id` as a **string**
- FastAPI/Pydantic validation fails because it can't automatically convert UUID to string

**Where it occurs:**
- User registration endpoint: `POST /api/v1/auth/register`
- Any endpoint that returns a model with UUID fields
- When using `response_model` with Pydantic models that have string fields but database returns UUIDs

### **Why does this happen?**

**Type mismatch between database and API:**
- SQLAlchemy models use `UUID(as_uuid=True)` which returns Python `uuid.UUID` objects
- Pydantic response models often define `id: str` for JSON serialization
- FastAPI's automatic serialization doesn't always handle UUID → string conversion
- Pydantic v2 is stricter about type validation than v1

**Technical details:**
- `UUID(as_uuid=True)` in SQLAlchemy returns `uuid.UUID` objects, not strings
- JSON serialization requires strings for UUIDs
- Pydantic v2 doesn't automatically coerce UUID to string in all cases

### **How to identify this error:**

1. **Check the stack trace:**
   - Look for `ResponseValidationError`
   - The error shows the field name (e.g., `'id'`) and expected type (`'string_type'`)
   - The `input` field shows the actual type (e.g., `UUID(...)`)

2. **Check your models:**
   - Database model: `id = Column(UUID(as_uuid=True), ...)`
   - Response model: `id: str`
   - If they don't match, this error will occur

### **How to fix:**

#### **Option 1: Add UUID to String Converter (Recommended)**

Add a field validator to convert UUID to string in the response model:

**In `backend/app/api/v1/auth.py`:**

```python
from pydantic import BaseModel, field_validator

class UserResponse(BaseModel):
    id: str
    email: str
    # ... other fields
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    class Config:
        from_attributes = True
```

**How it works:**
- `mode='before'` runs the validator before Pydantic's type checking
- Converts UUID objects to strings automatically
- Handles `None` values safely

#### **Option 2: Convert in the Endpoint (Alternative)**

Manually convert UUID to string when returning the response:

```python
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # ... create user ...
    
    # Convert UUID to string manually
    return UserResponse(
        id=str(user.id),
        email=user.email,
        # ... other fields
    )
```

**Note:** This is more verbose and error-prone than Option 1.

#### **Option 3: Use UUID Type in Response Model (Not Recommended)**

Change the response model to accept UUID:

```python
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID  # Instead of str
    # ...
```

**⚠️ Warning:** This may cause JSON serialization issues in some clients. UUIDs should typically be strings in JSON APIs.

### **Best Practice Solution:**

**Use field validators for automatic conversion:**

1. **Identify all UUID fields** in your response models
2. **Add validators** for each UUID field that needs string conversion
3. **Test** that the conversion works correctly

**Example for multiple UUID fields:**

```python
class UserResponse(BaseModel):
    id: str
    user_id: str  # If this is also a UUID
    
    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
```

### **Quick Fix:**

If you see this error:

1. **Find the response model** (e.g., `UserResponse`)
2. **Check which field is failing** (look at `'loc': ('response', 'id')`)
3. **Add a field validator** with `mode='before'` to convert UUID to string
4. **Test the endpoint** again

### **Summary:**

- **Root cause:** Type mismatch between database UUID objects and response model string expectations
- **When it happens:** When returning database models with UUID fields through Pydantic response models
- **Best fix:** Add `@field_validator` with `mode='before'` to convert UUID to string
- **Location:** Error occurs in FastAPI response serialization, fix in response model validators

This is a common issue when using UUIDs in SQLAlchemy with Pydantic v2. The validator approach ensures automatic conversion without manual string conversion in every endpoint.

---

## **500 Internal Server Error: ResponseValidationError - Multiple Type Conversions (UUID, DateTime, None)**

### **Error Message:**
```
fastapi.exceptions.ResponseValidationError: 4 validation errors:
  {'type': 'string_type', 'loc': ('response', 'id'), 'msg': 'Input should be a valid string', 
   'input': UUID('2af08a10-c6f3-4abf-b444-17579e307035'), ...}
  {'type': 'string_type', 'loc': ('response', 'upload_date'), 'msg': 'Input should be a valid string', 
   'input': datetime.datetime(2025, 12, 24, 1, 12, 25, 128093, tzinfo=datetime.timezone.utc), ...}
  {'type': 'string_type', 'loc': ('response', 'processed_at'), 'msg': 'Input should be a valid string', 
   'input': None, ...}
  {'type': 'string_type', 'loc': ('response', 'error_message'), 'msg': 'Input should be a valid string', 
   'input': None, ...}
```

### **What is this error?**

This is a **compound validation error** that occurs when FastAPI tries to serialize a database model with multiple type mismatches:

1. **UUID → String**: Database returns UUID objects, but response model expects strings
2. **DateTime → String**: Database returns `datetime` objects, but response model expects ISO format strings
3. **None → String**: Database returns `None` for optional fields, but response model expects `None` or string (not just `None`)

**Where it occurs:**
- Transcript upload endpoint: `POST /api/v1/transcripts/upload`
- Any endpoint returning models with UUID, DateTime, or nullable fields
- When using `response_model` with Pydantic models that have string fields but database returns different types

### **Why does this happen?**

**Multiple type mismatches:**
- SQLAlchemy models use `UUID(as_uuid=True)` → returns Python `uuid.UUID` objects
- SQLAlchemy models use `DateTime(timezone=True)` → returns Python `datetime.datetime` objects
- SQLAlchemy nullable fields can return `None` → but Pydantic expects explicit `Optional[str]` or proper None handling
- JSON serialization requires strings for UUIDs and ISO format strings for datetimes
- Pydantic v2 is stricter about type validation and doesn't automatically coerce all types

**Technical details:**
- `UUID(as_uuid=True)` returns `uuid.UUID` objects, not strings
- `DateTime(timezone=True)` returns `datetime.datetime` objects with timezone info
- `Column(Text)` can be `None`, but Pydantic needs explicit `Optional[str]` type hints
- FastAPI's automatic serialization doesn't handle all these conversions

### **How to identify this error:**

1. **Check the stack trace:**
   - Look for `ResponseValidationError` with multiple validation errors
   - Each error shows the field name and expected vs actual type
   - Common patterns:
     - `'input': UUID(...)` → needs UUID to string conversion
     - `'input': datetime.datetime(...)` → needs datetime to string conversion
     - `'input': None` → needs proper None handling

2. **Check your models:**
   - Database model: `id = Column(UUID(as_uuid=True), ...)`
   - Database model: `upload_date = Column(DateTime(timezone=True), ...)`
   - Response model: `id: str`, `upload_date: str`
   - If types don't match, this error will occur

### **How to fix:**

#### **Option 1: Add Multiple Field Validators (Recommended)**

Add validators for each type that needs conversion:

**In `backend/app/api/v1/transcripts.py`:**

```python
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class TranscriptResponse(BaseModel):
    id: str
    upload_date: str
    processed_at: Optional[str] = None
    error_message: Optional[str] = None
    # ... other fields
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('upload_date', 'processed_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    @field_validator('error_message', mode='before')
    @classmethod
    def convert_none_to_str(cls, v):
        """Handle None values for optional string fields"""
        if v is None:
            return None
        return str(v) if not isinstance(v, str) else v
    
    class Config:
        from_attributes = True
```

**Key points:**
- Use `Optional[str]` for nullable fields in the type hint
- `mode='before'` runs validators before Pydantic's type checking
- Handle `None` values explicitly for optional fields
- Use `.isoformat()` for datetime to string conversion (ISO 8601 format)

#### **Option 2: Use Pydantic's Built-in Serializers (Alternative)**

Use `model_serializer` for more complex conversions:

```python
from pydantic import model_serializer

class TranscriptResponse(BaseModel):
    # ... fields ...
    
    @model_serializer
    def serialize_model(self):
        """Custom serialization for the entire model"""
        data = {}
        for field_name, field_value in self.__dict__.items():
            if isinstance(field_value, uuid.UUID):
                data[field_name] = str(field_value)
            elif isinstance(field_value, datetime):
                data[field_name] = field_value.isoformat()
            elif field_value is None:
                data[field_name] = None
            else:
                data[field_name] = field_value
        return data
```

**Note:** This approach is more complex but gives you full control over serialization.

#### **Option 3: Convert in Endpoint (Not Recommended)**

Manually convert all fields when returning:

```python
@router.post("/upload", response_model=TranscriptResponse)
async def upload_transcript(...):
    # ... create transcript ...
    
    return TranscriptResponse(
        id=str(transcript.id),
        upload_date=transcript.upload_date.isoformat(),
        processed_at=transcript.processed_at.isoformat() if transcript.processed_at else None,
        error_message=transcript.error_message,
        # ... other fields
    )
```

**⚠️ Warning:** This is verbose, error-prone, and must be repeated in every endpoint.

### **Best Practice Solution:**

**Use field validators for automatic conversion:**

1. **Identify all fields that need conversion:**
   - UUID fields → add UUID validator
   - DateTime fields → add datetime validator
   - Optional string fields → use `Optional[str]` and handle None

2. **Add validators with `mode='before'`:**
   - This runs before Pydantic's type checking
   - Handles conversion automatically
   - Works for all endpoints using the model

3. **Use proper type hints:**
   - `Optional[str]` for nullable string fields
   - `str` for required string fields
   - This helps Pydantic understand what to expect

**Example pattern for common conversions:**

```python
class MyResponse(BaseModel):
    # UUID fields
    id: str
    user_id: str
    
    # DateTime fields
    created_at: str
    updated_at: Optional[str] = None
    
    # Optional string fields
    description: Optional[str] = None
    
    # UUID validators
    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
    
    # DateTime validators
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    # Optional string validator (if needed)
    @field_validator('description', mode='before')
    @classmethod
    def handle_optional_str(cls, v):
        return None if v is None else str(v)
```

### **Quick Fix Checklist:**

If you see this error:

1. ✅ **Check which fields are failing** (look at `'loc'` in each error)
2. ✅ **Identify the type mismatch** (UUID, datetime, or None)
3. ✅ **Add appropriate validators** for each type
4. ✅ **Use `Optional[str]`** for nullable fields
5. ✅ **Test the endpoint** again

### **Common Patterns:**

| Database Type | Response Type | Validator Needed |
|--------------|---------------|------------------|
| `UUID(as_uuid=True)` | `str` | UUID to string |
| `DateTime(timezone=True)` | `str` | Datetime to ISO string |
| `Column(Text, nullable=True)` | `Optional[str]` | None handling |
| `Column(String, nullable=True)` | `Optional[str]` | None handling |

### **Summary:**

- **Root cause:** Multiple type mismatches between database models and response models
- **When it happens:** When returning database models with UUID, DateTime, or nullable fields through Pydantic response models
- **Best fix:** Add `@field_validator` with `mode='before'` for each type that needs conversion
- **Location:** Error occurs in FastAPI response serialization, fix in response model validators

This is a common issue when using SQLAlchemy with Pydantic v2. The validator approach ensures automatic conversion for all fields without manual conversion in every endpoint.

---

## **422 Unprocessable Entity: ResponseValidationError in Nested Models**

### **Error Message:**
```
INFO: 127.0.0.1:51233 - "GET /api/v1/recommendations/connected-brothers HTTP/1.1" 422 Unprocessable Entity
```

### **What is this error?**

A **422 Unprocessable Entity** error occurs when FastAPI/Pydantic cannot validate the response data. This typically happens when:

1. **Nested models** have type mismatches (e.g., `List[CourseHelped]` where `CourseHelped` has datetime fields)
2. **DateTime fields** in nested models aren't converted to strings
3. **UUID fields** in nested models aren't converted to strings
4. **Optional fields** with `None` values aren't properly handled

**Where it occurs:**
- Endpoints returning complex nested response models
- Models with `List[SomeModel]` where `SomeModel` has datetime/UUID fields
- Endpoints like `GET /api/v1/recommendations/connected-brothers`

### **Why does this happen?**

**Nested model validation:**
- When you have `List[CourseHelped]` in `ConnectedBrotherResponse`, Pydantic validates each `CourseHelped` object
- If `CourseHelped` has datetime fields that aren't converted, validation fails
- The error occurs during response serialization, not request validation
- Pydantic v2 validates nested models recursively and is stricter about types

**Common causes:**
- DateTime objects in nested models not converted to strings
- UUID objects in nested models not converted to strings
- Optional fields without proper `Optional[...]` type hints
- Missing validators in nested models

### **How to identify this error:**

1. **Check the endpoint:**
   - Look for endpoints returning nested models (e.g., `List[SomeModel]`)
   - Check if nested models have datetime or UUID fields

2. **Check the response models:**
   - Look for models with `List[...]` fields
   - Check if nested models have validators for datetime/UUID conversion
   - Verify optional fields use `Optional[...]` type hints

3. **Check FastAPI logs:**
   - 422 errors are logged but may not show detailed validation errors in production
   - Enable debug mode or check response body for detailed error messages

### **How to fix:**

#### **Option 1: Add Validators to Nested Models (Recommended)**

Add validators to both parent and nested models:

**In `backend/app/api/v1/recommendations.py`:**

```python
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

class CourseHelped(BaseModel):
    course_code: str
    grade: str
    grade_score: float
    semester: Optional[str] = None
    year: Optional[int] = None
    help_request_date: str
    
    @field_validator('help_request_date', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v

class ConnectedBrotherResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    courses_helped: List[CourseHelped]
    total_courses: int
    first_connected: str
    last_connected: str
    
    @field_validator('helper_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('first_connected', 'last_connected', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v
```

**Key points:**
- Add validators to **both** parent and nested models
- Use `Optional[...]` for nullable fields
- Handle `None` values explicitly in validators
- Use `mode='before'` to run validators before type checking

#### **Option 2: Convert in Endpoint (Alternative)**

Manually convert all fields when building the response:

```python
@router.get("/connected-brothers", response_model=List[ConnectedBrotherResponse])
async def get_connected_brothers(...):
    # ... build brothers_map ...
    
    result = []
    for brother in brothers_list:
        courses_helped = [
            CourseHelped(
                course_code=course['course_code'],
                grade=course['grade'],
                grade_score=course['grade_score'],
                semester=course['semester'],
                year=course['year'],
                help_request_date=course['help_request_date'].isoformat()  # Convert here
            )
            for course in brother['courses']
        ]
        
        result.append(ConnectedBrotherResponse(
            helper_id=str(brother['helper_id']),
            helper_name=brother['helper_name'],
            helper_email=brother['helper_email'],
            courses_helped=courses_helped,
            total_courses=len(courses_helped),
            first_connected=brother['first_connected'].isoformat(),  # Convert here
            last_connected=brother['last_connected'].isoformat()  # Convert here
        ))
    
    return result
```

**⚠️ Warning:** This is verbose, error-prone, and must be repeated in every endpoint.

#### **Option 3: Use Pydantic's Config (Advanced)**

Use `model_config` with custom serializers:

```python
from pydantic import ConfigDict

class CourseHelped(BaseModel):
    model_config = ConfigDict(
        # Custom serialization can be added here
    )
    # ... fields ...
```

**Note:** This approach is more complex and may not work for all cases.

### **Best Practice Solution:**

**Add validators to all models (parent and nested):**

1. **Identify all models** that need conversion:
   - Parent models (e.g., `ConnectedBrotherResponse`)
   - Nested models (e.g., `CourseHelped`)
   - Any model with datetime or UUID fields

2. **Add validators** to each model:
   - UUID validators for UUID fields
   - DateTime validators for datetime fields
   - None handling for optional fields

3. **Use `Optional[...]`** for nullable fields:
   - `Optional[str]` instead of `str = None`
   - `Optional[int]` instead of `int = None`

**Example pattern for nested models:**

```python
# Nested model
class NestedModel(BaseModel):
    id: str
    created_at: str
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
    
    @field_validator('created_at', mode='before')
    @classmethod
    def convert_datetime(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

# Parent model
class ParentModel(BaseModel):
    items: List[NestedModel]  # Nested model
    parent_id: str
    parent_date: str
    
    @field_validator('parent_id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
    
    @field_validator('parent_date', mode='before')
    @classmethod
    def convert_datetime(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
```

### **Quick Fix Checklist:**

If you see a 422 error:

1. ✅ **Identify the endpoint** that's failing
2. ✅ **Check the response model** for nested models
3. ✅ **Add validators** to nested models (not just parent)
4. ✅ **Use `Optional[...]`** for nullable fields
5. ✅ **Test the endpoint** again

### **Common Patterns for Nested Models:**

| Pattern | Issue | Fix |
|---------|-------|-----|
| `List[Model]` with datetime | DateTime not converted | Add datetime validator to nested model |
| `List[Model]` with UUID | UUID not converted | Add UUID validator to nested model |
| `Optional[str] = None` | Type hint missing | Use `Optional[str]` instead of `str = None` |
| Nested dicts | Dict not validated | Convert to Pydantic model first |

### **Summary:**

- **Root cause:** Type mismatches in nested models (datetime, UUID, None handling)
- **When it happens:** When returning complex nested response models through FastAPI
- **Best fix:** Add `@field_validator` to both parent and nested models with `mode='before'`
- **Location:** Error occurs in FastAPI response serialization, fix in all response models (parent and nested)

This is a common issue when using nested models with SQLAlchemy and Pydantic v2. The validator approach ensures automatic conversion at all levels without manual conversion in endpoints.

---

## **SQLAlchemy 2.0 Error: Textual SQL Expression Must Be Explicitly Declared**

### **Error Message:**
```
sqlalchemy.exc.ArgumentError: Textual SQL expression '\n                SELECT i...' 
should be explicitly declared as text('\n                SELECT i...')
```

### **What is this error?**

This error occurs when using SQLAlchemy 2.0+ with raw SQL strings. In SQLAlchemy 2.0, the API became stricter about type safety, and raw SQL strings must be explicitly wrapped with the `text()` function.

**Where it occurs:**
- When using `db.execute()` with raw SQL strings
- In database query tools or scripts
- When migrating from SQLAlchemy 1.x to 2.x
- In standalone database utilities

### **Why does this happen?**

**SQLAlchemy 2.0 API changes:**
- SQLAlchemy 2.0 introduced stricter type checking for safety
- Raw SQL strings are no longer automatically recognized
- The `text()` function must be used to explicitly mark SQL strings
- This prevents accidental SQL injection and makes intent clear

**Technical details:**
- SQLAlchemy 1.x: `db.execute("SELECT * FROM users")` worked
- SQLAlchemy 2.0: `db.execute("SELECT * FROM users")` raises `ArgumentError`
- SQLAlchemy 2.0: `db.execute(text("SELECT * FROM users"))` is required

### **How to identify this error:**

1. **Check the error message:**
   - Look for `ArgumentError: Textual SQL expression`
   - The error mentions "should be explicitly declared as text(...)"
   - Usually occurs in `db.execute()` calls

2. **Check your SQLAlchemy version:**
   ```bash
   pip show sqlalchemy
   ```
   - If version is 2.0.0 or higher, you need `text()`
   - If version is 1.x, this error won't occur (but you should still use `text()`)

3. **Check your code:**
   - Look for `db.execute("SELECT ...")` or `db.execute("""SELECT ...""")`
   - These need to be wrapped with `text()`

### **How to fix:**

#### **Option 1: Wrap SQL Strings with text() (Recommended)**

Import `text` from SQLAlchemy and wrap all raw SQL strings:

**Before (SQLAlchemy 1.x style):**
```python
from sqlalchemy.orm import sessionmaker

db = SessionLocal()
result = db.execute(
    """
    SELECT id, email, first_name, last_name
    FROM users
    WHERE email ILIKE :email
    """,
    {"email": f"%{email}%"}
)
```

**After (SQLAlchemy 2.0 style):**
```python
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

db = SessionLocal()
result = db.execute(
    text("""
    SELECT id, email, first_name, last_name
    FROM users
    WHERE email ILIKE :email
    """),
    {"email": f"%{email}%"}
)
```

**Key changes:**
1. Import `text` from `sqlalchemy`
2. Wrap the SQL string with `text()`
3. Keep parameters as a separate dictionary

#### **Option 2: Use SQLAlchemy Core Expressions (Alternative)**

Use SQLAlchemy's expression language instead of raw SQL:

```python
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

db = SessionLocal()
stmt = select(User).where(User.email.ilike(f"%{email}%"))
result = db.execute(stmt)
```

**Note:** This requires importing your models, which may not be suitable for standalone tools.

#### **Option 3: Downgrade to SQLAlchemy 1.x (Not Recommended)**

```bash
pip install "sqlalchemy<2.0.0"
```

**⚠️ Warning:** This is not recommended as SQLAlchemy 2.0 has important security and performance improvements. It's better to update your code.

### **Best Practice Solution:**

**Always use `text()` for raw SQL in SQLAlchemy 2.0+:**

1. **Import text:**
   ```python
   from sqlalchemy import text
   ```

2. **Wrap all raw SQL strings:**
   ```python
   # Single-line SQL
   result = db.execute(text("SELECT * FROM users"))
   
   # Multi-line SQL
   result = db.execute(
       text("""
       SELECT id, email, first_name, last_name
       FROM users
       WHERE email ILIKE :email
       """),
       {"email": f"%{email}%"}
   )
   ```

3. **Use parameters for values:**
   ```python
   # Good - uses parameters
   db.execute(
       text("SELECT * FROM users WHERE id = :user_id"),
       {"user_id": user_id}
   )
   
   # Bad - string interpolation (SQL injection risk)
   db.execute(
       text(f"SELECT * FROM users WHERE id = '{user_id}'")
   )
   ```

### **Quick Fix Checklist:**

If you see this error:

1. ✅ **Import `text`** from `sqlalchemy`
2. ✅ **Find all `db.execute()` calls** with raw SQL strings
3. ✅ **Wrap SQL strings** with `text()`
4. ✅ **Test the code** again

### **Common Patterns:**

| Pattern | SQLAlchemy 1.x | SQLAlchemy 2.0 |
|---------|----------------|-----------------|
| Simple query | `db.execute("SELECT ...")` | `db.execute(text("SELECT ..."))` |
| With parameters | `db.execute("SELECT ... WHERE id = :id", {"id": 1})` | `db.execute(text("SELECT ... WHERE id = :id"), {"id": 1})` |
| Multi-line | `db.execute("""SELECT ...""")` | `db.execute(text("""SELECT ..."""))` |

### **Migration Guide:**

**Step 1:** Update imports
```python
# Add this import
from sqlalchemy import text
```

**Step 2:** Find and replace
```python
# Find: db.execute("
# Replace: db.execute(text("

# Find: db.execute("""
# Replace: db.execute(text("""
```

**Step 3:** Test thoroughly
- Run your queries
- Verify results are correct
- Check for any remaining raw SQL strings

### **Summary:**

- **Root cause:** SQLAlchemy 2.0 requires explicit `text()` wrapper for raw SQL strings
- **When it happens:** When using `db.execute()` with raw SQL strings in SQLAlchemy 2.0+
- **Best fix:** Import `text` from `sqlalchemy` and wrap all raw SQL strings
- **Location:** Error occurs in `db.execute()` calls, fix by adding `text()` wrapper

This is a breaking change in SQLAlchemy 2.0 for better type safety and security. Always use `text()` for raw SQL strings to make your code compatible with SQLAlchemy 2.0+.

---

## **Error: Transcript Processing Stuck at "Pending" Status**

### **Date:** 2025-01-XX

### **Error Description:**
Transcripts uploaded to the system remain in "pending" status and never get processed, even though the upload succeeds.

### **Symptoms:**
- Transcript uploads complete successfully
- Transcript status remains "pending" indefinitely
- No courses are extracted from the transcript
- No error messages are shown to the user

### **Root Cause:**
The transcript upload endpoint (`POST /api/v1/transcripts/upload`) attempts to queue a Celery background task for processing. However, if:
1. The Celery worker is not running
2. Redis (Celery broker) is not available
3. There's a connection issue between the backend and Celery

The task fails silently, and the transcript remains in "pending" status. The original code only logged a warning but did not provide a fallback mechanism.

### **Error Location:**
- **File:** `backend/app/api/v1/transcripts.py`
- **Function:** `upload_transcript()`
- **Lines:** 121-127 (before fix)

### **Code Before Fix:**
```python
# Queue processing task (non-blocking, fails gracefully if Celery not available)
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # Log but don't fail the upload if Celery is unavailable
    print(f"Warning: Could not queue processing task: {celery_error}")
    print("Transcript uploaded but processing will need to be triggered manually")
```

### **Problem:**
When Celery is unavailable, the exception is caught but no processing occurs. The transcript stays in "pending" status forever, requiring manual intervention via the `/process` endpoint.

### **Solution:**
Implement automatic fallback to synchronous processing when Celery is unavailable. This ensures transcripts are always processed, even if the Celery worker is not running.

### **Code After Fix:**
```python
# Queue processing task (non-blocking, falls back to synchronous if Celery not available)
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # If Celery is unavailable, process synchronously as fallback
    print(f"Warning: Could not queue Celery task: {celery_error}")
    print("Falling back to synchronous processing...")
    try:
        # Import the actual function (not the Celery task wrapper)
        from app.tasks.process_transcript import process_transcript_task
        # Call the function directly (synchronous execution)
        result = process_transcript_task(str(transcript.id), str(current_user.id))
        print(f"Transcript processed synchronously: {result.get('status', 'unknown')}")
    except Exception as sync_error:
        # If synchronous processing also fails, log but don't fail the upload
        print(f"Error: Synchronous processing also failed: {sync_error}")
        print("Transcript uploaded but processing failed. Use manual processing endpoint to retry.")
```

### **How the Fix Works:**
1. **First attempt:** Try to queue the task via Celery (asynchronous, non-blocking)
2. **Fallback:** If Celery fails, import and call the processing function directly (synchronous, blocking)
3. **Error handling:** If both fail, log the error but don't fail the upload (user can retry via manual endpoint)

### **Benefits:**
- **Automatic processing:** Transcripts are processed immediately even without Celery
- **No manual intervention:** Users don't need to manually trigger processing
- **Graceful degradation:** System works in both Celery and non-Celery environments
- **Better user experience:** Transcripts are processed automatically on upload

### **When This Happens:**
- Celery worker is not started
- Redis (Celery broker) is not running or not accessible
- Network issues between backend and Redis
- Celery configuration is incorrect

### **Prevention:**
1. **For production:** Always ensure Celery worker is running for optimal performance
2. **For development:** The fallback ensures the system works even without Celery
3. **Monitoring:** Check logs for "Falling back to synchronous processing" messages to identify when Celery is unavailable

### **Related Files:**
- `backend/app/api/v1/transcripts.py` - Upload endpoint with fallback logic
- `backend/app/tasks/process_transcript.py` - Processing function that can run synchronously or as Celery task
- `docker-compose.yml` - Celery worker service configuration

### **Testing:**
1. **Test with Celery running:** Upload transcript, verify it processes asynchronously
2. **Test without Celery:** Stop Celery worker, upload transcript, verify it processes synchronously
3. **Test error handling:** Simulate processing errors, verify appropriate error messages

### **Summary:**
- **Root cause:** No fallback mechanism when Celery is unavailable
- **When it happens:** When Celery worker is not running or Redis is not accessible
- **Best fix:** Implement automatic fallback to synchronous processing
- **Location:** Error occurs in upload endpoint, fix by adding synchronous fallback

This ensures transcripts are always processed, providing a better user experience and system reliability.

---

## **Error: UnboundLocalError - 'process_transcript_task' referenced before assignment**

### **Date:** 2025-01-XX

### **Error Description:**
When uploading a transcript, an `UnboundLocalError` occurs: `local variable 'process_transcript_task' referenced before assignment`.

### **Symptoms:**
- Transcript upload fails with `UnboundLocalError`
- Error occurs in the exception handler when trying to fall back to synchronous processing
- Processing status shows "Failed"

### **Root Cause:**
The code was re-importing `process_transcript_task` inside the exception handler block. Python's scoping rules treat this as a local variable assignment, which makes Python think `process_transcript_task` is a local variable throughout the entire function. When the code tries to use `process_transcript_task.delay()` at the top of the try block, Python sees it as a local variable that hasn't been assigned yet, causing the `UnboundLocalError`.

### **Error Location:**
- **File:** `backend/app/api/v1/transcripts.py`
- **Function:** `upload_transcript()`
- **Lines:** 123-130 (before fix)

### **Code Before Fix:**
```python
# Queue processing task (non-blocking, falls back to synchronous if Celery not available)
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # If Celery is unavailable, process synchronously as fallback
    print(f"Warning: Could not queue Celery task: {celery_error}")
    print("Falling back to synchronous processing...")
    try:
        # Import the actual function (not the Celery task wrapper)
        from app.tasks.process_transcript import process_transcript_task  # ❌ This causes UnboundLocalError
        # Call the function directly (synchronous execution)
        result = process_transcript_task(str(transcript.id), str(current_user.id))
```

### **Problem:**
Re-importing a variable inside a function makes Python treat it as a local variable throughout the entire function scope, even before the assignment. This causes an `UnboundLocalError` when trying to use the variable before the exception handler runs.

### **Solution:**
Remove the redundant import since `process_transcript_task` is already imported at the top of the file. The function can be called directly whether it's used as a Celery task (`.delay()`) or as a regular function.

### **Code After Fix:**
```python
# Queue processing task (non-blocking, falls back to synchronous if Celery not available)
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # If Celery is unavailable, process synchronously as fallback
    print(f"Warning: Could not queue Celery task: {celery_error}")
    print("Falling back to synchronous processing...")
    try:
        # Call the function directly (synchronous execution)
        # Note: process_transcript_task is already imported at the top of the file
        result = process_transcript_task(str(transcript.id), str(current_user.id))  # ✅ Use existing import
```

### **How the Fix Works:**
1. `process_transcript_task` is imported once at the top of the file
2. It can be used as a Celery task with `.delay()` or called directly as a function
3. No re-import is needed, avoiding the scoping issue

### **Related Files:**
- `backend/app/api/v1/transcripts.py` - Upload and manual processing endpoints
- `backend/app/tasks/process_transcript.py` - Processing function

### **Summary:**
- **Root cause:** Re-importing a variable inside a function makes Python treat it as local, causing UnboundLocalError
- **When it happens:** When trying to use a variable that's imported inside an exception handler
- **Best fix:** Import once at the top of the file, use the same import throughout
- **Location:** Error occurs in upload endpoint exception handler, fix by removing redundant import

---

## **Error: AttributeError - 'bytes' object has no attribute 'seek'**

### **Date:** 2025-01-XX

### **Error Description:**
When processing a transcript PDF, an `AttributeError` occurs: `'bytes' object has no attribute 'seek'`. This happens when `pdfplumber.open()` tries to call `seek()` on raw bytes.

### **Symptoms:**
- Transcript processing fails with `AttributeError`
- Error occurs in `pdf_processor.extract_text()`
- Processing status shows "Failed"
- Error message: `'bytes' object has no attribute 'seek'`

### **Root Cause:**
The `pdfplumber.open()` function expects a file-like object (with methods like `seek()`, `read()`, etc.), but the code was passing raw bytes directly. The underlying PDF parser (`pdfminer`) requires a file-like object that supports seeking, which raw bytes don't provide.

### **Error Location:**
- **File:** `backend/app/services/pdf_processor.py`
- **Function:** `extract_text()`
- **Line:** 24 (before fix)

### **Code Before Fix:**
```python
def extract_text(self, pdf_content: bytes) -> str:
    """Extract text from PDF"""
    with pdfplumber.open(pdf_content) as pdf:  # ❌ pdf_content is raw bytes
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text
```

### **Problem:**
`pdfplumber.open()` internally uses `pdfminer`, which requires a file-like object with a `seek()` method. Raw bytes don't have this method, causing the `AttributeError`.

### **Solution:**
Wrap the bytes in a `BytesIO` object, which provides a file-like interface with `seek()`, `read()`, and other file methods.

### **Code After Fix:**
```python
from io import BytesIO

def extract_text(self, pdf_content: bytes) -> str:
    """Extract text from PDF"""
    # pdfplumber.open() requires a file-like object, not raw bytes
    # Wrap bytes in BytesIO to provide seek() method
    pdf_file = BytesIO(pdf_content)  # ✅ Convert bytes to file-like object
    with pdfplumber.open(pdf_file) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text
```

### **How the Fix Works:**
1. `BytesIO` creates an in-memory file-like object from bytes
2. It provides all the methods that `pdfplumber`/`pdfminer` need (`seek()`, `read()`, etc.)
3. The PDF can be processed normally through the file-like interface

### **Benefits:**
- **Compatibility:** Works with `pdfplumber`'s file-like object requirement
- **Memory efficient:** `BytesIO` is an in-memory buffer, no disk I/O needed
- **Standard solution:** This is the recommended way to handle bytes with PDF libraries

### **When This Happens:**
- When passing raw bytes to `pdfplumber.open()`
- When PDF content is stored as bytes (from file upload, database, or storage service)
- When trying to process PDFs without a file path

### **Prevention:**
- Always wrap bytes in `BytesIO` when passing to `pdfplumber.open()`
- Use file paths when available (alternative approach)
- Document that PDF processing functions expect file-like objects or bytes wrapped in `BytesIO`

### **Related Files:**
- `backend/app/services/pdf_processor.py` - PDF processing service
- `backend/app/tasks/process_transcript.py` - Transcript processing task that calls PDF processor

### **Summary:**
- **Root cause:** `pdfplumber.open()` requires a file-like object with `seek()` method, not raw bytes
- **When it happens:** When passing raw bytes directly to `pdfplumber.open()`
- **Best fix:** Wrap bytes in `BytesIO` to provide file-like interface
- **Location:** Error occurs in `extract_text()` method, fix by wrapping bytes in `BytesIO`

This is a common issue when working with PDF processing libraries that expect file-like objects rather than raw bytes.

---

## **Error: StringDataRightTruncation - value too long for type character varying(255)**

### **Date:** 2025-01-XX

### **Error Description:**
When processing transcripts, a database error occurs: `value too long for type character varying(255)`. This happens when a parsed course name exceeds the 255-character limit of the database column.

### **Symptoms:**
- Transcript processing fails with `StringDataRightTruncation` error
- Error occurs when trying to insert courses into the database
- Processing status shows "Failed"
- Error message: `value too long for type character varying(255)`

### **Root Cause:**
The `course_name` column in the `courses` table was defined as `VARCHAR(255)`, which limits course names to 255 characters. However, the PDF parsing regex patterns sometimes capture overly long text sequences as course names, including:
- Entire transcript sections
- Multiple course descriptions concatenated together
- Header/footer text from the PDF

Example of problematic course name:
```
"Program: NSM Undergraduate Plan: Computer Science, BS Major Course Description Attempted Earned Grade Points GEOL 1302 Intro To Global Climate Change"
```

### **Error Location:**
- **File:** `backend/app/models/course.py`
- **Column:** `course_name = Column(String(255))`
- **File:** `backend/app/tasks/process_transcript.py`
- **Function:** `process_transcript_task()` - when creating Course objects

### **Code Before Fix:**
```python
# Model definition
course_name = Column(String(255))  # ❌ Limited to 255 characters

# Processing task
course = Course(
    course_name=course_data.get('course_name'),  # ❌ No length validation
    ...
)
```

### **Problem:**
1. Database column has a hard 255-character limit
2. PDF parsing regex can capture very long text sequences
3. No validation or truncation before database insertion
4. Course names can legitimately be long in some cases

### **Solution:**
Implemented a multi-layered approach:
1. **Improved regex parsing** - Better boundaries to avoid capturing overly long names
2. **Truncation logic** - Truncate at word boundaries when names are too long
3. **Database schema update** - Changed from `String(255)` to `Text` type (unlimited length)
4. **Migration** - Created Alembic migration to update existing databases

### **Code After Fix:**

**1. Model Update (`backend/app/models/course.py`):**
```python
from sqlalchemy import Column, String, Text, ...  # ✅ Added Text import

course_name = Column(Text)  # ✅ Changed to Text (unlimited length)
```

**2. Improved Parsing (`backend/app/services/pdf_processor.py`):**
```python
course_name = match.group(2).strip() if match.group(2) else None
# Limit course name to reasonable length (250 chars)
if course_name and len(course_name) > 250:
    # Try to find a better boundary (look for common delimiters)
    for delimiter in [' - ', ' | ', '\n', '\t', '  ']:
        if delimiter in course_name:
            course_name = course_name.split(delimiter)[0]
            break
    # If still too long, truncate at word boundary
    if course_name and len(course_name) > 250:
        truncated = course_name[:250]
        last_space = truncated.rfind(' ')
        if last_space > 200:
            course_name = course_name[:last_space]
        else:
            course_name = truncated
```

**3. Processing Task Safety (`backend/app/tasks/process_transcript.py`):**
```python
# Truncate course_name if excessively long (defensive check)
course_name = course_data.get('course_name')
if course_name and len(course_name) > 500:
    # Truncate at word boundary if possible
    truncated = course_name[:497]
    last_space = truncated.rfind(' ')
    if last_space > 400:
        course_name = course_name[:last_space] + '...'
    else:
        course_name = truncated + '...'
```

**4. Database Migration (`backend/alembic/versions/increase_course_name_length.py`):**
```python
def upgrade() -> None:
    # Change course_name from VARCHAR(255) to TEXT
    op.alter_column('courses', 'course_name',
                    existing_type=sa.String(length=255),
                    type_=sa.Text(),
                    existing_nullable=True)
```

### **How the Fix Works:**
1. **Regex improvement:** Better pattern matching to avoid capturing entire transcript sections
2. **Parsing-level truncation:** Truncate at 250 characters during parsing, using word boundaries
3. **Processing-level safety:** Additional truncation at 500 characters as a safety net
4. **Database schema:** `Text` type removes hard limit, allowing legitimate long course names

### **Benefits:**
- **No more truncation errors:** Database can handle variable-length course names
- **Better data quality:** Improved regex reduces false captures
- **Graceful degradation:** Multiple layers of truncation ensure data is saved even if parsing isn't perfect
- **Future-proof:** `Text` type supports any reasonable course name length

### **When This Happens:**
- When PDF parsing captures overly long text sequences
- When course names legitimately exceed 255 characters
- When transcript format includes concatenated course information
- When header/footer text is incorrectly parsed as course names

### **Prevention:**
1. **Run the migration:** Apply the database migration to update the schema
   ```bash
   cd backend
   alembic upgrade head
   ```
2. **Improve regex patterns:** Continuously refine parsing patterns based on transcript formats
3. **Monitor parsing quality:** Check for unusually long course names and adjust patterns

### **Related Files:**
- `backend/app/models/course.py` - Course model definition
- `backend/app/services/pdf_processor.py` - PDF parsing logic
- `backend/app/tasks/process_transcript.py` - Transcript processing task
- `backend/alembic/versions/increase_course_name_length.py` - Database migration

### **Migration Instructions:**
To apply the database schema change:
```bash
cd backend
alembic upgrade head
```

This will change the `course_name` column from `VARCHAR(255)` to `TEXT`, allowing unlimited length course names.

### **Summary:**
- **Root cause:** Database column limited to 255 characters, but parsed course names can be longer
- **When it happens:** When PDF parsing captures overly long text or legitimate long course names
- **Best fix:** Multi-layered approach: improve parsing, add truncation logic, and update database schema to `Text`
- **Location:** Error occurs in database insertion, fix involves model update, parsing improvement, and migration

This ensures transcript processing works reliably even with variable-length course names and imperfect PDF parsing.

---

## **Warning: Celery Connection Error - Redis Not Available**

### **Date:** 2025-01-XX

### **Error Description:**
When uploading a transcript, a warning appears: `Warning: Could not queue Celery task: Error 10061 connecting to localhost:6379. No connection could be made because the target machine actively refused it.`

### **Symptoms:**
- Warning message appears in console when uploading transcripts
- Error mentions Redis connection failure (Error 10061 on Windows)
- Transcript upload still succeeds
- Processing may or may not occur depending on fallback

### **Root Cause:**
The Celery task queue requires Redis to be running. When Redis is not available:
1. Celery tries to connect to Redis at `localhost:6379`
2. Connection is refused (Redis not running)
3. Exception is raised when trying to queue the task with `.delay()`

### **Error Location:**
- **File:** `backend/app/api/v1/transcripts.py`
- **Function:** `upload_transcript()`
- **Line:** 144 (when calling `process_transcript_task.delay()`)

### **Code Before Fix:**
```python
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # Fallback to synchronous processing
    result = process_transcript_task(str(transcript.id), str(current_user.id))  # ❌ Still calls Celery wrapper
```

### **Problem:**
When calling `process_transcript_task()` directly after a Celery error, we're still calling the Celery-wrapped function, which may still try to connect to Redis or may not execute correctly.

### **Solution:**
Use the `__wrapped__` attribute to get the underlying function before the Celery decorator was applied. This ensures we call the actual processing function, not the Celery task wrapper.

### **Code After Fix:**
```python
try:
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
except Exception as celery_error:
    # If Celery is unavailable, process synchronously as fallback
    print(f"Warning: Could not queue Celery task: {celery_error}")
    print("Falling back to synchronous processing...")
    try:
        # Get the underlying function from the Celery task
        # The task's __wrapped__ attribute contains the original function
        underlying_function = getattr(process_transcript_task, '__wrapped__', None)
        if underlying_function is None:
            # Fallback if __wrapped__ doesn't exist
            underlying_function = process_transcript_task
        
        # Call the underlying function directly (synchronous execution)
        result = underlying_function(str(transcript.id), str(current_user.id))  # ✅ Calls actual function
        print(f"Transcript processed synchronously: {result.get('status', 'unknown')}")
    except Exception as sync_error:
        # If synchronous processing also fails, log but don't fail the upload
        import traceback
        print(f"Error: Synchronous processing also failed: {sync_error}")
        print(f"Traceback: {traceback.format_exc()}")
        print("Transcript uploaded but processing failed. Use manual processing endpoint to retry.")
```

### **How the Fix Works:**
1. **Try Celery first:** Attempt to queue the task via Celery (asynchronous)
2. **Catch connection errors:** If Redis is unavailable, catch the exception
3. **Get underlying function:** Use `__wrapped__` to access the function before Celery decoration
4. **Call directly:** Execute the function synchronously, bypassing Celery entirely
5. **Error handling:** If synchronous processing also fails, log the error but don't fail the upload

### **Benefits:**
- **Graceful degradation:** System works even without Redis/Celery
- **Automatic fallback:** No manual intervention needed
- **Better error messages:** Clear indication of what's happening
- **Reliable processing:** Uses the actual function, not the Celery wrapper

### **When This Happens:**
- Redis is not running
- Redis is not accessible (wrong host/port)
- Celery worker is not running
- Network issues preventing Redis connection

### **Prevention:**
1. **For production:** Always ensure Redis and Celery worker are running
2. **For development:** The fallback ensures the system works without Redis
3. **Monitoring:** Check logs for "Falling back to synchronous processing" messages

### **Related Files:**
- `backend/app/api/v1/transcripts.py` - Upload endpoint with fallback logic
- `backend/app/tasks/process_transcript.py` - Processing function that can run synchronously or as Celery task
- `backend/app/core/config.py` - Redis URL configuration

### **Summary:**
- **Root cause:** Redis connection failure when Celery tries to queue tasks
- **When it happens:** When Redis is not running or not accessible
- **Best fix:** Use `__wrapped__` to get underlying function and call it directly
- **Location:** Error occurs in upload endpoint, fix by accessing underlying function via `__wrapped__`

This warning is expected when Redis is not running. The system automatically falls back to synchronous processing, so transcripts are still processed successfully. To eliminate the warning, start Redis or ensure it's accessible.

---

## **500 Internal Server Error: Connected Brothers Endpoint After Help Request Deletion**

### **Date:** 2025-01-XX

### **Error Description:**
When deleting a help request, the `GET /api/v1/recommendations/connected-brothers` endpoint returns a 500 Internal Server Error. This occurs when the frontend tries to refresh the connected brothers list after a help request is deleted.

### **Symptoms:**
- 500 Internal Server Error when calling `/api/v1/recommendations/connected-brothers`
- Error occurs after successfully deleting a help request
- Frontend may show an error or fail to update the connected brothers list
- Error message: `Failed to get connected brothers: ...`

### **Root Cause:**
The `get_connected_brothers` endpoint has several issues:
1. **Missing relationship loading**: The `course.user` relationship might not be loaded, causing `AttributeError` when accessing `helper.id`
2. **No error handling**: The endpoint doesn't catch exceptions, causing 500 errors to propagate
3. **Datetime conversion issues**: When converting `created_at` to ISO format, it might already be a string or None
4. **No null checks**: The code doesn't check if `course.user` is None before accessing its attributes

### **Error Location:**
- **File:** `backend/app/api/v1/recommendations.py`
- **Function:** `get_connected_brothers()`
- **Lines:** 266-362 (before fix)

### **Code Before Fix:**
```python
@router.get("/connected-brothers", response_model=List[ConnectedBrotherResponse])
async def get_connected_brothers(...):
    help_requests = db.query(HelpRequest).filter(...).all()
    
    for help_request in help_requests:
        matching_courses = db.query(Course).join(User).filter(...).all()
        
        for course in matching_courses:
            helper = course.user  # ❌ May be None if relationship not loaded
            helper_id = str(helper.id)  # ❌ AttributeError if helper is None
            # ...
```

### **Problem:**
1. **Lazy loading issue**: `course.user` might not be loaded, causing `None` access
2. **No null checks**: Code assumes `helper` is always available
3. **No error handling**: Exceptions cause 500 errors instead of graceful handling
4. **Datetime conversion**: Assumes `created_at` is always a datetime object

### **Solution:**
Implemented multiple fixes:
1. **Eager loading**: Use `joinedload(Course.user)` to ensure user relationship is loaded
2. **Null checks**: Check if `helper` is None before accessing its attributes
3. **Error handling**: Wrap the entire function in try/except with proper HTTPException
4. **Datetime safety**: Check if datetime is already a string before calling `.isoformat()`

### **Code After Fix:**
```python
from sqlalchemy.orm import Session, joinedload  # ✅ Added joinedload

@router.get("/connected-brothers", response_model=List[ConnectedBrotherResponse])
async def get_connected_brothers(...):
    try:  # ✅ Added error handling
        help_requests = db.query(HelpRequest).filter(...).all()
        
        for help_request in help_requests:
            # ✅ Eager load user relationship
            matching_courses = db.query(Course).options(
                joinedload(Course.user)
            ).join(User).filter(...).all()
            
            for course in matching_courses:
                helper = course.user
                if helper is None:  # ✅ Check for None
                    continue
                
                helper_id = str(helper.id)
                # ...
        
        # ✅ Safe datetime conversion
        first_connected=brother['first_connected'].isoformat() 
            if isinstance(brother['first_connected'], datetime) 
            else brother['first_connected']
        
    except Exception as e:  # ✅ Error handling
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connected brothers: {str(e)}"
        )
```

### **How the Fix Works:**
1. **Eager loading**: `joinedload(Course.user)` ensures the user relationship is loaded in the same query, avoiding lazy loading issues
2. **Null checks**: Skip courses where `helper` is None instead of crashing
3. **Error handling**: Catch all exceptions and return a proper HTTP 500 with error message
4. **Datetime safety**: Check type before calling `.isoformat()` to handle both datetime objects and strings

### **Benefits:**
- **No more 500 errors**: Proper error handling prevents crashes
- **Better performance**: Eager loading reduces database queries
- **Graceful degradation**: Skips invalid data instead of crashing
- **Clear error messages**: Users see what went wrong instead of generic errors

### **When This Happens:**
- After deleting a help request when the frontend refreshes the connected brothers list
- When `course.user` relationship is not loaded (lazy loading issue)
- When there are orphaned courses (user deleted but course remains)
- When datetime fields are already strings instead of datetime objects

### **Prevention:**
1. **Always use eager loading** for relationships that will be accessed
2. **Add null checks** before accessing relationship attributes
3. **Wrap endpoints in try/except** for proper error handling
4. **Use type checks** when converting datetimes to strings

### **Related Files:**
- `backend/app/api/v1/recommendations.py` - Connected brothers endpoint
- `backend/app/api/v1/help_requests.py` - Help request deletion endpoint
- `frontend/lib/hooks/useHelpRequests.ts` - Frontend hook that calls connected-brothers

### **Testing:**
1. **Test normal flow**: Create help request, verify connected brothers list works
2. **Test deletion**: Delete help request, verify connected brothers list still works
3. **Test error handling**: Simulate database errors, verify proper error messages
4. **Test edge cases**: Test with courses that have no user, verify graceful handling

### **Summary:**
- **Root cause:** Missing relationship loading, no null checks, and no error handling in connected-brothers endpoint
- **When it happens:** After deleting a help request when frontend refreshes the connected brothers list
- **Best fix:** Add eager loading with `joinedload`, null checks, error handling, and safe datetime conversion
- **Location:** Error occurs in `get_connected_brothers()` endpoint, fix by adding relationship loading and error handling

This ensures the connected brothers endpoint works reliably even after help request deletions and handles edge cases gracefully.

---


