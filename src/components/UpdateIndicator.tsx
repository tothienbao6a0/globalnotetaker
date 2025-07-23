import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';

export const UpdateIndicator: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for update events from main process
    const handleUpdateChecking = () => setUpdateStatus('checking');
    const handleUpdateAvailable = (event: any, info: UpdateInfo) => {
      setUpdateInfo(info);
      setUpdateStatus('available');
    };
    const handleUpdateNotAvailable = () => setUpdateStatus('not-available');
    const handleUpdateDownloading = () => setUpdateStatus('downloading');
    const handleUpdateDownloaded = () => setUpdateStatus('downloaded');
    const handleUpdateError = (event: any, errorMessage: string) => {
      setError(errorMessage);
      setUpdateStatus('error');
    };
    const handleUpdateProgress = (event: any, progressInfo: ProgressInfo) => {
      setProgress(progressInfo);
    };

    // Add event listeners
    if (window.electronAPI) {
      window.electronAPI.on('update-checking', handleUpdateChecking);
      window.electronAPI.on('update-available', handleUpdateAvailable);
      window.electronAPI.on('update-not-available', handleUpdateNotAvailable);
      window.electronAPI.on('update-downloading', handleUpdateDownloading);
      window.electronAPI.on('update-downloaded', handleUpdateDownloaded);
      window.electronAPI.on('update-error', handleUpdateError);
      window.electronAPI.on('update-download-progress', handleUpdateProgress);
    }

    return () => {
      // Clean up event listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update-checking');
        window.electronAPI.removeAllListeners('update-available');
        window.electronAPI.removeAllListeners('update-not-available');
        window.electronAPI.removeAllListeners('update-downloading');
        window.electronAPI.removeAllListeners('update-downloaded');
        window.electronAPI.removeAllListeners('update-error');
        window.electronAPI.removeAllListeners('update-download-progress');
      }
    };
  }, []);

  const handleCheckForUpdates = async () => {
    if (window.electronAPI) {
      await window.electronAPI.invoke('check-for-updates');
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus) {
      case 'checking':
        return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'available':
        return <Download className="w-3 h-3" />;
      case 'downloading':
        return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'downloaded':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (updateStatus) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Update ${updateInfo?.version} available`;
      case 'downloading':
        return `Downloading... ${progress?.percent.toFixed(0) || 0}%`;
      case 'downloaded':
        return 'Update ready to install';
      case 'not-available':
        return 'App is up to date';
      case 'error':
        return `Update error: ${error}`;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (updateStatus) {
      case 'available':
      case 'downloaded':
        return 'text-blue-600 dark:text-blue-400';
      case 'downloading':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'not-available':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  // Don't show anything if idle or no updates available after some time
  if (updateStatus === 'idle') {
    return null;
  }

  // Auto-hide "not-available" after 3 seconds
  useEffect(() => {
    if (updateStatus === 'not-available') {
      const timer = setTimeout(() => setUpdateStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateStatus]);

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs">
      {getStatusIcon() && (
        <span className={cn('flex items-center gap-1', getStatusColor())}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </span>
      )}
      
      {updateStatus === 'idle' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCheckForUpdates}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Check for updates
        </Button>
      )}
    </div>
  );
}; 