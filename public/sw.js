// Alterar a versão sempre que fizeres um deploy importante para forçar a limpeza
const CACHE_NAME = 'agrosmart-v2'; 
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Instalação: Força o novo Service Worker a tornar-se ativo imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting(); // <--- CRUCIAL: Não espera para atualizar
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cache atualizada para ' + CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Limpa caches antigas e assume controlo das abas abertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpa caches que não pertencem à versão atual
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('[Service Worker] A eliminar cache obsoleta:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      // Assume o controlo imediato de todos os clientes (abas)
      self.clients.claim() 
    ])
  );
});

// 3. Estratégia: Network-First para o index.html (Evita ecrã branco)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para o ficheiro principal, tentamos sempre a rede primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Para o resto (CSS, JS, Imagens), usamos Cache-First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});