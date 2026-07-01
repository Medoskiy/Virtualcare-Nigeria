const CACHE_VERSION = 'virtualcare-ng-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/',
  '/styles/main.css',
  '/styles/phase2.css',
  '/styles/components.css',
  '/js/app.js',
  '/public/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // NEVER intercept OAuth callback requests - let browser handle them directly
  if (url.pathname.includes('/auth/google/callback') ||
      url.pathname.includes('/auth/facebook/callback') ||
      url.pathname.includes('/oauth-callback') ||
      url.pathname.startsWith('/api/auth/google') ||
      url.pathname.startsWith('/api/auth/facebook') ||
      url.pathname === '/api/auth/logout') {
    return; // Don't intercept
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'You appear to be offline. Please check your connection.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Handle static assets with cache-first strategy
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/'))
  );
});
