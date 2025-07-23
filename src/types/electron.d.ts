export interface ElectronAPI {
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  saveNote: (content: string) => Promise<{ success: boolean; syncResult?: any }>;
  loadNote: () => Promise<{ content: string; lastSaved: string | null }>;
  
  // Google sync operations
  googleAuthStart: () => Promise<boolean>;
  googleAuthStatus: () => Promise<boolean>;
  googleSyncSettingsGet: () => Promise<any>;
  googleSyncSettingsSet: (settings: any) => Promise<boolean>;
  googleSyncManual: (content: string) => Promise<{ success: boolean; documentUrl?: string; error?: string }>;
  googleDisconnect: () => Promise<boolean>;
  googleRecentDocs: () => Promise<any[]>;
  googleValidateDocument: (documentId: string) => Promise<{ success: boolean; title?: string; error?: string }>;
  
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 