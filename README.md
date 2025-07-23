# Global Note Taker 📝

A lightweight desktop note-taking app that syncs with Google Docs. Features a global keyboard shortcut to quickly capture thoughts without interrupting your workflow.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/electron-v28-blue)

## ✨ **Features:**

- 🎯 **Global keyboard shortcut** - `⌘+Shift+N` (macOS) or `Ctrl+Shift+N` (Windows/Linux)
- 📝 **Rich text editor** - Bold, italics, headings, and more
- ☁️ **Google Docs sync** - Automatically save to your Google Drive
- 🎨 **Apple-native UI** - Clean, minimal design that feels at home on macOS
- 🔒 **Private & secure** - Your notes, your Google Drive, your control
- ⚡ **Lightweight** - Minimal resource usage, stays out of your way
- 🌙 **Panel-style window** - Appears over fullscreen apps without disrupting your flow

## 🚀 **Quick Start:**

### **1. Clone and Install:**
```bash
git clone https://github.com/yourusername/globalnotetaker.git
cd globalnotetaker
npm install
```

### **2. Set Up Google OAuth:**
Since this is a public repository, you'll need your own Google credentials for security:

📋 **[Follow the detailed setup guide →](SETUP.md)**

### **3. Run the App:**
```bash
# Development
npm run dev

# Build for production  
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## 🎯 **How It Works:**

1. **Press the global shortcut** anywhere on your system
2. **Write your thoughts** in the rich text editor
3. **Auto-saves locally** as you type
4. **Sync to Google Docs** with `⌘+Shift+Enter` (or `Ctrl+Shift+Enter`)
5. **Hide with Escape** or click away - your notes are saved

## 🛡️ **Security & Privacy:**

- ✅ **Your data stays yours** - Notes sync to YOUR Google Drive only
- ✅ **No hardcoded secrets** - You provide your own Google OAuth credentials
- ✅ **Local encryption** - Notes cached securely on your device
- ✅ **No telemetry** - We don't track anything

📖 **[Read the full Security Guide →](SECURITY.md)**

## ⚙️ **Configuration:**

### **Keyboard Shortcuts:**
- `⌘+Shift+N` / `Ctrl+Shift+N` - Toggle app visibility (global)
- `⌘+S` / `Ctrl+S` - Save note locally
- `⌘+Shift+Enter` / `Ctrl+Shift+Enter` - Save as new section to Google Docs
- `⌘+Shift+I` / `Ctrl+Shift+I` - Toggle developer console
- `Escape` - Hide app

### **Rich Text Features:**
- **Bold** - `⌘+B` / `Ctrl+B`
- *Italic* - `⌘+I` / `Ctrl+I`
- # Headings - `⌘+Alt+1-3` / `Ctrl+Alt+1-3`
- ~~Strikethrough~~ - Available in toolbar
- Bullet lists and more

## 🔧 **Development:**

### **Tech Stack:**
- **Electron** - Cross-platform desktop framework
- **React** - UI framework with TypeScript
- **Tiptap** - Rich text editor
- **Tailwind CSS** - Styling with shadcn/ui components
- **Google APIs** - Docs and Drive integration

### **Project Structure:**
```
globalnotetaker/
├── src/                 # React frontend
├── electron/            # Electron main process
├── dist/               # Built files
├── release/            # Distribution packages
└── docs/               # Documentation
```

### **Build Scripts:**
```bash
npm run dev             # Development with hot reload
npm run build           # Build for production
npm run dist            # Build and package
npm run dist:mac        # macOS DMG
npm run dist:win        # Windows installer
npm run dist:linux      # Linux AppImage
```

## 🤝 **Contributing:**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📋 **Requirements:**

- **Node.js** 18+ and npm
- **macOS** 10.12+, **Windows** 10+, or **Linux** (Ubuntu 18.04+)
- **Google account** for sync functionality

## 🐛 **Troubleshooting:**

### **Common Issues:**

**"GOOGLE_CLIENT_SECRET is required"**
- Follow the [setup guide](SETUP.md) to create your Google OAuth app

**App won't build on Apple Silicon**
- Make sure you're using Node.js 18+ for ARM64 compatibility

**Global shortcut not working**
- Check if another app is using the same shortcut
- Try running with `sudo` on Linux for global shortcut access

**Google OAuth redirect error**
- Ensure you selected "Desktop Application" when creating OAuth credentials

## 📄 **License:**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments:**

- Built with [Electron](https://www.electronjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Rich text editing powered by [Tiptap](https://tiptap.dev/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Made with ❤️ for productivity enthusiasts**

*Perfect for developers, writers, and anyone who needs to quickly capture thoughts without breaking their flow.* 