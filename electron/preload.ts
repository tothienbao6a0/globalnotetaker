import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  
  // Note operations
  saveNote: (content: string) => ipcRenderer.invoke('save-note', content),
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
  
  // Platform detection
  platform: process.platform,
}); 