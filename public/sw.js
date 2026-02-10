const CACHE_NAME = 'agrosmart-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Instalação: Cache dos ficheiros estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] A fazer cache de ficheiros estáticos');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Limpar caches antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] A limpar cache antiga');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Interceção de Pedidos (Estratégia Offline-First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se estiver em cache, devolve a cache (Offline)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Se não, vai à rede buscar (Online)
      return fetch(event.request).catch(() => {
        // Se falhar (offline e não está em cache), podes retornar uma página de fallback aqui
        // Por agora, não retornamos nada ou um erro
      });
    })
  );
});