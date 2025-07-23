# 🔐 Google OAuth Setup Guide

## Quick Setup (5 minutes)

### 1. **Go to Google Cloud Console**
Visit: https://console.cloud.google.com/

### 2. **Create/Select a Project**
- Click "Select a project" → "New Project"
- Name it "Global Note Taker" or similar
- Click "Create"

### 3. **Enable Required APIs**
- In the sidebar, go to **"APIs & Services"** → **"Library"**
- Search and enable these APIs:
  - **Google Docs API** ✅
  - **Google Drive API** ✅

### 4. **Create OAuth Credentials**
- Go to **"APIs & Services"** → **"Credentials"**
- Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
- If prompted, configure the OAuth consent screen:
  - Choose **"External"** (unless you have G Workspace)
  - Fill in app name: "Global Note Taker"
  - Add your email as developer contact
  - Save and continue through the steps
- Back to creating credentials:
  - Application type: **"Desktop application"**
  - Name: "Global Note Taker Desktop"
  - Click **"Create"**

### 5. **Get Your Credentials**
- Copy the **Client ID** and **Client Secret**
- Download the JSON file (optional backup)

### 6. **Update Your .env File**
```bash
# Open your .env file and add:
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 7. **Test the Setup**
```bash
npm run dev
```
- Open the app (⌘+Shift+N)
- Click the ⚙️ settings icon
- Click "Connect to Google Drive"
- You should see the Google OAuth flow!

## 🚨 Common Issues

### "Missing required parameter: client_id"
- ✅ **Fixed!** Your `.env` file is missing or has wrong values
- Check that your `.env` has the correct variables
- Restart the app after editing `.env`

### "OAuth consent screen not configured"
- Set up the OAuth consent screen in Google Cloud Console
- Add your email as a test user if needed

### "Invalid client_id"
- Double-check your client ID from Google Cloud Console
- Make sure there are no extra spaces or quotes

## 🎯 What Happens Next

1. **OAuth Flow**: Opens browser → Google login → Grants permissions
2. **Token Storage**: Securely saves access tokens locally
3. **Document Setup**: Configure which Google Doc to sync to
4. **Auto Sync**: All notes automatically append to your chosen document!

---

**That's it!** Your Global Note Taker will now sync to Google Docs automatically. 🎉 