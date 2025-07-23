import { app, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { GoogleSyncManager } from './googleSync';

// Load environment variables from .env file
import * as dotenv from 'dotenv';
const envResult = dotenv.config();
if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
} else {
  console.log('Environment variables loaded successfully');
}

// Initialize electron store for persistent settings
const store = new Store();

class GlobalNoteTaker {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  private syncManager: GoogleSyncManager | null = null;

  constructor() {
    this.createWindow = this.createWindow.bind(this);
    this.toggleWindow = this.toggleWindow.bind(this);
  }

  async createWindow(): Promise<void> {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Create the browser window with minimal, floating design
    this.mainWindow = new BrowserWindow({
      width: 380,
      height: 420,
      x: Math.round((width - 380) / 2),
      y: Math.round((height - 420) / 3),
      frame: true,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 },
      transparent: false,
      backgroundColor: '#ffffff',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      minimizable: true,
      maximizable: false,
      fullscreenable: false,
      movable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,

        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // Load the app
    const isDev = process.argv.includes('--dev');
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }

    // Hide window instead of closing
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Focus and show window when ready
    this.mainWindow.once('ready-to-show', () => {
      // Show without focus initially to not interrupt other apps
      this.mainWindow?.showInactive();
      
      // Set window to appear over fullscreen apps (macOS)
      if (process.platform === 'darwin') {
        // Use the highest possible level to appear over fullscreen apps
        // 'screen-saver' is only 101, but we need 1000+ for fullscreen
        this.mainWindow?.setAlwaysOnTop(true, 'screen-saver', 1000);
      }
      
      // Initialize sync manager
      this.syncManager = new GoogleSyncManager(this.mainWindow);
    });

    // Auto-hide when window loses focus (except when dev tools are open)
    this.mainWindow.on('blur', () => {
      if (!isDev && this.mainWindow && !this.mainWindow.webContents.isDevToolsOpened()) {
        this.mainWindow.hide();
      }
    });
  }

  toggleWindow(): void {
    if (!this.mainWindow) {
      this.createWindow();
      return;
    }

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      // Show without focus to not interrupt fullscreen apps
      this.mainWindow.showInactive();
      
      // Ensure it appears over fullscreen apps but doesn't steal focus
      if (process.platform === 'darwin') {
        this.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1000);
      }
    }
  }

  registerGlobalShortcuts(): void {
    // Register global shortcut ⌘+Shift+N (Ctrl+Shift+N on Windows/Linux)
    const shortcut = process.platform === 'darwin' ? 'Cmd+Shift+N' : 'Ctrl+Shift+N';
    
    globalShortcut.register(shortcut, () => {
      this.toggleWindow();
    });

    // Register Escape key to hide window when focused
    globalShortcut.register('Escape', () => {
      if (this.mainWindow && this.mainWindow.isFocused()) {
        this.mainWindow.hide();
      }
    });
  }

  setupIpcHandlers(): void {
    // Handle window controls from renderer
    ipcMain.handle('window-close', () => {
      this.mainWindow?.hide();
    });

    ipcMain.handle('window-minimize', () => {
      this.mainWindow?.minimize();
    });

    // Handle note operations
    ipcMain.handle('save-note', async (_, content: string) => {
      store.set('lastNote', content);
      store.set('lastSaved', new Date().toISOString());
      
      // Auto-sync to Google Docs if enabled
      if (this.syncManager) {
        const syncResult = await this.syncManager.syncNote(content);
        return { success: true, syncResult };
      }
      
      return { success: true };
    });

    ipcMain.handle('load-note', async () => {
      const content = store.get('lastNote', '');
      const lastSaved = store.get('lastSaved', null);
      return { content, lastSaved };
    });

    // Google sync operations
    ipcMain.handle('google-auth-start', async () => {
      if (this.syncManager) {
        return await this.syncManager.startAuth();
      }
      return false;
    });

    ipcMain.handle('google-auth-status', () => {
      return this.syncManager?.isAuthenticated() || false;
    });

    ipcMain.handle('google-sync-settings-get', () => {
      return this.syncManager?.getSyncSettings() || { isEnabled: false };
    });

    ipcMain.handle('google-sync-settings-set', (_, settings) => {
      this.syncManager?.setSyncSettings(settings);
      return true;
    });

    ipcMain.handle('google-sync-manual', async (_, content: string) => {
      if (this.syncManager) {
        return await this.syncManager.syncNote(content);
      }
      return { success: false, error: 'Sync manager not available' };
    });

    ipcMain.handle('google-disconnect', () => {
      this.syncManager?.disconnect();
      return true;
    });

    ipcMain.handle('google-recent-docs', async () => {
      if (this.syncManager) {
        return await this.syncManager.getRecentDocuments();
      }
      return [];
    });

    ipcMain.handle('google-validate-document', async (_, documentId: string) => {
      if (this.syncManager) {
        return await this.syncManager.validateDocument(documentId);
      }
      return { success: false, error: 'Sync manager not available' };
    });
  }

  async initialize(): Promise<void> {
    await app.whenReady();
    
    this.setupIpcHandlers();
    this.registerGlobalShortcuts();
    
    // Create window on first launch
    await this.createWindow();

    // macOS specific behavior
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });
  }
}

// Initialize the app
const noteTaker = new GlobalNoteTaker();
noteTaker.initialize().catch(console.error); 