/* ============================================================
   master-fix.js - الحل الشامل النهائي
   الإصدار: 5.0
   - إصلاح الصور المبكسلة (بدون w=1200)
   - بطاقات أفقية قابلة للسحب (Swipe) على الجوال
   - نقاط تنقل (Dots) تلقائية
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     1. ترقية روابط الصور - بدون تحديد العرض
     ========================================================== */
  function upgradeImageUrl(url) {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;

    if (url.includes('listing_image.php')) {
      let base = url.split('?')[0];
      let params = new URLSearchParams(url.split('?')[1] || '');

      // ✅ نضمن size=large بدون تحديد عرض
      if (!params.has('size')) {
        params.set('size', 'large');
      }
      params.set('q', '92');

      return base + '?' + params.toString();
    }

    return url
      .replace(/\/thumb\//g, '/large/')
      .replace(/\/small\//g, '/large/')
      .replace(/_thumb\./g, '_large.')
      .replace(/_small\./g, '_large.');
  }

  function hijackImageFunction() {
    if (typeof window.getListingImageUrl === 'function' && !window.__imgHijacked) {
      const original = window.getListingImageUrl;
      window.getListingImageUrl = function (listing, index, size) {
        const requestedSize = size || 'large';
        return upgradeImageUrl(original.call(this, listing, index, requestedSize));
      };
      window.__imgHijacked = true;
    }
  }

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

  function applyCardFix() {
    if (document.getElementById('js-card-fix')) return;
    const s = document.createElement('style');
    s.id = 'js-card-fix';
    s.textContent = `
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
        .grid.grid-4::-webkit-scrollbar { display: none !important; }

        .properties-grid > *, .cars-grid > *, .favorites-grid > *,
        .listings-grid > *, .grid.grid-4 > * {
          flex: 0 0 78% !important;
          width: 78% !important;
          max-width: 320px !important;
          scroll-snap-align: start !important;
          scroll-snap-stop: always !important;
        }

        .property-card, .car-card, .card {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 260px !important;
          overflow: hidden !important;
          border-radius: 16px !important;
          background: var(--bg-card, #fff) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
        }

        .property-card .card-image, .property-card .property-image,
        .car-card .card-image, .car-card .car-image {
          width: 100% !important;
          height: 160px !important;
          min-height: 160px !important;
          flex-shrink: 0 !important;
          overflow: hidden !important;
          border-radius: 0 !important;
          position: relative !important;
        }

        .property-card .card-image img, .car-card .card-image img,
        .property-card img, .car-card img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }

        .property-card .card-body, .property-card .property-content,
        .car-card .card-body, .car-card .car-content {
          flex: 1 !important;
          padding: 12px 14px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }

        .property-card .card-title, .car-card .card-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          margin: 0 0 6px 0 !important;
          line-height: 1.4 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        .property-card .card-price, .car-card .card-price {
          font-size: 16px !important;
          font-weight: 800 !important;
          color: var(--primary, #2563eb) !important;
          margin: 4px 0 !important;
        }

        .property-card .card-location, .car-card .card-location {
          font-size: 12px !important;
          opacity: 0.8 !important;
          margin: 0 !important;
        }

        .swipe-dots {
          display: flex !important;
          justify-content: center !important;
          gap: 6px !important;
          margin: 8px 0 16px 0 !important;
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

      @media (max-width: 480px) {
        .properties-grid > *, .cars-grid > *, .favorites-grid > *, .grid.grid-4 > * {
          flex: 0 0 85% !important;
          width: 85% !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function addSwipeDots() {
    if (window.innerWidth > 768) return;
    const grids = document.querySelectorAll(
      '.properties-grid, .cars-grid, .favorites-grid, .listings-grid, .grid.grid-4'
    );
    grids.forEach((grid) => {
      const cards = grid.querySelectorAll(':scope > *');
      if (cards.length < 2) return;
      const existingDots = grid.nextElementSibling;
      if (existingDots && existingDots.classList.contains('swipe-dots')) {
        existingDots.remove();
      }
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'swipe-dots';
      cards.forEach((_, i) => {
        const dot = document.createElement('span');
        if (i === 0) dot.classList.add('active');
        dot.dataset.idx = i;
        dotsWrap.appendChild(dot);
      });
      grid.parentElement.insertBefore(dotsWrap, grid.nextSibling);

      let scrollTimeout;
      grid.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const cardWidth = cards[0].offsetWidth + 12;
          const activeIdx = Math.round(grid.scrollLeft / cardWidth);
          dotsWrap.querySelectorAll('span').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIdx);
          });
        }, 50);
      }, { passive: true });
    });
  }

  function observe() {
    const obs = new MutationObserver(() => fixAllImages());
    obs.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['src']
    });
  }

  function init() {
    hijackImageFunction();
    applyCardFix();
    fixAllImages();
    observe();
    setTimeout(hijackImageFunction, 300);
    setTimeout(fixAllImages, 800);
    setTimeout(fixAllImages, 2000);
    setTimeout(fixAllImages, 4000);
    setTimeout(addSwipeDots, 1500);
    setTimeout(addSwipeDots, 3000);
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