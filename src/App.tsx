import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minus, Save, Cloud, CloudOff, Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/SettingsDialog';
import { RichEditor, RichEditorRef } from '@/components/RichEditor';

interface NoteState {
  content: string;
  lastSaved: string | null;
  isOnline: boolean;
  isSaving: boolean;
  isGoogleConnected: boolean;
  syncEnabled: boolean;
}

function App() {
  const [noteState, setNoteState] = useState<NoteState>({
    content: '',
    lastSaved: null,
    isOnline: navigator.onLine,
    isSaving: false,
    isGoogleConnected: false,
    syncEnabled: false,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const editorRef = useRef<RichEditorRef>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  // Load saved note and sync status on mount
  useEffect(() => {
    const loadAppState = async () => {
      try {
        const [
          { content, lastSaved },
          isGoogleConnected,
          syncSettings
        ] = await Promise.all([
          window.electronAPI.loadNote(),
          window.electronAPI.googleAuthStatus(),
          window.electronAPI.googleSyncSettingsGet()
        ]);

        setNoteState(prev => ({
          ...prev,
          content,
          lastSaved,
          isGoogleConnected,
          syncEnabled: syncSettings.isEnabled || false,
        }));
      } catch (error) {
        console.error('Failed to load app state:', error);
      }
    };

    loadAppState();
  }, []);

  // Auto-focus editor when app opens
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setNoteState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNoteState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = window.electronAPI.platform === 'darwin';
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + S - Manual save
      if (cmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
        return;
      }

      // Cmd/Ctrl + Enter - Quick save
      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleQuickSave();
        return;
      }

      // Cmd/Ctrl + , - Open settings
      if (cmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // Escape - Close window
      if (e.key === 'Escape') {
        e.preventDefault();
        handleMinimize();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [noteState.content]);

  // Auto-save functionality
  const saveNote = async (content: string) => {
    try {
      setNoteState(prev => ({ ...prev, isSaving: true }));
      const result = await window.electronAPI.saveNote(content);
      
      if (result.success) {
        setNoteState(prev => ({
          ...prev,
          lastSaved: new Date().toISOString(),
          isSaving: false,
        }));
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      setNoteState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Handle content changes with debounced auto-save
  const handleContentChange = (newContent: string) => {
    setNoteState(prev => ({ ...prev, content: newContent }));

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second delay)
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newContent);
    }, 1000);
  };

  // Handle double-enter in editor
  const handleTextareaKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      const currentTime = Date.now();
      
      // Check if this is a double-enter (within 500ms)
      if (lastKeyRef.current === 'Enter' && currentTime - lastKeyTimeRef.current < 500) {
        e.preventDefault();
        handleQuickSave();
        showNotification('Quick saved with ↵↵');
        // Reset to prevent triple-enter
        lastKeyRef.current = null;
        lastKeyTimeRef.current = 0;
        return;
      }
      
      // Record this keypress
      lastKeyRef.current = 'Enter';
      lastKeyTimeRef.current = currentTime;
    } else {
      // Reset if any other key is pressed
      lastKeyRef.current = null;
      lastKeyTimeRef.current = 0;
    }
  };

  // Manual save
  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveNote(noteState.content);
  };

  // Window controls
  const handleClose = () => {
    window.electronAPI.closeWindow();
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeWindow();
  };

  // Show notification with auto-hide
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  // Quick save (immediate, bypasses debouncing)
  const handleQuickSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveNote(noteState.content);
    showNotification('Saved!');
  };

  // Format last saved time
  const formatLastSaved = (timestamp: string | null) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="note-window relative h-full w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl overflow-hidden flex flex-col">
      {/* macOS-style Title bar with drag region */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50"
        style={{ 
          WebkitAppRegion: 'drag',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
        } as any}
      >
        <div className="flex items-center gap-3 ml-12">
          <div className="flex items-center gap-2">
            {noteState.syncEnabled && noteState.isGoogleConnected ? (
              <Cloud className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
            )}
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {noteState.isSaving ? 'Saving...' : 
               noteState.lastSaved ? `Saved ${formatLastSaved(noteState.lastSaved)}` : 
               'Not saved'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            onClick={handleManualSave}
            disabled={noteState.isSaving}
            title="Save"
          >
            <Save className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0">
        <RichEditor
          ref={editorRef}
          content={noteState.content}
          onChange={handleContentChange}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Start typing your note..."
          className="w-full h-full"
        />
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center font-medium">
            {window.electronAPI.platform === 'darwin' ? '⌘+Shift+N' : 'Ctrl+Shift+N'} to toggle
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            ↵↵ quick save • {window.electronAPI.platform === 'darwin' ? '⌘' : 'Ctrl'}+S save • Esc close
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </div>
  );
}

export default App; 