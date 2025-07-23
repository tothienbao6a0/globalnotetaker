import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  
  // Note operations
  saveNote: (content: string) => ipcRenderer.invoke('save-note', content),
  saveNoteSection: (content: string) => ipcRenderer.invoke('save-note-section', content),
  loadNote: () => ipcRenderer.invoke('load-note'),
  
  // Google sync operations
  googleAuthStart: () => ipcRenderer.invoke('google-auth-start'),
  googleAuthStatus: () => ipcRenderer.invoke('google-auth-status'),
  googleSyncSettingsGet: () => ipcRenderer.invoke('google-sync-settings-get'),
  googleSyncSettingsSet: (settings: any) => ipcRenderer.invoke('google-sync-settings-set', settings),
  googleSyncManual: (content: string) => ipcRenderer.invoke('google-sync-manual', content),
  googleDisconnect: () => ipcRenderer.invoke('google-disconnect'),
  googleRecentDocs: () => ipcRenderer.invoke('google-recent-docs'),
  googleValidateDocument: (documentId: string) => ipcRenderer.invoke('google-validate-document', documentId),
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Generic invoke method for IPC calls
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = ['check-for-updates'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  
  // Event listeners
  on: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [
      'update-checking',
      'update-available', 
      'update-not-available',
      'update-downloading',
      'update-downloaded',
      'update-error',
      'update-download-progress'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, func);
    }
  },
  removeAllListeners: (channel: string) => {
    const validChannels = [
      'update-checking',
      'update-available', 
      'update-not-available',
      'update-downloading',
      'update-downloaded',
      'update-error',
      'update-download-progress'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  
  // Platform detection
  platform: process.platform,
}); 