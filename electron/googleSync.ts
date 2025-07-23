import { BrowserWindow, shell } from 'electron';
import Store from 'electron-store';
import { GoogleAuthService, AuthTokens } from './googleAuth';
import { GoogleDocsService, GoogleDocInfo } from './googleDocs';

interface SyncSettings {
  isEnabled: boolean;
  targetDocumentUrl?: string;
  targetDocumentId?: string;
  targetDocumentTitle?: string;
  lastSync?: string;
}

export class GoogleSyncManager {
  private store: Store;
  private authService: GoogleAuthService;
  private docsService: GoogleDocsService | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null) {
    this.store = new Store();
    this.authService = new GoogleAuthService();
    this.mainWindow = mainWindow;
    
    // Only initialize docs service if OAuth is configured and we have tokens
    if (this.authService.isConfigured()) {
      const storedTokens = this.store.get('googleTokens') as AuthTokens;
      if (storedTokens) {
        this.authService.setCredentials(storedTokens);
        this.docsService = new GoogleDocsService(this.authService);
      }
    }
  }

  /**
   * Check if OAuth is properly configured
   */
  isOAuthConfigured(): boolean {
    return this.authService.isConfigured();
  }

  /**
   * Start the OAuth flow
   */
  async startAuth(): Promise<boolean> {
    if (!this.authService.isConfigured()) {
      console.error('Google OAuth not configured. Please set up your .env file.');
      return false;
    }

    try {
      const authUrl = this.authService.getAuthUrl();
      
      // Create a window to handle OAuth flow directly
      const authWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: true,
        modal: true,
        parent: this.mainWindow || undefined,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
        },
      });

      // Load the OAuth URL directly in the window
      authWindow.loadURL(authUrl);

      return new Promise((resolve) => {
        authWindow.on('closed', () => {
          resolve(false);
        });

        // Handle URL changes to capture the callback
        authWindow.webContents.on('will-navigate', async (event, navigationUrl) => {
          if (navigationUrl.startsWith('http://localhost:3000/auth/callback') || navigationUrl.includes('code=')) {
            const url = new URL(navigationUrl);
            const code = url.searchParams.get('code');
            
            if (code) {
              try {
                const tokens = await this.authService.getTokens(code);
                this.store.set('googleTokens', tokens);
                this.docsService = new GoogleDocsService(this.authService);
                authWindow.close();
                resolve(true);
              } catch (error) {
                console.error('Token exchange failed:', error);
                authWindow.close();
                resolve(false);
              }
            } else {
              authWindow.close();
              resolve(false);
            }
          }
        });

        // Also handle page load events in case will-navigate doesn't catch it
        authWindow.webContents.on('did-navigate', async (event, navigationUrl) => {
          if (navigationUrl.startsWith('http://localhost:3000/auth/callback') || navigationUrl.includes('code=')) {
            const url = new URL(navigationUrl);
            const code = url.searchParams.get('code');
            
            if (code) {
              try {
                const tokens = await this.authService.getTokens(code);
                this.store.set('googleTokens', tokens);
                this.docsService = new GoogleDocsService(this.authService);
                authWindow.close();
                resolve(true);
              } catch (error) {
                console.error('Token exchange failed:', error);
                authWindow.close();
                resolve(false);
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('Auth failed:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isConfigured() && this.authService.isAuthenticated();
  }

  /**
   * Get current sync settings
   */
  getSyncSettings(): SyncSettings {
    return this.store.get('syncSettings', {
      isEnabled: false,
    }) as SyncSettings;
  }

  /**
   * Update sync settings
   */
  setSyncSettings(settings: Partial<SyncSettings>): void {
    const current = this.getSyncSettings();
    this.store.set('syncSettings', { ...current, ...settings });
  }

  /**
   * Sync note content to Google Docs
   */
  async syncNote(content: string): Promise<{ success: boolean; documentUrl?: string; error?: string }> {
    if (!this.authService.isConfigured()) {
      return { success: false, error: 'Google OAuth not configured. Please set up your .env file.' };
    }

    if (!this.docsService || !this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated with Google' };
    }

    const settings = this.getSyncSettings();
    if (!settings.isEnabled || !settings.targetDocumentId) {
      return { success: false, error: 'Sync is disabled or no target document configured' };
    }

    try {
      // Append note to the specified document
      await this.docsService.appendToDocument(settings.targetDocumentId, content);
      
      // Get updated document info
      const docInfo = await this.docsService.getDocumentInfo(settings.targetDocumentId);
      
      // Update last sync time
      this.setSyncSettings({ lastSync: new Date().toISOString() });
      
      return {
        success: true,
        documentUrl: docInfo.url,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      };
    }
  }

  /**
   * Get recent documents
   */
  async getRecentDocuments(): Promise<GoogleDocInfo[]> {
    if (!this.docsService || !this.isAuthenticated()) {
      return [];
    }

    try {
      return await this.docsService.findNotesDocuments();
    } catch (error) {
      console.error('Failed to get recent documents:', error);
      return [];
    }
  }

  /**
   * Disconnect Google account
   */
  disconnect(): void {
    this.authService.clearCredentials();
    this.store.delete('googleTokens');
    this.store.delete('syncSettings');
    this.docsService = null;
  }

  /**
   * Validate that a document exists and is accessible
   */
  async validateDocument(documentId: string): Promise<{ success: boolean; title?: string; error?: string }> {
    if (!this.authService.isConfigured()) {
      return { success: false, error: 'Google OAuth not configured. Please set up your .env file.' };
    }

    if (!this.docsService || !this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated with Google' };
    }

    try {
      const docInfo = await this.docsService.getDocumentInfo(documentId);
      return {
        success: true,
        title: docInfo.title,
      };
    } catch (error) {
      console.error('Document validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cannot access document',
      };
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      try {
        const tokens = await this.authService.refreshToken();
        this.store.set('googleTokens', tokens);
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Save content as a new section with section break
   */
  async saveAsSection(content: string): Promise<boolean> {
    if (!this.authService.isConfigured()) {
      console.error('Google OAuth not configured. Please set up your .env file.');
      return false;
    }

    if (!this.docsService || !this.isAuthenticated()) {
      console.error('Not authenticated with Google');
      return false;
    }

    const settings = this.getSyncSettings();
    if (!settings.isEnabled || !settings.targetDocumentId) {
      console.error('Sync is disabled or no target document configured');
      return false;
    }

    try {
      // Add section break and content to the document
      await this.docsService.addSectionToDocument(settings.targetDocumentId, content);
      
      // Update last sync time
      this.setSyncSettings({ lastSync: new Date().toISOString() });
      
      return true;
    } catch (error) {
      console.error('Failed to save section:', error);
      return false;
    }
  }
} 