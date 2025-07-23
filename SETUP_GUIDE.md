# 🚀 Global Note Taker - Google Docs Integration Setup

Your app has been enhanced to sync all notes to a **specific Google Doc** that you choose!

## ✨ New Features Added

- **Settings Dialog**: Configure your target Google Doc URL
- **URL Validation**: Verify document access before saving
- **Visual Status**: See sync status in the title bar
- **Centralized Notes**: All notes append to YOUR chosen document

## 🔧 Quick Setup (3 steps)

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google Docs API** and **Google Drive API**
4. Create OAuth 2.0 credentials (Desktop application)
5. Add `http://localhost:3000/auth/callback` to redirect URIs

### 2. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your credentials
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 3. Set Up Your Target Document

1. **Start the app**: `npm run dev`
2. **Open settings**: Click the ⚙️ gear icon in the title bar
3. **Connect Google Drive**: Click "Connect to Google Drive"
4. **Set target document**:
   - Create a Google Doc or use existing one
   - Copy the URL (e.g., `https://docs.google.com/document/d/1ABC.../edit`)
   - Paste it in the settings dialog
   - Click "Validate URL" to test access
   - Click "Save Settings"

## 📝 How It Works Now

1. **Press `⌘+Shift+N`** (Mac) or `Ctrl+Shift+N` (Windows/Linux)
2. **Type your note** - it auto-saves locally after 1 second
3. **Automatic Google Sync** - if enabled, notes append to your chosen doc with timestamps
4. **Visual Feedback** - green cloud ☁️ means syncing, gray means offline

## 🎯 Note Format in Google Docs

Each note is appended with:
```
--- [timestamp] ---
Your note content here
```

## 💡 Pro Tips

- **Create a dedicated "Quick Notes" Google Doc** for this app
- **Share the doc** with collaborators for team note-taking
- **Use the validation button** to test document access
- **Local backup**: Notes are always saved locally even without internet

## 🔄 Sync Status Indicators

- 🟢 **Green Cloud**: Connected and syncing
- ⚫ **Gray Cloud**: Offline or sync disabled
- **"Saving..."**: Currently syncing to Google Docs
- **"Saved X ago"**: Last successful sync time

## 🛠️ Development Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run dist        # Package for distribution
```

---

**Ready to use!** Press your global shortcut and start taking notes that automatically sync to your chosen Google Doc! 🎉 