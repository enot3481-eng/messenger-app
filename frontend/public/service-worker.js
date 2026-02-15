const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  assets: `messenger-assets-${CACHE_VERSION}`,
  images: `messenger-images-${CACHE_VERSION}`,
  api: `messenger-api-${CACHE_VERSION}`
};

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.assets).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Failed to cache assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url } = request;

  if (url.includes('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleAssetRequest(request));
  }
});

async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAMES.assets);
  const response = await cache.match(request);

  if (response) {
    return response;
  }

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return cache.match('/index.html');
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const response = await cache.match(request);

  if (response) {
    return response;
  }

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response('Image not found', { status: 404 });
  }
}

async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.api);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAMES.api);
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/logo-192x192.png',
      badge: '/icons/logo-192x192.png',
      tag: data.tag || 'notification',
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Messenger', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
