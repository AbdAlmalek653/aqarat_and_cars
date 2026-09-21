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
     إنشاء زر جديد
     ========================================== */
  function createButton({ href, className, iconName, text, onClick }) {
    const btn = document.createElement('a');
    btn.href = href || '#';
    btn.className = className;
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
    // ==========================================
    let adminBtn = null;
    if (API.Users.isAdmin && API.Users.isAdmin()) {
      adminBtn = createButton({
        href: paths.admin,
        className: 'btn-admin-panel',
        iconName: 'shield-check',
        text: 'لوحة التحكم'
      });
    }

    // ==========================================
    // 4) إضافة زر "خروج"
    // ==========================================
    const logoutBtn = createButton({
      href: '#',
      className: 'btn-header-logout',
      iconName: 'log-out',
      text: 'خروج',
      onClick: () => {
        if (!confirm('هل تريد تسجيل الخروج؟')) return;
        API.Users.logout();
        window.location.href = paths.index;
      }
    });

    // ==========================================
    // 5) ترتيب الأزرار في الهيدر
    // ==========================================
    const addBtn = headerActions.querySelector('.btn-primary');

    // إضافة زر "لوحة التحكم" أولاً (إن كان أدمن)
    if (adminBtn) {
      headerActions.insertBefore(adminBtn, addBtn || null);
    }

    // إضافة زر "حسابي"
    headerActions.insertBefore(accountBtn, addBtn || null);

    // إضافة زر "خروج"
    headerActions.insertBefore(logoutBtn, addBtn || null);

    // إعادة تفعيل أيقونات Lucide
    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================
     التشغيل
     ========================================== */
  function init() {
    // ننتظر قليلاً حتى تُحمّل api.js
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