/* ==========================================
   Service Worker - سوق | عقارات وسيارات
   الإصدار: 1.0.1 (إصلاح timeout API)
   ========================================== */

const CACHE_VERSION = 'souq-v1.0.1';  // ✅ نسخة محدّثة
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

/* ==========================================
   📦 الملفات الأساسية
   ========================================== */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/speed-boost.css',
  '/js/api.js',
  '/js/header-state.js',
  '/js/main.js',
  '/js/auth-guard.js',
  '/js/app-inline.js',
  '/js/speed-boost.js',
  '/js/lucide.min.js',
  '/fonts/cairo-v31-arabic_latin-regular.woff2',
  '/fonts/cairo-v31-arabic_latin-700.woff2',
];

/* ==========================================
   🚫 صفحات لا يجب تخزينها أبداً (تجاهل SW تماماً)
   ========================================== */
const NEVER_CACHE = [
  '/api/login.php',
  '/api/register.php',
  '/api/logout.php',
  '/api/me.php',
  '/api/admin_',                    // ← كل ملفات admin_*
  '/api/admin_stats_charts.php',    // ← إصلاح صريح
  '/api/add_listing.php',
  '/api/delete_listing.php',
  '/api/update_listing.php',
  '/api/toggle_favorite.php',
  '/api/seed-admins.php',
  '/api/notifications',             // احتياط
  '/api/notifications_',
];

/* ==========================================
   ⚡ 1. التثبيت
   ========================================== */
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing v1.0.1...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ [SW] Failed to cache: ${url}`);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Install complete');
        return self.skipWaiting();
      })
  );
});

/* ==========================================
   🔄 2. التنشيط
   ========================================== */
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating v1.0.1...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('souq-') && !name.startsWith(CACHE_VERSION);
            })
            .map((name) => {
              console.log(`🗑️ [SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Activate complete');
        return self.clients.claim();
      })
  );
});

/* ==========================================
   🎯 3. الاعتراض
   ========================================== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل غير GET
  if (request.method !== 'GET') return;

  // تجاهل الخارجي
  if (url.origin !== self.location.origin) return;

  // ✅✅✅ الأولوية القصوى: تجاهل كل طلبات API تماماً
  // هذا يمنع SW من إلغاء الطلبات الطويلة
  if (url.pathname.startsWith('/api/')) {
    console.log('🚫 [SW] Bypassing API:', url.pathname);
    return; // دع المتصفح يمررها كالعادة (بدون أي تدخل من SW)
  }

  // (ما يبقى بعد هذا = ملفات ثابتة فقط)

  // الخطوط
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // الصور
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, 50));
    return;
  }

  // CSS/JS
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // HTML
  if (url.pathname.match(/\.(html)$/) || url.pathname === '/') {
    event.respondWith(networkFirst(request, STATIC_CACHE, 3000));
    return;
  }

  // البقية
  event.respondWith(networkFirst(request, STATIC_CACHE, 5000));
});

/* ==========================================
   🎨 استراتيجيات التخزين
   ========================================== */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    throw err;
  }
}

async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      if (keys.length > maxItems) {
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(k => cache.delete(k)));
      }
    }
    return response;
  } catch (err) {
    throw err;
  }
}

async function networkFirst(request, cacheName, timeout = 15000) {
  const cache = await caches.open(cacheName);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    
    if (cached) return cached;
    
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>لا يوجد اتصال</title></head><body><h1>لا يوجد اتصال بالإنترنت</h1></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ [SW] Service Worker v1.0.1 loaded');