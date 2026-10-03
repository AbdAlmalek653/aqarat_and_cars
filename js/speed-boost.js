/* ==========================================
   ⚡⚡⚡⚡⚡ SPEED BOOST ULTIMATE
   أعلى معايير السرعة والاستجابة
   ========================================== */
(function() {
  'use strict';
  console.log('⚡⚡⚡ Speed Boost ULTIMATE loading...');

  // ==========================================
  // 1. كل العناصر التفاعلية
  // ==========================================
  const SELECTOR = [
    'button',
    'a[href]',
    '[role="button"]',
    '.btn',
    '.btn-primary',
    '.btn-icon',
    '.btn-login',
    '.btn-add-listing-mobile',
    '.card',
    '.cascade-btn',
    '.browse-option',
    '.add-type-option',
    '.mobile-menu-item',
    '.bottom-nav-item',
    '.scroll-strip',
    '.link-more',
    '.tab',
    '.view-btn',
    '.page-btn',
    '.filter-option',
    '.filter-toggle-btn',
    '.sort-select',
    '.mobile-menu-toggle',
    '.mobile-menu-close',
    '.browse-modal-close',
    '.add-type-close',
    '.welcome-close',
    '.nav a',
    '.logo',
    'input',
    'textarea',
    'select'
  ].join(',');

  // ==========================================
  // 2. تفعيل الاستجابة الفورية على عنصر
  // ==========================================
  function boostElement(el) {
    if (!el || el.dataset.speedBoosted === '1') return;
    if (el.tagName === 'HTML' || el.tagName === 'BODY') return;
    el.dataset.speedBoosted = '1';

    // ✅ إزالة 300ms delay
    el.style.touchAction = 'manipulation';
    el.style.webkitTapHighlightColor = 'transparent';

    // ✅ تسريع GPU
    el.style.transform = 'translateZ(0)';
    el.style.webkitTransform = 'translateZ(0)';
    el.style.backfaceVisibility = 'hidden';
    el.style.webkitBackfaceVisibility = 'hidden';
    el.style.willChange = 'transform, opacity';

    // ✅ استجابة فورية عند اللمس (قبل click)
    el.addEventListener('pointerdown', function(e) {
      // نتجاهل الأزرار المعطلة
      if (this.disabled) return;

      // استجابة فورية - تأثير بصري
      this.style.transitionDuration = '0.02s';
      this.style.transform = 'scale(0.95) translateZ(0)';
      this.style.opacity = '0.85';

      // إعادة الحالة عند رفع الإصبع
      const reset = () => {
        this.style.transform = 'translateZ(0)';
        this.style.opacity = '';
        this.style.transitionDuration = '';
      };

      el.addEventListener('pointerup', reset, { once: true, passive: true });
      el.addEventListener('pointercancel', reset, { once: true, passive: true });
      el.addEventListener('pointerleave', reset, { once: true, passive: true });
    }, { passive: true });

    // ✅ استجابة فورية للفأرة (Desktop)
    el.addEventListener('mouseenter', function() {
      this.style.transitionDuration = '0.08s';
    }, { passive: true });

    el.addEventListener('mousedown', function() {
      if (this.disabled) return;
      this.style.transitionDuration = '0.02s';
      this.style.transform = 'scale(0.96) translateZ(0)';
    }, { passive: true });

    el.addEventListener('mouseup', function() {
      this.style.transform = 'translateZ(0)';
    }, { passive: true });

    el.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.opacity = '';
    }, { passive: true });
  }

  // ==========================================
  // 3. تفعيل على كل العناصر الموجودة
  // ==========================================
  function applyToAll() {
    const elements = document.querySelectorAll(SELECTOR);
    let count = 0;
    elements.forEach(el => {
      if (!el.dataset.speedBoosted) {
        boostElement(el);
        count++;
      }
    });
    return count;
  }

  // ==========================================
  // 4. تفعيل الحدث الفوري على مستوى الـ document (سريع جداً)
  // ==========================================
  function installGlobalHandlers() {
    // ✅ استجابة فورية على مستوى الـ Document
    document.addEventListener('pointerdown', function(e) {
      const target = e.target.closest(SELECTOR);
      if (!target || target.disabled) return;
      
      // تأثير بصري فوري
      if (!target.dataset.speedBoosted) {
        target.style.transitionDuration = '0.02s';
        target.style.transform = 'scale(0.95) translateZ(0)';
        setTimeout(() => {
          target.style.transform = 'translateZ(0)';
        }, 80);
      }
    }, { capture: true, passive: true });

    // ✅ استخدام capture phase لكل الـ clicks
    document.addEventListener('click', function(e) {
      const target = e.target.closest(SELECTOR);
      if (target) {
        // إضافة pulse مرئي بسيط
        target.style.transition = 'transform 0.1s ease-out';
        setTimeout(() => {
          if (target) target.style.transition = '';
        }, 100);
      }
    }, { capture: true, passive: true });
  }

  // ==========================================
  // 5. تشغيل
  // ==========================================
  function init() {
    const count = applyToAll();
    console.log('⚡ Boosted', count, 'elements');
    installGlobalHandlers();
  }

  // تشغيل فوري
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // تشغيل إضافي بعد تحميل الصفحة كاملة
  window.addEventListener('load', () => {
    applyToAll();
    console.log('⚡ Load-time boost applied');
  });

  // ==========================================
  // 6. مراقبة العناصر الجديدة (بطاقات، إعلانات جديدة)
  // ==========================================
  const observer = new MutationObserver(function(mutations) {
    let hasNew = false;
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) hasNew = true;
      });
    });
    if (hasNew) {
      // تأجيل بسيط لتحسين الأداء
      if (window.requestIdleCallback) {
        window.requestIdleCallback(applyToAll);
      } else {
        setTimeout(applyToAll, 50);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // ==========================================
  // 7. ضمان عدم وجود تأخير في التمرير
  // ==========================================
  document.addEventListener('touchstart', function() {}, { passive: true });
  document.addEventListener('touchmove', function() {}, { passive: true });

  console.log('✅ Speed Boost ULTIMATE ready');

})();
/* ==========================================
   ✅ تحميل brand.js تلقائياً
   ========================================== */
(function() {
  if (window.__brandLoaded) return;
  window.__brandLoaded = true;
  
  const script = document.createElement('script');
  const isInPages = window.location.pathname.includes('/pages/');
  script.src = isInPages ? '../js/brand.js' : 'js/brand.js';
  script.defer = true;
  document.head.appendChild(script);
})();