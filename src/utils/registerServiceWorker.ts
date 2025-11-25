/**
 * Service Worker Registration for PWA
 * Enables offline functionality and app installation
 */

export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered successfully:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available. Refresh to update.');
              
              // Notify user about update
              if (window.confirm('A new version is available! Refresh now?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
        window.location.reload();
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  } else {
    console.warn('⚠️ Service Workers are not supported in this browser');
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('✅ Service Worker unregistered');
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
    }
  }
}

export async function checkServiceWorkerStatus(): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
}> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        registered: !!registration,
        active: !!registration?.active,
        waiting: !!registration?.waiting,
      };
    } catch (error) {
      console.error('❌ Error checking service worker status:', error);
      return {
        registered: false,
        active: false,
        waiting: false,
      };
    }
  }
  return {
    registered: false,
    active: false,
    waiting: false,
  };
}
