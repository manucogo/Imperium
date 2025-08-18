// sw.js - Service Worker para IMPERIUM Crosstraining
// Subir este archivo a la raíz de tu web

const CACHE_NAME = 'imperium-crosstraining-v1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/script.js',
  '/img/logo_color.png',
  '/img/grupal.jpeg',
  '/img/cajas.jpeg',
  '/img/pesas.jpg',
  '/img/DSC_0785.jpg',
  '/img/ruben.jpg',
  '/img/coach2.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', function(event) {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia Cache First para recursos estáticos
  if (event.request.url.includes('.css') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.jpg') || 
      event.request.url.includes('.jpeg') || 
      event.request.url.includes('.png') || 
      event.request.url.includes('.webp') ||
      event.request.url.includes('cdnjs.cloudflare.com')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Devolver desde cache si existe
          if (response) {
            return response;
          }
          
          // Si no está en cache, hacer fetch y cachear
          return fetch(event.request).then(function(response) {
            // Verificar que sea una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para cachear
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  }
  
  // Estrategia Network First para HTML
  else if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Si la red funciona, usar y cachear la respuesta
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(function() {
          // Si la red falla, intentar desde cache
          return caches.match(event.request);
        })
    );
  }
  
  // Para todo lo demás, intentar red primero, luego cache
  else {
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          return caches.match(event.request);
        })
    );
  }
});

// Manejar updates del Service Worker
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano para analytics
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Enviar datos de analytics offline
      sendAnalyticsData()
    );
  }
});

function sendAnalyticsData() {
  // Lógica para enviar datos de analytics cuando vuelva la conexión
  return Promise.resolve();
}