/* ==========================================
   Service Worker - سوق | عقارات وسيارات
   الإصدار: 2.0.0 (احترافي)
   
   ✅ HTML يُحمّل مباشرة من الشبكة (لا تدخل)
   ✅ API يُتجاهل تماماً (لا AbortError)
   ✅ تخزين ذكي للملفات الثابتة فقط
   ✅ يعمل offline جزئياً
   ========================================== */

const CACHE_VERSION = 'souq-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

/* ==========================================
   📦 الملفات الأساسية (تُخزّن مسبقاً)
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
  '/fonts/cairo-v31-arabic_latin-700.woff2'
];

/* ==========================================
   ⚡ 1. التثبيت (Install)
   ========================================== */
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing v2.0.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(() => {
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
   🔄 2. التنشيط (Activate)
   ========================================== */
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating v2.0.0...');
  
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
   🎯 3. الاعتراض (Fetch) - أهم قسم
   ========================================== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ تجاهل كل الطلبات غير GET
  if (request.method !== 'GET') return;

  // ✅ تجاهل الطلبات الخارجية
  if (url.origin !== self.location.origin) return;

  // ✅✅✅ 1. تجاهل كل طلبات API تماماً
  // (الحل الأساسي لمشكلة AbortError)
  if (url.pathname.startsWith('/api/')) {
    return; // دع المتصفح يمررها كالعادة
  }

  // ✅✅✅ 2. تجاهل كل صفحات HTML تماماً
  // (الحل الأساسي لمشكلة "لا يوجد اتصال")
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    return; // تُحمّل مباشرة من الشبكة
  }

  // ==========================================
  // من هنا فصاعداً = ملفات ثابتة فقط
  // ==========================================

  // ✅ الخطوط → Cache First
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ✅ الصور → Cache First مع حد أقصى
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, 100));
    return;
  }

  // ✅ CSS/JS → Stale While Revalidate
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ✅ البقية → Cache First
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/* ==========================================
   🎨 استراتيجية: Cache First
   - ابحث في الكاش، وإذا لم يوجد اجلب من الشبكة
   - الأفضل للخطوط والصور
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
    console.warn('⚠️ [SW] CacheFirst failed:', request.url);
    throw err;
  }
}

/* ==========================================
   🎨 استراتيجية: Cache First مع حد أقصى
   - نفس Cache First لكن مع حذف الأقدم
   ========================================== */
async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      
      // احذف الأقدم إذا تجاوزنا الحد
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

/* ==========================================
   🎨 استراتيجية: Stale While Revalidate
   - أعد النسخة المخزّنة فوراً + حدّثها بالخلفية
   - الأفضل لـ CSS/JS
   ========================================== */
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

/* ==========================================
   📨 استقبال الرسائل
   ========================================== */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        console.log('🧹 [SW] All caches cleared');
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
});

console.log('✅ [SW] Service Worker v2.0.0 loaded');