const CACHE_NAME = 'pixora-cache-v3';

// Minimal static assets for PWA installability only
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // We completely bypass caching for API, hcgi, or pocketbase calls.
  // The app requires a live connection to function correctly.
  if (url.pathname.includes('/api/') || url.pathname.includes('/hcgi/') || url.pathname.includes('/api/collections')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'Connect to internet to continue using the app',
            isOffline: true 
          }), 
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(request)
      .catch(() => {
        // If offline and requesting a page, show offline message
        if (request.mode === 'navigate') {
          return new Response(
            '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;line-height:1.5;background:#f9f9f9;color:#333;"><div><svg style="width:64px;height:64px;margin-bottom:16px;color:#999;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.36 6.64A9 9 0 005.64 6.64m12.72 12.72A9 9 0 005.64 17.36m10.6-10.6a6 6 0 00-8.48 0m8.48 8.48a6 6 0 00-8.48 0m6.36-6.36a3 3 0 00-4.24 0m4.24 4.24a3 3 0 00-4.24 0"></path></svg><h2 style="margin-bottom:8px;">You are offline</h2><p style="color:#666;">Connect to internet to continue using the app.</p></div></body></html>',
            {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        return caches.match(request);
      })
  );
});