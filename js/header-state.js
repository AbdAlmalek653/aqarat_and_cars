/* ==========================================
   إدارة أزرار الهيدر تلقائياً
   الإصدار: 2.0 (محسّن: كاش المسارات + منع التكرار + تنظيف)
   ========================================== */

(function() {
  'use strict';

  /* ==========================================
     ✅ كاش المسارات (يُحسب مرة واحدة فقط)
     ========================================== */
  const PATHS = (function() {
    const isInPages = window.location.pathname.includes('/pages/');
    return {
      isInPages: isInPages,
      account: isInPages ? 'account.html' : 'pages/account.html',
      admin:   isInPages ? 'admin.html' : 'pages/admin.html',
      login:   isInPages ? 'login.html' : 'pages/login.html',
      index:   isInPages ? '../index.html' : 'index.html'
    };
  })();

  /* ==========================================
     إنشاء زر (مع دعم id اختياري)
     ========================================== */
  function createButton({ id, href, className, iconName, text, onClick }) {
    const btn = document.createElement('a');
    btn.href = href || '#';
    btn.className = className;
    if (id) btn.id = id;
    btn.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${text}</span>
    `;
    if (onClick) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        onClick(e);
      });
    }
    return btn;
  }

  /* ==========================================
     ✅ إزالة أزرار الهيدر الديناميكية السابقة
     (لتجنب التكرار عند إعادة التحديث)
     ========================================== */
  function removeExistingDynamicButtons() {
    ['.btn-header-account', '.btn-header-logout'].forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(btn) {
        btn.remove();
      });
    });
    // ⚠️ لا نحذف adminPanelBtn لأنه يُدار من auth-guard.js
  }

  /* ==========================================
     ✅ إخفاء زر "تسجيل الدخول" إذا كان المستخدم مسجلاً
     ========================================== */
  function hideLoginButton() {
    const loginBtn = document.querySelector('.header-actions .btn-login');
    if (loginBtn) loginBtn.style.display = 'none';
  }

  /* ==========================================
     إدارة أزرار الهيدر
     ========================================== */
  function updateHeader() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // إذا المستخدم غير مسجل → لا نعمل شيء
    if (!window.API || !API.Users || typeof API.Users.isLoggedIn !== 'function') {
      return false; // ✅ إشارة لإعادة المحاولة
    }

    if (!API.Users.isLoggedIn()) {
      return true; // ✅ لا حاجة لإعادة المحاولة
    }

    const user = API.Users.getCurrent();
    if (!user) return true;

    // ✅ 1) إخفاء زر "تسجيل الدخول"
    hideLoginButton();

    // ✅ 2) إزالة الأزرار الديناميكية القديمة
    removeExistingDynamicButtons();

    // ✅ 3) إنشاء زر "حسابي"
    const accountBtn = createButton({
      href: PATHS.account,
      className: 'btn-header-account',
      iconName: 'user',
      text: user.name ? user.name.split(' ')[0] : 'حسابي'
    });

    // ✅ 4) إنشاء زر "خروج"
    const logoutBtn = createButton({
      href: '#',
      className: 'btn-header-logout',
      iconName: 'log-out',
      text: 'خروج',
      onClick: function(e) {
        if (e) e.preventDefault();

        // ✅ مسح الجلسة الحقيقية فقط، مع الاحتفاظ بـ "تذكرني"
        try {
          localStorage.removeItem('souq_current_user');
          sessionStorage.removeItem('souq_redirect_after_login');
        } catch (err) {
          console.error('خطأ في مسح الجلسة:', err);
        }

        // ✅ استدعاء API logout
        try {
          if (window.API && API.Users && API.Users.logout) {
            API.Users.logout();
          }
        } catch (err) {
          console.error('خطأ في API.Users.logout:', err);
        }

        window.location.href = PATHS.index;
      }
    });

    // ✅ 5) ترتيب الأزرار
    const addBtn = headerActions.querySelector('.btn-primary');

    headerActions.insertBefore(accountBtn, addBtn || null);
    headerActions.insertBefore(logoutBtn, addBtn || null);

    // ⚠️ زر adminPanelBtn يُدار من auth-guard.js — لا نكرره هنا

    if (window.lucide) window.lucide.createIcons();
    return true;
  }

  /* ==========================================
     ✅ إعادة المحاولة حتى تحميل API
     ========================================== */
  function init(attempt) {
    attempt = attempt || 0;

    if (!window.API || !API.Users) {
      if (attempt < 15) {
        setTimeout(function() { init(attempt + 1); }, 200);
      }
      return;
    }

    const done = updateHeader();
    if (done === false && attempt < 15) {
      setTimeout(function() { init(attempt + 1); }, 200);
    }
  }

  /* ==========================================
     ✅ تحديث تلقائي عند تغيير حالة تسجيل الدخول
     (مثلاً من تبويب آخر)
     ========================================== */
  window.addEventListener('storage', function(e) {
    if (e.key === 'souq_current_user') {
      window.location.reload();
    }
  });

  /* ==========================================
     تشغيل
     ========================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(0); });
  } else {
    init(0);
  }

})();