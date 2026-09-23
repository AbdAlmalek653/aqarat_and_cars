/* ==========================================
   إدارة أزرار الهيدر تلقائياً
   حسب حالة تسجيل الدخول والدور
   ========================================== */

(function() {

  /* ==========================================
     تحديد المسار حسب موقع الصفحة
     ========================================== */
  function getBasePath() {
    const path = window.location.pathname;
    const isInPages = path.includes('/pages/');
    return {
      isInPages: isInPages,
      account: isInPages ? 'account.html' : 'pages/account.html',
      admin: isInPages ? 'admin.html' : 'pages/admin.html',
      login: isInPages ? 'login.html' : 'pages/login.html',
      index: isInPages ? '../index.html' : 'index.html'
    };
  }

  /* ==========================================
     إنشاء زر جديد (مع دعم id اختياري)
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
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onClick(e);
      });
    }
    return btn;
  }

  /* ==========================================
     إدارة أزرار الهيدر
     ========================================== */
  function updateHeader() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // إذا المستخدم ما هو مسجل → لا نعمل شي (يبقى زر "تسجيل الدخول")
    if (!window.API || !API.Users || !API.Users.isLoggedIn || !API.Users.isLoggedIn()) {
      return;
    }

    const user = API.Users.getCurrent();
    const paths = getBasePath();

    // ==========================================
    // 1) إخفاء زر "تسجيل الدخول"
    // ==========================================
    const loginBtn = headerActions.querySelector('.btn-login');
    if (loginBtn) loginBtn.style.display = 'none';

    // ==========================================
    // 2) إضافة زر "حسابي"
    // ==========================================
    const accountBtn = createButton({
      href: paths.account,
      className: 'btn-header-account',
      iconName: 'user',
      text: user.name ? user.name.split(' ')[0] : 'حسابي'
    });

    // ==========================================
    // 3) إضافة زر "لوحة التحكم" للأدمن فقط
    //    (مع id لمنع تكراره في auth-guard.js)
    // ==========================================
    let adminBtn = null;
    if (API.Users.isAdmin && API.Users.isAdmin()) {
      adminBtn = createButton({
        id: 'adminPanelBtn',
        href: paths.admin,
        className: 'btn-admin-panel',
        iconName: 'shield-check',
        text: 'لوحة التحكم'
      });
    }

    // ==========================================
    // 4) إضافة زر "خروج" (يحتفظ ببيانات "تذكرني")
    // ==========================================
    const logoutBtn = createButton({
      href: '#',
      className: 'btn-header-logout',
      iconName: 'log-out',
      text: 'خروج',
      onClick: (e) => {
        if (e) e.preventDefault();

        // ✅ مسح الجلسة الحقيقية فقط، مع الاحتفاظ ببيانات "تذكرني"
        try {
          localStorage.removeItem('souq_current_user');
          // ⚠️ لا نمسح souq_remembered_user حتى تبقى بيانات "تذكرني"
          sessionStorage.removeItem('souq_redirect_after_login');
        } catch (err) {
          console.error('خطأ في مسح الجلسة:', err);
        }

        // استدعاء دالة الـ API كاحتياط إضافي
        try {
          if (window.API && API.Users && API.Users.logout) {
            API.Users.logout();
          }
        } catch (err) {
          console.error('خطأ في API.Users.logout:', err);
        }

        // التوجيه المباشر للصفحة الرئيسية
        window.location.href = paths.index;
      }
    });

    // ==========================================
    // 5) ترتيب الأزرار في الهيدر
    // ==========================================
    const addBtn = headerActions.querySelector('.btn-primary');

    if (adminBtn) {
      headerActions.insertBefore(adminBtn, addBtn || null);
    }

    headerActions.insertBefore(accountBtn, addBtn || null);
    headerActions.insertBefore(logoutBtn, addBtn || null);

    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================
     التشغيل
     ========================================== */
  function init() {
    if (window.API && API.Users) {
      updateHeader();
    } else {
      setTimeout(updateHeader, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();