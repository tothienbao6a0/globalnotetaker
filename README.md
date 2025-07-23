# Global Note Taker

A lightweight desktop notepad app that can be triggered anytime with a global keyboard shortcut. Perfect for fast idea capture without switching context — like a sticky note that lives in the cloud.

## ✨ Features

- **Global Keyboard Shortcut**: Trigger with `⌘+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows/Linux)
- **Minimal, Distraction-Free UI**: Clean interface built with shadcn/ui components
- **Auto-sync to Google Docs**: Automatically saves notes to your Google Drive
- **Cross-platform**: Works on Mac, Windows, and Linux
- **Offline Support**: Notes are saved locally and synced when online
- **Custom Google Doc Integration**: 
  - **Your Choice**: Specify any Google Doc URL to sync notes to
  - **Centralized**: All notes append to your chosen document with timestamps
  - **Validation**: Built-in URL validation ensures document access

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Console account (for Google Docs integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd globalnotetaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth (Required for sync)**
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable the following APIs:
      - Google Docs API
      - Google Drive API
   
   d. Create OAuth 2.0 credentials:
      - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
      - Application type: "Desktop application"
      - Add `http://localhost:3000/auth/callback` to authorized redirect URIs
   
   e. Copy `env.example` to `.env` and fill in your credentials:
      ```bash
      cp env.example .env
      ```
      
      Edit `.env`:
      ```
      VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
      VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
      ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The app will open automatically. Press `⌘+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows/Linux) to toggle the note window.

## 📱 Usage

### Basic Note Taking
1. Press the global shortcut to open the note window
2. Start typing your note
3. Notes are auto-saved locally after 1 second of inactivity
4. Press `Escape` or click the X button to hide the window

### Google Docs Sync Setup
1. **Open Settings**: Click the ⚙️ gear icon in the app's title bar
2. **Connect to Google Drive**: Complete the OAuth flow in your browser
3. **Choose Your Document**: 
   - Create a new Google Doc or use an existing one
   - Copy the document URL (e.g., `https://docs.google.com/document/d/1ABC.../edit`)
   - Paste it in the settings dialog
4. **Validate & Save**: Click "Validate URL" to test access, then "Save Settings"

### How Notes Are Synced

All notes are **appended** to your chosen Google Doc with timestamps:

```
--- 1/23/2024, 2:30:15 PM ---
Your note content here

--- 1/23/2024, 2:45:30 PM ---
Another note here
```

This creates a chronological log of all your quick notes in one central document that you can share, organize, or search through.

## 🛠️ Development

### Project Structure

```
globalnotetaker/
├── electron/           # Main Electron process
│   ├── main.ts        # Main application logic
│   ├── preload.ts     # Secure IPC bridge
│   └── googleSync.ts  # Google Drive integration
├── src/               # React renderer process
│   ├── components/    # shadcn/ui components
│   ├── services/      # Google API services
│   ├── App.tsx        # Main React component
│   └── main.tsx       # React entry point
└── dist/              # Built application
```

### Available Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production
- `npm run dist` - Build and package for distribution
- `npm run dist:mac` - Build for macOS
- `npm run dist:win` - Build for Windows
- `npm run dist:linux` - Build for Linux

### Building for Distribution

```bash
# Build for current platform
npm run dist

# Or build for specific platforms
npm run dist:mac     # macOS
npm run dist:win     # Windows
npm run dist:linux   # Linux
```

## 🎯 Architecture

The app follows a secure Electron architecture:

- **Main Process** (`electron/main.ts`): Handles window management, global shortcuts, and system integration
- **Renderer Process** (`src/`): React-based UI with shadcn/ui components
- **Preload Script** (`electron/preload.ts`): Secure bridge between main and renderer processes
- **Google Services** (`src/services/`): Handles OAuth and Google Docs API integration

## 🔧 Configuration

### Global Shortcuts
- **Toggle Window**: `⌘+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows/Linux)
- **Hide Window**: `Escape` (when focused)
- **Settings**: Click ⚙️ gear icon in title bar

### Window Behavior
- Always on top when visible
- Auto-hides when losing focus (except in development)
- Frameless, translucent design
- Remembers position between sessions

## 🛡️ Security

- No `nodeIntegration` in renderer process
- Context isolation enabled
- Secure IPC communication through preload script
- OAuth tokens stored securely using `electron-store`

## 📋 Roadmap

- [ ] Markdown support with live preview
- [ ] Multiple target documents (folders/categories)
- [ ] Offline queue for sync when disconnected
- [ ] AI-powered note summaries
- [ ] Multiple note tabs/windows
- [ ] Custom themes and appearance settings
- [ ] Full-text search across synced documents
- [ ] Integration with other cloud providers
- [ ] Team collaboration with shared documents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) and [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Google integration via [Google APIs](https://developers.google.com/docs/api)

---

**Happy note taking! 📝** 