const CACHE_NAME = 'scholarsync-gateway-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/hpu_logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
