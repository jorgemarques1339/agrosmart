const CACHE_NAME = 'agrosmart-v3-core';
const MAP_CACHE_NAME = 'agrosmart-maps-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://esm.sh/react@^19.2.4',
  'https://esm.sh/react-dom@^19.2.4',
  'https://esm.sh/lucide-react@^0.563.0',
  'https://esm.sh/recharts@^3.7.0',
  'https://esm.sh/react-leaflet@^5.0.0',
  'https://esm.sh/leaflet@^1.9.4',
  'https://esm.sh/mqtt@^5.15.0',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/jspdf-autotable@3.8.2'
];

// Map Tile detection logic
const isMapTile = (url) => {
  return url.includes('server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile');
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing and caching core assets...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating and cleaning old caches...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== MAP_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Strategy for Map Tiles: Stale-While-Revalidate
  if (isMapTile(url)) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // Strategy for Navigation: Network-First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Strategy for Core Assets: Cache-First
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets on the fly
        if (networkResponse && networkResponse.status === 200 && (url.includes('cdn.tailwindcss.com') || url.includes('esm.sh'))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});