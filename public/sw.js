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

// --- PUSH NOTIFICATIONS ---

self.addEventListener('push', (event) => {
  console.log('[SW] Push Received:', event);

  let data = {
    title: 'OrivaSmart Alerta',
    body: 'Nova atualização do sistema.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'critical-alert'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification Clicked:', event.notification.tag, event.action);

  event.notification.close();

  const notifData = event.notification.data || {};

  // ── Geofence Check-in Action ──────────────────────────────────────────────
  if (event.action === 'checkin' && notifData.fieldId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        // Post message to all open app tabs to trigger auto check-in
        clients.forEach((client) => {
          client.postMessage({
            type: 'GEOFENCE_CHECKIN',
            fieldId: notifData.fieldId
          });
        });

        // If app is closed / backgrounded, open it
        if (clients.length === 0 && self.clients.openWindow) {
          return self.clients.openWindow('/?checkin=' + notifData.fieldId);
        }
      })
    );
    return;
  }

  // ── Generic Notification Click ────────────────────────────────────────────
  if (event.action === 'dismiss') return;

  const urlToOpen = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Local Geofence Notification (triggered by page postMessage) ──────────────
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'GEOFENCE_ENTRY') return;

  const { field } = event.data;
  if (!field) return;

  console.log('[SW] Geofence entry detected for field:', field.name);

  const options = {
    body: `Bem-vindo a ${field.name}. Quer iniciar o check-in agora?`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    image: field.image || undefined,
    tag: 'geofence-checkin-' + field.id,
    renotify: false,
    requireInteraction: true,        // stays on screen — critical for lock screen / Apple Watch
    silent: false,
    vibrate: [100, 50, 200, 50, 100],
    data: {
      fieldId: field.id,
      url: '/'
    },
    actions: [
      { action: 'checkin', title: '✅ Iniciar Check-in' },
      { action: 'dismiss', title: '✕ Ignorar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(`📍 ${field.name}`, options)
  );
});