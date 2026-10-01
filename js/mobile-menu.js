/* ==========================================
   🍔 إصلاح زر الهامبرغر - مضمون 100%
   ========================================== */
(function() {
  'use strict';

  console.log('🍔 Mobile menu script loading...');

  function initMobileMenu() {
    // ===== 1. التحقق من وجود العناصر =====
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMobileMenu');

    console.log('🔍 العناصر:', {
      toggleBtn: !!toggleBtn,
      menu: !!menu,
      overlay: !!overlay,
      closeBtn: !!closeBtn
    });

    if (!toggleBtn) {
      console.warn('⚠️ زر الهامبرغر غير موجود (#mobileMenuToggle)');
      return;
    }

    // ===== 2. دوال الفتح والإغلاق =====
    function openMenu() {
      console.log('✅ فتح القائمة');
      if (menu) {
        menu.classList.add('show');
        menu.style.right = '0';
      }
      if (overlay) {
        overlay.classList.add('show');
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
      }
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    }

    function closeMenu() {
      console.log('❌ إغلاق القائمة');
      if (menu) {
        menu.classList.remove('show');
        menu.style.right = '';
      }
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
      }
      document.body.style.overflow = '';
    }

    // ===== 3. Event Delegation - يلتقط كل الضغطات مهما كان =====
    document.addEventListener('click', function(e) {
      // 3.1 - ضغط على زر الهامبرغر
      if (e.target.closest('#mobileMenuToggle')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openMenu();
        return false;
      }

      // 3.2 - ضغط على زر الإغلاق
      if (e.target.closest('#closeMobileMenu')) {
        e.preventDefault();
        closeMenu();
        return false;
      }

      // 3.3 - ضغط على الـ overlay
      if (e.target.id === 'mobileMenuOverlay' || e.target.closest('#mobileMenuOverlay')) {
        e.preventDefault();
        closeMenu();
        return false;
      }
    }, true); // capture: true

    // ===== 4. إغلاق بمفتاح ESC =====
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });

    // ===== 5. تتبع ضغطات الزر مباشرة (احتياطي) =====
    toggleBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🟢 الضغط المباشر على الزر');
      if (menu && menu.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
      return false;
    };

    console.log('✅ Mobile menu installed successfully');
  }

  // ===== 6. التشغيل =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    // الصفحة جاهزة، شغل مباشرة
    initMobileMenu();
  }

  // ===== 7. تشغيل إضافي بعد تحميل كامل (احتياطي) =====
  window.addEventListener('load', function() {
    if (!window.__mobileMenuInstalled) {
      initMobileMenu();
      window.__mobileMenuInstalled = true;
    }
  });

})();