/* ==========================================
   Service Worker - سوق | عقارات وسيارات
   الإصدار: 1.0.0
   ✅ تخزين ذكي للملفات الثابتة
   ✅ API دائماً من الشبكة (بيانات طازجة)
   ✅ يعمل offline جزئياً
   ========================================== */

const CACHE_VERSION = 'souq-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

/* ==========================================
   📦 الملفات الأساسية (تُخزّن فوراً عند التثبيت)
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
   🚫 صفحات لا يجب تخزينها أبداً
   ========================================== */
const NEVER_CACHE = [
  '/api/login.php',
  '/api/register.php',
  '/api/logout.php',
  '/api/me.php',
  '/api/admin_',
  '/api/add_listing.php',
  '/api/delete_listing.php',
  '/api/update_listing.php',
  '/api/toggle_favorite.php',
  '/api/seed-admins.php',
];

/* ==========================================
   ⚡ 1. التثبيت (Install)
   ========================================== */
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 [SW] Pre-caching static assets...');
        // استخدام addAll مع تجاهل الأخطاء
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ [SW] Failed to cache: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Install complete');
        // تفعيل SW الجديد فوراً دون انتظار
        return self.skipWaiting();
      })
  );
});

/* ==========================================
   🔄 2. التنشيط (Activate)
   ========================================== */
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // احذف كل الكاشات القديمة (ما عدا الإصدار الحالي)
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
        // السيطرة على جميع الصفحات المفتوحة فوراً
        return self.clients.claim();
      })
  );
});

/* ==========================================
   🎯 3. الاعتراض (Fetch)
   ========================================== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ 1. تجاهل الطلبات غير GET
  if (request.method !== 'GET') return;

  // ✅ 2. تجاهل الطلبات الخارجية (خارج نطاق الموقع)
  if (url.origin !== self.location.origin) return;

  // ✅ 3. تجاهل طلبات API الحساسة (دائماً من الشبكة)
  if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
    return; // دع المتصفح يمررها كالعادة
  }

  // ✅ 4. استراتيجية خاصة لكل نوع ملف
  if (url.pathname.startsWith('/api/')) {
    // API عام (listings, stats) → Network First مع Cache Fallback
    event.respondWith(networkFirst(request, STATIC_CACHE, 5000));
    return;
  }

  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    // الخطوط → Cache First (نادراً ما تتغير)
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/)) {
    // الصور → Cache First مع حد أقصى 50 صورة
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, 50));
    return;
  }

  if (url.pathname.match(/\.(css|js)$/)) {
    // CSS/JS → Stale While Revalidate (نسخة سريعة + تحديث بالخلفية)
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.match(/\.(html)$/) || url.pathname === '/') {
    // HTML → Network First (للتحديثات الفورية)
    event.respondWith(networkFirst(request, STATIC_CACHE, 3000));
    return;
  }

  // البقية → Network First
  event.respondWith(networkFirst(request, STATIC_CACHE, 5000));
});

/* ==========================================
   🎨 استراتيجيات التخزين
   ========================================== */

/**
 * Cache First: ابحث في الكاش، وإذا لم يوجد اجلب من الشبكة
 * الأفضل للملفات الثابتة (خطوط، صور)
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('⚠️ [SW] CacheFirst failed:', request.url);
    // إرجاع صورة placeholder للصور
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#1A2438" width="400" height="300"/><text x="200" y="150" fill="#64748B" font-family="sans-serif" font-size="14" text-anchor="middle">لا يوجد اتصال</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw err;
  }
}

/**
 * Cache First with Limit: نفس Cache First لكن مع حد أقصى
 */
async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      
      // احذف أقدم الصور إذا تجاوزنا الحد
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

/**
 * Network First: اجلب من الشبكة أولاً، وإذا فشل استخدم الكاش
 * الأفضل للـ HTML و API العامة
 */
async function networkFirst(request, cacheName, timeout = 5000) {
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
    console.log('📡 [SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // إرجاع صفحة offline للـ HTML
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>لا يوجد اتصال</title><style>body{font-family:system-ui;background:#0B1120;color:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}h1{font-size:28px;margin-bottom:12px}p{color:#94A3B8;line-height:1.8;max-width:400px}button{margin-top:20px;padding:12px 28px;background:#3B82F6;color:white;border:none;border-radius:50px;font-size:16px;cursor:pointer;font-family:inherit}button:hover{background:#2563EB}</style></head><body><div><h1>📡 لا يوجد اتصال بالإنترنت</h1><p>يبدو أنك غير متصل. يرجى التحقق من اتصالك ثم إعادة المحاولة.</p><button onclick="location.reload()">إعادة المحاولة</button></div></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    throw err;
  }
}

/**
 * Stale While Revalidate: أعد النسخة المخزّنة فوراً + حدّثها بالخلفية
 * الأفضل لـ CSS/JS
 */
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
   📨 4. استقبال الرسائل من الصفحة الرئيسية
   ========================================== */
self.addEventListener('message', (event) => {
  console.log('📨 [SW] Message received:', event.data);
  
  // أمر: skipWaiting (لتحديث SW فوراً)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // أمر: مسح كل الكاش
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
  
  // أمر: إحصائيات الكاش
  if (event.data && event.data.type === 'GET_STATS') {
    event.waitUntil(
      getCacheStats().then(stats => {
        event.ports[0]?.postMessage(stats);
      })
    );
  }
});

/* ==========================================
   📊 إحصائيات الكاش
   ========================================== */
async function getCacheStats() {
  const stats = {};
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }
  
  return stats;
}

console.log('✅ [SW] Service Worker loaded');