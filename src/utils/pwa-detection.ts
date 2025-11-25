/**
 * PWA Detection and Analytics Utilities
 * Detects PWA installation status, display mode, and tracks analytics
 */

export interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  displayMode: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  canInstall: boolean;
  supportsServiceWorker: boolean;
  supportsNotifications: boolean;
  supportsPushNotifications: boolean;
}

/**
 * Get comprehensive PWA status
 */
export function getPWAStatus(): PWAStatus {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detect platform
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);
  const isDesktop = !isMobile;

  // Detect display mode
  const displayMode = getDisplayMode();
  
  // Check if installed
  const isStandalone = displayMode === 'standalone' || displayMode === 'fullscreen';
  const isInstalled = isStandalone || (window.navigator as any).standalone === true;

  // Check capabilities
  const supportsServiceWorker = 'serviceWorker' in navigator;
  const supportsNotifications = 'Notification' in window;
  const supportsPushNotifications = 'PushManager' in window;

  return {
    isInstalled,
    isStandalone,
    displayMode,
    isIOS,
    isAndroid,
    isDesktop,
    isMobile,
    canInstall: !isInstalled && supportsServiceWorker,
    supportsServiceWorker,
    supportsNotifications,
    supportsPushNotifications
  };
}

/**
 * Get current display mode
 */
export function getDisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Check if app is running as installed PWA
 */
export function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if device is Android
 */
export function isAndroidDevice(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if service worker is supported
 */
export function supportsServiceWorker(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if push notifications are supported
 */
export function supportsPushNotifications(): boolean {
  return 'PushManager' in window && 'Notification' in window;
}

/**
 * Get service worker registration status
 */
export async function getServiceWorkerStatus(): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
  scope?: string;
}> {
  if (!supportsServiceWorker()) {
    return {
      registered: false,
      active: false,
      waiting: false
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return {
        registered: false,
        active: false,
        waiting: false
      };
    }

    return {
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
      scope: registration.scope
    };
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return {
      registered: false,
      active: false,
      waiting: false
    };
  }
}

/**
 * Track PWA installation event
 */
export function trackPWAInstall(): void {
  const installTime = new Date().toISOString();
  localStorage.setItem('pwa-installed-at', installTime);
  
  // Send analytics event (if analytics is set up)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installed',
      value: 1
    });
  }

  console.log('✅ PWA installed at:', installTime);
}

/**
 * Track PWA usage analytics
 */
export function trackPWAUsage(): void {
  const status = getPWAStatus();
  
  // Store usage data
  const usageData = {
    lastUsed: new Date().toISOString(),
    displayMode: status.displayMode,
    isInstalled: status.isInstalled,
    platform: status.isIOS ? 'iOS' : status.isAndroid ? 'Android' : 'Desktop'
  };

  localStorage.setItem('pwa-usage-data', JSON.stringify(usageData));

  // Send analytics event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'pwa_usage', {
      event_category: 'engagement',
      display_mode: status.displayMode,
      is_installed: status.isInstalled
    });
  }
}

/**
 * Get PWA installation date
 */
export function getPWAInstallDate(): Date | null {
  const installTime = localStorage.getItem('pwa-installed-at');
  return installTime ? new Date(installTime) : null;
}

/**
 * Check if PWA install prompt should be shown
 */
export function shouldShowInstallPrompt(): boolean {
  // Don't show if already installed
  if (isPWAInstalled()) return false;

  // Don't show if permanently dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed === 'permanent') return false;

  // Don't show if recently dismissed (within 7 days)
  const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');
  if (dismissedAt) {
    const daysSinceDismissed = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) return false;
  }

  return true;
}

/**
 * Dismiss PWA install prompt
 */
export function dismissInstallPrompt(permanent: boolean = false): void {
  if (permanent) {
    localStorage.setItem('pwa-install-dismissed', 'permanent');
  } else {
    localStorage.setItem('pwa-install-dismissed', 'temporary');
    localStorage.setItem('pwa-install-dismissed-at', new Date().toISOString());
  }
}

/**
 * Reset install prompt (for testing or settings)
 */
export function resetInstallPrompt(): void {
  localStorage.removeItem('pwa-install-dismissed');
  localStorage.removeItem('pwa-install-dismissed-at');
}

/**
 * Get PWA metrics for dashboard
 */
export function getPWAMetrics() {
  const status = getPWAStatus();
  const installDate = getPWAInstallDate();
  const usageData = localStorage.getItem('pwa-usage-data');

  return {
    status,
    installDate,
    usageData: usageData ? JSON.parse(usageData) : null,
    daysInstalled: installDate 
      ? Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  };
}

/**
 * Log PWA capabilities for debugging
 */
export function logPWACapabilities(): void {
  const status = getPWAStatus();
  
  console.group('🔍 PWA Capabilities');
  console.log('Installed:', status.isInstalled);
  console.log('Display Mode:', status.displayMode);
  console.log('Platform:', status.isIOS ? 'iOS' : status.isAndroid ? 'Android' : 'Desktop');
  console.log('Service Worker:', status.supportsServiceWorker);
  console.log('Notifications:', status.supportsNotifications);
  console.log('Push Notifications:', status.supportsPushNotifications);
  console.groupEnd();
}

/**
 * Initialize PWA tracking
 */
export function initializePWATracking(): void {
  // Track initial usage
  trackPWAUsage();

  // Listen for display mode changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
      console.log('✅ App running in standalone mode');
      trackPWAInstall();
    }
  });

  // Log capabilities in development
  if (process.env.NODE_ENV === 'development') {
    logPWACapabilities();
  }
}
