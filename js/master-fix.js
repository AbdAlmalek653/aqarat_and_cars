/* ============================================================
   master-fix.js - الحل الشامل النهائي
   - إصلاح الصور المبكسلة
   - بطاقات أفقية قابلة للسحب (Swipe) على الجوال
   - نقاط تنقل (Dots) تلقائية
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     1. ترقية روابط الصور (لمنع البكسلة)
     ========================================================== */
  function upgradeImageUrl(url) {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;

    if (url.includes('listing_image.php')) {
      let base = url.split('?')[0];
      let params = new URLSearchParams(url.split('?')[1] || '');
      params.set('w', '1200');
      params.set('h', '900');
      params.set('q', '90');
      params.set('full', '1');
      return base + '?' + params.toString();
    }

    return url
      .replace(/\/thumb\//g, '/large/')
      .replace(/\/small\//g, '/large/')
      .replace(/_thumb\./g, '_large.')
      .replace(/_small\./g, '_large.');
  }

  /* اعتراض دالة getListingImageUrl */
  function hijackImageFunction() {
    if (typeof window.getListingImageUrl === 'function' && !window.__imgHijacked) {
      const original = window.getListingImageUrl;
      window.getListingImageUrl = function (listing, index) {
        return upgradeImageUrl(original.call(this, listing, index));
      };
      window.__imgHijacked = true;
    }
  }

  /* إصلاح كل الصور */
  function fixAllImages() {
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:') && !img.dataset.fixed) {
        const newSrc = upgradeImageUrl(src);
        if (newSrc !== src) {
          img.dataset.fixed = '1';
          img.setAttribute('src', newSrc);
        }
      }
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
  }

  /* ==========================================================
     2. البطاقات الأفقية القابلة للسحب + Dots
     ========================================================== */
  function applyCardFix() {
    if (document.getElementById('js-card-fix')) return;
    const s = document.createElement('style');
    s.id = 'js-card-fix';
    s.textContent = `
      /* ============ الحاوية: سحب أفقي ============ */
      @media (max-width: 768px) {
        .properties-grid, .cars-grid, .favorites-grid, .listings-grid, .grid.grid-4 {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-snap-type: x mandatory !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          gap: 12px !important;
          padding: 8px 12px 16px 12px !important;
          margin: 0 -12px !important;
          scrollbar-width: none !important;
        }

        .properties-grid::-webkit-scrollbar,
        .cars-grid::-webkit-scrollbar,
        .favorites-grid::-webkit-scrollbar,
        .listings-grid::-webkit-scrollbar,
        .grid.grid-4::-webkit-scrollbar {
          display: none !important;
        }

        /* ============ البطاقة نفسها ============ */
        .properties-grid > *,
        .cars-grid > *,
        .favorites-grid > *,
        .listings-grid > *,
        .grid.grid-4 > * {
          flex: 0 0 78% !important;
          width: 78% !important;
          max-width: 320px !important;
          scroll-snap-align: start !important;
          scroll-snap-stop: always !important;
        }

        /* ============ شكل البطاقة (عمودية) ============ */
        .property-card, .car-card, .card {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 260px !important;
          overflow: hidden !important;
          border-radius: 16px !important;
          background: var(--bg-card, #fff) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          transition: transform 0.2s ease !important;
        }

        .property-card:active, .car-card:active {
          transform: scale(0.98) !important;
        }

        /* ============ الصورة (فوق) ============ */
        .property-card .card-image,
        .property-card .property-image,
        .car-card .card-image,
        .car-card .car-image {
          width: 100% !important;
          height: 160px !important;
          min-height: 160px !important;
          flex-shrink: 0 !important;
          overflow: hidden !important;
          border-radius: 0 !important;
          position: relative !important;
        }

        .property-card .card-image img,
        .property-card .property-image img,
        .car-card .card-image img,
        .car-card .car-image img,
        .property-card > img,
        .car-card > img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }

        /* ============ المحتوى (تحت) ============ */
        .property-card .card-body,
        .property-card .property-content,
        .car-card .card-body,
        .car-card .car-content {
          flex: 1 !important;
          padding: 12px 14px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }

        /* ============ النصوص ============ */
        .property-card .card-title,
        .property-card .property-title,
        .car-card .card-title,
        .car-card .car-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          margin: 0 0 6px 0 !important;
          line-height: 1.4 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        .property-card .card-price,
        .property-card .property-price,
        .car-card .card-price,
        .car-card .car-price {
          font-size: 16px !important;
          font-weight: 800 !important;
          color: var(--primary, #2563eb) !important;
          margin: 4px 0 !important;
        }

        .property-card .card-location,
        .car-card .card-location {
          font-size: 12px !important;
          opacity: 0.8 !important;
          margin: 0 !important;
        }

        /* ============ الشارات ============ */
        .property-card .card-badge,
        .property-card .property-badge,
        .car-card .card-badge {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          font-size: 11px !important;
          padding: 4px 10px !important;
          border-radius: 8px !important;
          z-index: 2 !important;
        }

        /* ============ زر المفضلة ============ */
        .property-card .fav-btn,
        .car-card .fav-btn {
          top: 8px !important;
          left: 8px !important;
          width: 32px !important;
          height: 32px !important;
          z-index: 3 !important;
        }

        /* ============ نقاط التنقل (Dots) ============ */
        .swipe-dots {
          display: flex !important;
          justify-content: center !important;
          gap: 6px !important;
          margin: 8px 0 16px 0 !important;
          padding: 0 !important;
        }

        .swipe-dots span {
          width: 6px !important;
          height: 6px !important;
          border-radius: 3px !important;
          background: #4B5563 !important;
          transition: all 0.3s ease !important;
        }

        .swipe-dots span.active {
          width: 20px !important;
          background: #3B82F6 !important;
        }
      }

      /* ============ شاشات صغيرة جداً ============ */
      @media (max-width: 480px) {
        .properties-grid > *,
        .cars-grid > *,
        .favorites-grid > *,
        .grid.grid-4 > * {
          flex: 0 0 85% !important;
          width: 85% !important;
        }

        .property-card .card-image,
        .car-card .card-image {
          height: 150px !important;
          min-height: 150px !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ==========================================================
     3. إضافة نقاط التنقل (Dots) تحت البطاقات
     ========================================================== */
  function addSwipeDots() {
    if (window.innerWidth > 768) return;

    const grids = document.querySelectorAll(
      '.properties-grid, .cars-grid, .favorites-grid, .listings-grid, .grid.grid-4'
    );

    grids.forEach((grid) => {
      // تجاهل لو ما في بطاقات
      const cards = grid.querySelectorAll(':scope > *');
      if (cards.length < 2) return;

      // احذف النقاط القديمة لو موجودة
      const existingDots = grid.nextElementSibling;
      if (existingDots && existingDots.classList.contains('swipe-dots')) {
        existingDots.remove();
      }

      // إنشاء حاوية النقاط
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'swipe-dots';

      cards.forEach((_, i) => {
        const dot = document.createElement('span');
        if (i === 0) dot.classList.add('active');
        dot.dataset.idx = i;
        dotsWrap.appendChild(dot);
      });

      // إضافة النقاط بعد الشبكة
      grid.parentElement.insertBefore(dotsWrap, grid.nextSibling);

      // تحديث النقطة النشطة عند السحب
      let scrollTimeout;
      grid.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const cardWidth = cards[0].offsetWidth + 12; // 12 = gap
          const activeIdx = Math.round(grid.scrollLeft / cardWidth);
          dotsWrap.querySelectorAll('span').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIdx);
          });
        }, 50);
      }, { passive: true });

      // النقر على النقطة ينقل للبطاقة
      dotsWrap.querySelectorAll('span').forEach((dot) => {
        dot.addEventListener('click', () => {
          const idx = parseInt(dot.dataset.idx, 10);
          const cardWidth = cards[0].offsetWidth + 12;
          grid.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
        });
      });
    });
  }

  /* ==========================================================
     4. مراقبة DOM
     ========================================================== */
  function observe() {
    const obs = new MutationObserver(() => {
      fixAllImages();
    });
    obs.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['src']
    });
  }

  /* ==========================================================
     5. التشغيل
     ========================================================== */
  function init() {
    hijackImageFunction();
    applyCardFix();
    fixAllImages();
    observe();

    setTimeout(hijackImageFunction, 300);
    setTimeout(fixAllImages, 800);
    setTimeout(fixAllImages, 2000);
    setTimeout(fixAllImages, 4000);

    // إضافة Dots بعد تحميل البطاقات
    setTimeout(addSwipeDots, 1500);
    setTimeout(addSwipeDots, 3000);
    setTimeout(addSwipeDots, 5000);

    // إعادة إنشاء Dots عند تغيير حجم الشاشة
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.querySelectorAll('.swipe-dots').forEach(d => d.remove());
        addSwipeDots();
      }, 300);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();