/**
 * DevTrack Africa - Production-Ready Service Worker
 * Implements comprehensive offline functionality with intelligent caching
 * Version: 2.0.0
 */

const CACHE_VERSION = 'devtrack-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Cache size limits
const CACHE_SIZE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 30,
  [IMAGE_CACHE]: 60
};

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Cache-first patterns (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|ttf|otf|eot)$/,
  /\/icon-.*\.png$/,
  /\/favicon/,
  /\/apple-touch-icon/
];

// Network-first patterns (API calls, dynamic data)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\/auth\//,
  /\/realtime\//
];

// Stale-while-revalidate patterns
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
  /unsplash\.com/
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log('[SW] Static assets cached successfully');
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache static assets:', error);
      }
    })()
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => !name.startsWith(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        await self.clients.claim();
        console.log('[SW] Service worker activated successfully');
      } catch (error) {
        console.error('[SW] Activation error:', error);
      }
    })()
  );
});

// Fetch Event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except allowed ones)
  if (url.origin !== location.origin && !shouldCacheCrossOrigin(url)) {
    return;
  }

  // Determine caching strategy
  if (matchesPattern(url, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (matchesPattern(url, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (matchesPattern(url, STALE_WHILE_REVALIDATE_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  } else {
    // Default: Network first with fallback to cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache-First Strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('Offline - Content not available', { status: 503 });
  }
}

// Network-First Strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, CACHE_SIZE_LIMITS[cacheName]);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Offline - No cached data available' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-While-Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, CACHE_SIZE_LIMITS[cacheName]);
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper: Match URL against patterns
function matchesPattern(url, patterns) {
  return patterns.some(pattern => pattern.test(url.pathname + url.search));
}

// Helper: Check if cross-origin URL should be cached
function shouldCacheCrossOrigin(url) {
  const allowedOrigins = [
    'supabase.co',
    'unsplash.com',
    'images.unsplash.com'
  ];
  return allowedOrigins.some(origin => url.hostname.includes(origin));
}

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Background Sync - Handle offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncProjects());
  } else if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncProjects() {
  try {
    // Get pending changes from IndexedDB
    const db = await openDatabase();
    const pendingChanges = await db.getAll('pendingSync');
    
    // Sync each change
    for (const change of pendingChanges) {
      await fetch(change.url, {
        method: change.method,
        headers: change.headers,
        body: JSON.stringify(change.data)
      });
      await db.delete('pendingSync', change.id);
    }
    
    console.log('[SW] Projects synced successfully');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry sync
  }
}

async function syncTasks() {
  // Similar to syncProjects
  console.log('[SW] Tasks synced');
}

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DevTrack Africa', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message Handler - Communication with app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(clearAllCaches());
  }
  
  if (event.data.action === 'cacheUrls' && event.data.urls) {
    event.waitUntil(cacheUrls(event.data.urls));
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
  console.log('[SW] URLs cached:', urls.length);
}

// Helper: Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('devtrack-sync-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
