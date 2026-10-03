/* ==========================================
   Service Worker - سوق v3.0.0
   - الصور: Network First (لا كاش!)
   - الكاش القديم يُحذف تلقائياً
   ========================================== */

const CACHE_VERSION = 'souq-v3.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/speed-boost.css',
  '/css/master-fix.css',
  '/js/api.js',
  '/js/header-state.js',
  '/js/main.js',
  '/js/auth-guard.js',
  '/js/app-inline.js',
  '/js/master-fix.js',
  '/js/speed-boost.js',
  '/js/icons.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('souq-') && !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // تجاهل API و HTML
  if (url.pathname.startsWith('/api/') || url.pathname.includes('api.php')) return;
  if (url.pathname.endsWith('.html') || url.pathname === '/') return;

  // ✅ الصور: Network First (المفتاح!)
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/)) {
    if (url.pathname.includes('listing_image') || 
        url.pathname.includes('listing_images') ||
        url.pathname.includes('uploads')) {
      event.respondWith(networkFirst(request));
      return;
    }
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // الخطوط
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // CSS/JS
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map(n => caches.delete(n))))
        .then(() => event.ports[0]?.postMessage({ success: true }))
    );
  }
});