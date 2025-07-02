const CACHE_NAME = 'worldcup-platform-v1';
const STATIC_CACHE_NAME = 'worldcup-static-v1';
const DYNAMIC_CACHE_NAME = 'worldcup-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/create',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached');
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('❌ Service Worker: Static cache error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle requests with cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Helper functions
function isPageRequest(request) {
  return request.mode === 'navigate';
}

function isImageRequest(request) {
  return request.destination === 'image';
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || request.url.includes('supabase');
}

// Page request handler (Network First, fallback to cache)
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('📱 Service Worker: Serving page from cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to homepage for SPA routing
    return caches.match('/');
  }
}

// Image request handler (Cache First, fallback to network)
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🖼️ Service Worker: Image fetch failed:', request.url);
    
    // Return placeholder image for failed image requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">이미지를 불러올 수 없습니다</text></svg>',
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// API request handler (Network Only, no cache for real-time data)
async function handleAPIRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.warn('🌐 Service Worker: API request failed:', request.url);
    
    // Return error response for API failures
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static request handler (Cache First, fallback to network)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('📄 Service Worker: Static resource fetch failed:', request.url);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-gameplay') {
    event.waitUntil(syncGameplayData());
  }
});

// Sync gameplay data when back online
async function syncGameplayData() {
  try {
    // Get pending gameplay data from IndexedDB
    const pendingData = await getPendingGameplayData();
    
    for (const data of pendingData) {
      try {
        await fetch('/api/sync-gameplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Remove from pending data after successful sync
        await removePendingGameplayData(data.id);
      } catch (error) {
        console.error('Failed to sync gameplay data:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingGameplayData() {
  // Implementation would use IndexedDB to get pending data
  return [];
}

async function removePendingGameplayData(id) {
  // Implementation would remove data from IndexedDB
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'worldcup-notification',
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

console.log('🚀 Service Worker: Loaded and ready');