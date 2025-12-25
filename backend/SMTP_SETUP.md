# SMTP Configuration Guide

## Quick Setup for Gmail

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** → **Other (Custom name)**
3. Enter "NuPeer" → Click **Generate**
4. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Create `.env` File
Create a file named `.env` in the `backend/` directory with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=azmayen.murshid@gmail.com
SMTP_PASSWORD=your-16-character-app-password-here
SMTP_FROM_EMAIL=azmayen.murshid@gmail.com
SMTP_FROM_NAME=NuPeer
SMTP_USE_TLS=True
```

**Important:** 
- Replace `your-16-character-app-password-here` with the actual App Password from Step 2
- Remove spaces from the App Password (e.g., `abcdefghijklmnop`)

### Step 4: Restart Backend
Restart your backend server for changes to take effect.

## Testing

1. Log in to NuPeer
2. Go to **Profile → Settings**
3. Scroll to **Email Notifications**
4. Click **"Send Test Email"**
5. Check your inbox at `azmayen.murshid@gmail.com`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=NuPeer
SMTP_USE_TLS=True
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@yahoo.com
SMTP_FROM_NAME=NuPeer
SMTP_USE_TLS=True
```

## Troubleshooting

- **"Failed to send test email"**: Check that you're using an App Password, not your regular password
- **"SMTP not configured"**: Make sure `.env` file exists in `backend/` directory
- **Connection errors**: Check firewall settings for port 587

