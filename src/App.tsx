import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Minus, Save, Cloud, CloudOff, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/SettingsDialog';

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Auto-focus textarea when app opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
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
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
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
    <div className="note-window h-full w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl overflow-hidden">
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
      <div className="flex-1 p-4">
        <Textarea
          ref={textareaRef}
          value={noteState.content}
          onChange={handleContentChange}
          placeholder="Start typing your note..."
          className={cn(
            "w-full h-full resize-none border-none bg-transparent",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "text-base leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600",
            "custom-scrollbar"
          )}
          style={{ 
            minHeight: '100%',
            boxShadow: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/50 backdrop-blur-sm">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center font-medium">
          {window.electronAPI.platform === 'darwin' ? '⌘+Shift+N' : 'Ctrl+Shift+N'} to toggle
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