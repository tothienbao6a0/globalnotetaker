# Setup Guide for Public Repository 🔧

Since this is a **public repository**, you'll need to set up your own Google OAuth credentials for security reasons.

## 🎯 **Why This Setup is Needed:**

- **Security**: Can't store client secrets in public code
- **Rate Limits**: Each user gets their own API quotas  
- **Control**: You manage your own Google Cloud project

## 📋 **Step-by-Step Setup:**

### **Step 1: Create Google Cloud Project**

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com)
2. **Create a new project** or select an existing one
3. **Note your project ID** for later

### **Step 2: Enable Google Docs API**

1. **Navigate to**: APIs & Services → Library
2. **Search for**: "Google Docs API"
3. **Click Enable**
4. **Also enable**: "Google Drive API" (needed for file access)

### **Step 3: Create OAuth Credentials**

1. **Go to**: APIs & Services → Credentials
2. **Click**: "Create Credentials" → "OAuth 2.0 Client IDs"
3. **Application type**: Desktop Application
4. **Name**: "Global Note Taker" (or anything you want)
5. **Download** the JSON file

### **Step 4: Configure Your App**

**Option A: Environment Variables (Recommended)**
```bash
export GOOGLE_CLIENT_ID="your-client-id-here"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

**Option B: .env File**
```bash
# Create .env file in project root
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### **Step 5: Extract Credentials from JSON**

From your downloaded JSON file:
```json
{
  "installed": {
    "client_id": "123456789-abcdef.apps.googleusercontent.com",
    "client_secret": "GOCSPX-your-secret-here",
    ...
  }
}
```

Use these values in your environment variables or `.env` file.

## 🚀 **Run the App:**

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run dist:mac
```

## 🔒 **Security Best Practices:**

1. **Keep `.env` private** - Never commit it to git
2. **Use different projects** for dev/production
3. **Rotate credentials** if compromised
4. **Limit OAuth scopes** to only what you need

## ⚠️ **Important Notes:**

- **Personal Use**: This setup is perfect for personal use
- **Distribution**: If sharing the built app, users need their own credentials
- **Rate Limits**: Google APIs have daily quotas per project

## 🆘 **Troubleshooting:**

### **Error: "GOOGLE_CLIENT_SECRET is required"**
- Check your environment variables are set
- Verify `.env` file exists and has correct format
- Restart the app after setting variables

### **OAuth Error: "redirect_uri_mismatch"**  
- Make sure you selected "Desktop Application" type
- The app handles redirects automatically

### **API Access Denied**
- Verify both Google Docs API and Google Drive API are enabled
- Check your OAuth consent screen is configured

## 💡 **Alternative: Use Original Developer's Credentials**

If you trust the original developer and this is for personal use only, you can:

1. Contact the repository owner for their credentials
2. Use them in your `.env` file (not recommended for public distribution)

But creating your own is **always more secure**! 🛡️

---

**Need help?** Open an issue on the repository! 🚀 