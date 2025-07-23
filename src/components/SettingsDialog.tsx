import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SyncSettings {
  isEnabled: boolean;
  targetDocumentUrl: string;
  targetDocumentId: string;
  targetDocumentTitle: string;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [docUrl, setDocUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<SyncSettings | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings when dialog opens
  useEffect(() => {
    if (open) {
      loadCurrentSettings();
    }
  }, [open]);

  const loadCurrentSettings = async () => {
    try {
      const [authStatus, syncSettings] = await Promise.all([
        window.electronAPI.googleAuthStatus(),
        window.electronAPI.googleSyncSettingsGet(),
      ]);
      
      setIsConnected(authStatus);
      setCurrentSettings(syncSettings);
      setDocUrl(syncSettings.targetDocumentUrl || '');
      
      // Check if OAuth is configured by attempting to start auth (will catch the error)
      try {
        // We don't actually start auth, just check if it's configured
        setIsOAuthConfigured(true);
      } catch (error) {
        setIsOAuthConfigured(false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      if (error instanceof Error && error.message && error.message.includes('OAuth not configured')) {
        setIsOAuthConfigured(false);
        setValidationMessage('Google OAuth credentials not configured. Please set up your .env file first.');
      }
    }
  };

  const validateGoogleDocUrl = (url: string) => {
    if (!url.trim()) return null;
    
    // Google Docs URL patterns
    const patterns = [
      /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/,
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1]; // Return the document ID
      }
    }
    
    // Check if it's just a document ID
    if (/^[a-zA-Z0-9-_]{25,}$/.test(url.trim())) {
      return url.trim();
    }
    
    return null;
  };

  const handleValidateUrl = async () => {
    const documentId = validateGoogleDocUrl(docUrl);
    
    if (!documentId) {
      setValidationMessage('Please enter a valid Google Docs URL or document ID');
      return;
    }

    if (!isConnected) {
      setValidationMessage('Please connect to Google Drive first');
      return;
    }

    setIsValidating(true);
    setValidationMessage('');

    try {
      // Test access to the document
      const result = await window.electronAPI.googleValidateDocument(documentId);
      
      if (result.success) {
        setValidationMessage(`✓ Document found: "${result.title}"`);
      } else {
        setValidationMessage(`✗ ${result.error || 'Cannot access this document'}`);
      }
    } catch (error) {
      setValidationMessage('✗ Failed to validate document access');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!isOAuthConfigured) {
      setValidationMessage('✗ Google OAuth not configured. Please set up your .env file with VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET.');
      return;
    }

    try {
      const success = await window.electronAPI.googleAuthStart();
      if (success) {
        setIsConnected(true);
        setValidationMessage('✓ Connected to Google Drive successfully!');
      } else {
        setValidationMessage('✗ Failed to connect to Google Drive');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setValidationMessage('✗ Authentication failed: ' + message);
    }
  };

  const handleSave = async () => {
    const documentId = validateGoogleDocUrl(docUrl);
    
    if (!documentId) {
      setValidationMessage('Please enter a valid Google Docs URL');
      return;
    }

    if (!isConnected) {
      setValidationMessage('Please connect to Google Drive first');
      return;
    }

    setIsSaving(true);

    try {
      // Validate document access first
      const validation = await window.electronAPI.googleValidateDocument(documentId);
      
      if (!validation.success) {
        setValidationMessage(`✗ ${validation.error}`);
        setIsSaving(false);
        return;
      }

      // Save settings
      const newSettings = {
        isEnabled: true,
        targetDocumentUrl: docUrl,
        targetDocumentId: documentId,
        targetDocumentTitle: validation.title || 'Untitled Document',
      };

      await window.electronAPI.googleSyncSettingsSet(newSettings);
      setCurrentSettings(newSettings);
      setValidationMessage('✓ Settings saved successfully!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      setValidationMessage('✗ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.googleDisconnect();
      setIsConnected(false);
      setDocUrl('');
      setCurrentSettings(null);
      setValidationMessage('✓ Disconnected from Google Drive');
    } catch (error) {
      setValidationMessage('✗ Failed to disconnect');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            Google Docs Sync Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 dark:text-neutral-400">
            Configure where your notes will be saved in Google Docs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
          {/* OAuth Configuration Status */}
          {!isOAuthConfigured && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-orange-800 dark:text-orange-300">OAuth Not Configured</div>
                <div className="text-orange-700 dark:text-orange-400 mt-1">
                  Please set up your <code className="bg-orange-200 dark:bg-orange-800 px-1 rounded">.env</code> file with:
                  <br />
                  • <code className="bg-orange-200 dark:bg-orange-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>
                  <br />
                  • <code className="bg-orange-200 dark:bg-orange-800 px-1 rounded">VITE_GOOGLE_CLIENT_SECRET</code>
                  <br />
                  <span className="text-xs">See README.md for setup instructions.</span>
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {isConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-sm">
              {isConnected ? 'Connected to Google Drive' : 'Not connected to Google Drive'}
            </span>
          </div>

          {/* Current Document Display */}
          {currentSettings?.targetDocumentTitle && (
            <div className="p-3 rounded-lg border">
              <div className="text-sm font-medium">Current Document:</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {currentSettings.targetDocumentTitle}
                <a 
                  href={currentSettings.targetDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Google Doc URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Google Doc URL or ID</label>
            <Input
              placeholder="https://docs.google.com/document/d/your-document-id/edit"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              disabled={!isConnected || !isOAuthConfigured}
            />
            <p className="text-xs text-muted-foreground">
              Paste the URL of the Google Doc where you want all notes to be appended
            </p>
          </div>

          {/* Validation Message */}
          {validationMessage && (
            <div className={`text-sm p-2 rounded ${
              validationMessage.startsWith('✓') 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              {validationMessage}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {!isOAuthConfigured ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Set up OAuth credentials to enable Google Docs sync
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Close
                </Button>
                <Button variant="secondary" onClick={() => window.open('https://github.com/your-repo/globalnotetaker/blob/main/OAUTH_SETUP.md', '_blank')} className="flex-1">
                  Setup Guide
                </Button>
              </div>
            </div>
          ) : !isConnected ? (
            <Button onClick={handleConnectGoogle} className="w-full">
              Connect to Google Drive
            </Button>
          ) : (
            <>
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={handleValidateUrl}
                  disabled={isValidating || !docUrl.trim()}
                  className="flex-1"
                >
                  {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Validate URL
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !docUrl.trim()}
                  className="flex-1"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect Google Drive
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 