/* ==========================================
   Service Worker Registration
   ملف موحّد لتسجيل SW في كل الصفحات
   ========================================== */

(function() {
  'use strict';

  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ [SW] Service Worker not supported');
    return;
  }

  window.addEventListener('load', () => {
    // ✅ مسار مطلق: يعمل من أي صفحة (root أو pages/)
    const swPath = '/sw.js';

    navigator.serviceWorker.register(swPath, {
      scope: '/'
    })
    .then((registration) => {
      console.log('✅ [SW] Registered:', registration.scope);

      // تحقق من التحديثات
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 [SW] Update found, installing new version...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('✨ [SW] New version ready. Reload to update.');
              // يمكن هنا إظهار toast للمستخدم
              if (window.showSWUpdateToast) {
                window.showSWUpdateToast();
              }
            } else {
              console.log('✅ [SW] Content cached for offline use');
            }
          }
        });
      });

      // تحقق دورياً من التحديثات (كل ساعة)
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    })
    .catch((err) => {
      console.warn('⚠️ [SW] Registration failed:', err);
    });
  });

  // ✅ عند تغيير الـ controller (تحديث SW)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('🔄 [SW] Controller changed, reloading...');
    // window.location.reload(); // اختياري - قد يزعج المستخدم
  });

})();