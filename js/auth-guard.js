/* ==========================================
   ملف الحماية + إضافة زر الأدمن تلقائياً
   الإصدار: 2.0 (محسّن للأداء + بدون تكرار)
   ========================================== */

(function() {
  'use strict';

  /* ==========================================
     ✅ 1) حماية أزرار "أضف إعلان"
     - استخدام Event Delegation بدل مستمع لكل زر
     - يدعم الأزرار الديناميكية تلقائياً
     ========================================== */
  function protectAddListingButtons() {
    if (window.__authGuardAddProtected) return;
    window.__authGuardAddProtected = true;

    // ✅ مستمع واحد فقط على الـ document
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('a[href*="add-listing.html"]');
      if (!btn) return;

      if (!window.API || !API.Auth) return;

      if (!API.Auth.isLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();

        const isInPages = window.location.pathname.includes('/pages/');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        try {
          sessionStorage.setItem('souq_redirect_after_login', currentPage);
          sessionStorage.setItem('souq_login_message',
            'يجب تسجيل الدخول أولاً لإضافة إعلان');
        } catch (err) {}

        window.location.href = isInPages ? 'login.html' : 'pages/login.html';
        return false;
      }
    }, true); // ✅ capture: true لضمان التنفيذ قبل أي معالجات أخرى
  }

  /* ==========================================
     ✅ 2) إضافة زر "لوحة التحكم" للأدمن تلقائياً
     - يفحص إذا كان الزر موجوداً مسبقاً (من header-state.js)
     - يدعم إعادة المحاولة إذا لم تُحمّل API بعد
     ========================================== */
  function injectAdminButton(attempt) {
    attempt = attempt || 0;

    if (!window.API || !API.Users || typeof API.Users.isAdmin !== 'function') {
      // ✅ إعادة محاولة محدودة (حتى 2 ثانية)
      if (attempt < 10) {
        setTimeout(function() { injectAdminButton(attempt + 1); }, 200);
      }
      return;
    }

    if (!API.Users.isAdmin()) return;

    // ✅ تحقق إذا كان الزر موجوداً مسبقاً (من header-state.js)
    if (document.getElementById('adminPanelBtn')) return;

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const isInPages = window.location.pathname.includes('/pages/');
    const adminLink = isInPages ? 'admin.html' : 'pages/admin.html';

    const btn = document.createElement('a');
    btn.href = adminLink;
    btn.className = 'btn-admin-panel';
    btn.id = 'adminPanelBtn';
    btn.innerHTML = `
      <i data-lucide="shield-check"></i>
      <span>لوحة التحكم</span>
    `;

    const addBtn = headerActions.querySelector('.btn-primary');
    if (addBtn) {
      headerActions.insertBefore(btn, addBtn);
    } else {
      headerActions.appendChild(btn);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================
     ✅ 3) إظهار زر "لوحة التحكم" الثابت (لو موجود في HTML)
     ========================================== */
  function showStaticAdminButton(attempt) {
    attempt = attempt || 0;

    const btn = document.getElementById('adminPanelBtn');
    if (!btn) return;

    if (!window.API || !API.Users || typeof API.Users.isAdmin !== 'function') {
      if (attempt < 10) {
        setTimeout(function() { showStaticAdminButton(attempt + 1); }, 200);
      }
      return;
    }

    if (API.Users.isAdmin()) {
      btn.style.display = 'inline-flex';
    }
  }

  /* ==========================================
     التشغيل
     ========================================== */
  function init() {
    protectAddListingButtons();
    injectAdminButton();
    showStaticAdminButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();