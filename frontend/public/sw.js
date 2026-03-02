const CACHE_VERSION = 2;
const STATIC_CACHE = `showmance-static-v${CACHE_VERSION}`;
const IMAGE_CACHE = `showmance-images-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const IMAGE_CACHE_LIMIT = 200;

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/',
  '/index.html',
];

// Static asset extensions to cache-first
const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|otf|eot|ico|png|svg)$/;

// TMDB image domains
const TMDB_IMAGE_HOST = 'image.tmdb.org';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Trim image cache to keep under the limit, evicting oldest entries
async function trimImageCache() {
  const cache = await caches.open(IMAGE_CACHE);
  const keys = await cache.keys();
  if (keys.length > IMAGE_CACHE_LIMIT) {
    const toDelete = keys.slice(0, keys.length - IMAGE_CACHE_LIMIT);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // TMDB poster images: cache-first, evict oldest when over limit
  if (url.hostname === TMDB_IMAGE_HOST) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone);
              trimImageCache();
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, icons): cache-first
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls: network-first, return cached if offline
  if (url.pathname.startsWith('/api') || url.hostname.includes('api.')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Listen for skip-waiting message from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
