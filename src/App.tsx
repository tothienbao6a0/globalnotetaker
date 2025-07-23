import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Minus, Save, Cloud, CloudOff, Settings, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/SettingsDialog';
import { RichEditor, RichEditorRef } from '@/components/RichEditor';
// import { UpdateIndicator } from '@/components/UpdateIndicator'; // Temporarily disabled

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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const editorRef = useRef<RichEditorRef>(null);
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

      console.log('🔍 Key pressed:', e.key, 'meta:', e.metaKey, 'ctrl:', e.ctrlKey, 'shift:', e.shiftKey, 'cmdOrCtrl:', cmdOrCtrl);
      
      // Special debug for Shift+S combination
      if (e.key === 'S' && e.shiftKey) {
        console.log('🔍 SHIFT+S detected! cmdOrCtrl:', cmdOrCtrl, 'conditions check:', {
          'cmdOrCtrl && e.shiftKey && e.key === S': cmdOrCtrl && e.shiftKey && e.key === 'S',
          'cmdOrCtrl': cmdOrCtrl,
          'e.shiftKey': e.shiftKey,
          'e.key === S': e.key === 'S'
        });
      }

      // Cmd/Ctrl + Shift + Enter - Save as section (CHECK THIS FIRST!)
      if (cmdOrCtrl && e.shiftKey && e.key === 'Enter') {
        console.log('🔍 Keyboard shortcut Cmd/Ctrl+Shift+Enter triggered!');
        e.preventDefault();
        handleSaveAsSection();
        return;
      }

      // Cmd/Ctrl + S - Manual save (but NOT with shift)
      if (cmdOrCtrl && !e.shiftKey && e.key === 's') {
        console.log('🔍 Manual save shortcut triggered!');
        e.preventDefault();
        handleQuickSave();
        return;
      }

      // Cmd/Ctrl + Enter - Quick save
      if (cmdOrCtrl && e.key === 'Enter') {
        console.log('🔍 Quick save shortcut triggered!');
        e.preventDefault();
        handleQuickSave();
        return;
      }

      // Cmd/Ctrl + , - Open settings
      if (cmdOrCtrl && e.key === ',') {
        console.log('🔍 Settings shortcut triggered!');
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // Escape - Close window
      if (e.key === 'Escape') {
        console.log('🔍 Escape key triggered!');
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
    console.log('🔍 Content changed to:', newContent);
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

  // Save current content as a new section and clear editor
  const handleSaveAsSection = async () => {
    const currentContent = noteState.content.trim();
    console.log('🔍 handleSaveAsSection called with content:', currentContent);
    
    if (!currentContent) {
      showNotification('Nothing to save!', 'error');
      return;
    }

    try {
      setNoteState(prev => ({ ...prev, isSaving: true }));

      // Convert HTML content to plain text for Google Docs - SUPER ROBUST method
      let plainText = currentContent;
      
      console.log('🔍 Original HTML:', JSON.stringify(currentContent));
      console.log('🔍 Contains HTML tags:', currentContent.includes('<'));
      
      // ALWAYS strip HTML tags - multiple methods
      if (currentContent.includes('<')) {
        console.log('🔍 Attempting DOM parsing...');
        
        // Method 1: DOM parsing
        try {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = currentContent;
          const domText = tempDiv.textContent || tempDiv.innerText || '';
          console.log('🔍 DOM parsing result:', JSON.stringify(domText));
          
          if (domText && domText.trim()) {
            plainText = domText.trim();
          }
        } catch (e) {
          console.log('🔍 DOM parsing failed:', e);
        }
        
        // Method 2: Regex stripping (always as backup)
        const regexText = currentContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        console.log('🔍 Regex stripping result:', JSON.stringify(regexText));
        
        // Use the longer result (more likely to be correct)
        if (regexText.length > plainText.length) {
          plainText = regexText;
        }
        
        // Method 3: DOMParser as final fallback
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(currentContent, 'text/html');
          const parserText = doc.body.textContent || '';
          console.log('🔍 DOMParser result:', JSON.stringify(parserText));
          
          if (parserText && parserText.trim() && parserText.length > plainText.length) {
            plainText = parserText.trim();
          }
        } catch (e) {
          console.log('🔍 DOMParser failed:', e);
        }
      }
      
      // Final cleanup
      plainText = plainText.replace(/\s+/g, ' ').trim();
      
      console.log('🔍 FINAL plain text result:', JSON.stringify(plainText));
      console.log('🔍 Original length:', currentContent.length, 'Final length:', plainText.length);

      // Create timestamp for section
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const sectionTitle = `📝 ${timestamp}`;
      const sectionContent = `${sectionTitle}\n\n${plainText}\n\n`;
      
      console.log('🔍 Final section content:', sectionContent);

      // Save to Google Docs as a new section
      const success = await window.electronAPI.saveNoteSection(sectionContent);
      console.log('🔍 Save result:', success);
      
      if (success) {
        console.log('🔍 Clearing editor...');
        
        // First clear the rich editor directly
        if (editorRef.current) {
          console.log('🔍 Clearing rich editor with setHTML...');
          editorRef.current.setHTML('');
          
          // Give it a moment to update, then clear state
          setTimeout(() => {
            setNoteState(prev => ({ 
              ...prev, 
              content: '',
              lastSaved: new Date().toISOString(),
              isSaving: false
            }));
          }, 100);
        } else {
          console.log('🔍 editorRef.current is null!');
          // Clear state immediately if no editor ref
          setNoteState(prev => ({ 
            ...prev, 
            content: '',
            lastSaved: new Date().toISOString(),
            isSaving: false
          }));
        }

        showNotification(`Section saved: ${timestamp}`);
      } else {
        showNotification('Failed to save section', 'error');
        setNoteState(prev => ({ ...prev, isSaving: false }));
      }
    } catch (error) {
      console.error('Error saving section:', error);
      showNotification('Error saving section', 'error');
      setNoteState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Handle keyboard shortcuts in editor
  const handleTextareaKeyDown = (e: KeyboardEvent) => {
    // Note: Most keyboard shortcuts are handled at the global level now
    // This function is only for editor-specific shortcuts if needed
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
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({message, type});
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
        <div className={cn(
          "absolute top-4 right-4 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in duration-200",
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        )}>
          {notification.type === 'success' ? 
            <Check className="w-4 h-4" /> : 
            <AlertCircle className="w-4 h-4" />
          }
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center font-medium">
            {window.electronAPI.platform === 'darwin' ? '⌘+Shift+N' : 'Ctrl+Shift+N'} to toggle
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            {window.electronAPI.platform === 'darwin' ? '⌘' : 'Ctrl'}+S save • {window.electronAPI.platform === 'darwin' ? '⌘' : 'Ctrl'}+Shift+↵ section • {window.electronAPI.platform === 'darwin' ? '⌘' : 'Ctrl'}+Shift+I console
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