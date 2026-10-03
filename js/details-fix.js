/* ============================================================
   details-fix.js - إصلاح مشكلة الصور المبكسلة في صفحة التفاصيل
   ============================================================ */

(function () {
  'use strict';

  /**
   * تحويل رابط الصورة المصغرة إلى صورة كبيرة
   * لو السيرفر عم يرجع صورة صغيرة، منضيف باراميترات للطلب
   */
  function upgradeImageUrl(url) {
    if (!url || typeof url !== 'string') return url;

    // لو الرابط فيه listing_image.php نضيف باراميترات الجودة
    if (url.includes('listing_image.php')) {
      const sep = url.includes('?') ? '&' : '?';
      // نطلب صورة بحجم كبير
      return url + sep + 'w=1200&h=900&q=90&full=1';
    }

    // لو الرابط من API فيه حجم صغير، نستبدله
    return url
      .replace(/[?&]w=\d+/, '')
      .replace(/[?&]h=\d+/, '')
      .replace(/\/thumb\//, '/full/')
      .replace(/_thumb\./, '_full.')
      .replace(/_small\./, '_large.');
  }

  /**
   * انتظر ظهور العنصر في الصفحة
   */
  function waitFor(selector, callback, maxTries = 50) {
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        callback(el);
      } else if (++tries > maxTries) {
        clearInterval(timer);
      }
    }, 100);
  }

  /**
   * إصلاح الصورة الرئيسية في المعرض
   */
  function fixMainImage() {
    waitFor('#mainImage', (img) => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc && !originalSrc.startsWith('data:')) {
        const newSrc = upgradeImageUrl(originalSrc);
        if (newSrc !== originalSrc) {
          img.setAttribute('src', newSrc);
        }
      }

      // راقب أي تغيير في src (لما يغير المستخدم الصورة)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          if (m.attributeName === 'src') {
            const src = img.getAttribute('src');
            if (src && !src.includes('w=1200')) {
              const fixed = upgradeImageUrl(src);
              if (fixed !== src && !img.dataset.fixing) {
                img.dataset.fixing = '1';
                img.setAttribute('src', fixed);
                setTimeout(() => { delete img.dataset.fixing; }, 100);
              }
            }
          }
        });
      });
      observer.observe(img, { attributes: true, attributeFilter: ['src'] });
    });
  }

  /**
   * إصلاح كل الصور المصغرة
   */
  function fixThumbs() {
    waitFor('#galleryThumbs', (container) => {
      const fixAll = () => {
        container.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src');
          if (src && !src.includes('w=1200') && !src.startsWith('data:')) {
            img.setAttribute('src', upgradeImageUrl(src));
          }
        });
      };
      fixAll();

      const observer = new MutationObserver(fixAll);
      observer.observe(container, { childList: true, subtree: true });
    });
  }

  /**
   * إصلاح صور البطاقات الأفقية (لو موجودة في الصفحة)
   */
  function fixCardImages() {
    document.querySelectorAll(
      '.property-card img, .car-card img, .listing-card img'
    ).forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        img.setAttribute('src', upgradeImageUrl(src));
      }
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
  }

  /**
   * تشغيل كل الإصلاحات لما تحمّل الصفحة
   */
  function init() {
    fixMainImage();
    fixThumbs();
    fixCardImages();

    // أعد التشغيل بعد ما يخلّص details.js شغله
    setTimeout(() => {
      fixMainImage();
      fixThumbs();
      fixCardImages();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();