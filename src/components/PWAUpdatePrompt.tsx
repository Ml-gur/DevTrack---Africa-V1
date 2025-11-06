import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, X, Download } from 'lucide-react';
import { useServiceWorker } from './hooks/usePWA';

export default function PWAUpdatePrompt() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShow(true);
    }
  }, [updateAvailable]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Wait a moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the service worker
      updateServiceWorker();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Show again after 1 hour
    setTimeout(() => {
      if (updateAvailable) {
        setShow(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!show || !updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <Alert className="relative border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={handleDismiss}
          disabled={isUpdating}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {isUpdating ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <div className="space-y-1">
                <p className="font-semibold">🎉 Update Available!</p>
                <p className="text-sm">
                  A new version of DevTrack Africa is ready to install with bug fixes and improvements.
                </p>
              </div>
            </AlertDescription>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                disabled={isUpdating}
                variant="outline"
                size="sm"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}

// Compact update badge for navbar
export function UpdateBadge() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <button
      onClick={updateServiceWorker}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
      title="Update available - Click to refresh"
    >
      <RefreshCw className="w-3 h-3" />
      <span>Update</span>
    </button>
  );
}
