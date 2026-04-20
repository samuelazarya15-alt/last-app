const CACHE_NAME = 'learn-tigrinya-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache basic shell. Vite hashes JS/CSS so we rely on network-first for those,
      // but we guarantee the root document is available.
      return cache.addAll(['/', '/index.html', '/manifest.json', '/icon.svg']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first approach with cache fallback
  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // If valid response, clone and cache it
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails (offline), look in cache. 
          // If not in cache, fallback to the root '/' for SPA handling.
          return caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
  }
});
