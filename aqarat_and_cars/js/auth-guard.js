/* ==========================================
   ملف الحماية + إضافة زر الأدمن تلقائياً
   يعمل على كل الصفحات
   ========================================== */

(function() {

  /* ==========================================
     1) حماية أزرار "أضف إعلان"
     ========================================== */
  function protectButtons() {
    if (!window.API || !API.Auth) return;

    const buttons = document.querySelectorAll('a[href*="add-listing.html"]');
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
      if (btn.dataset.protected === '1') return;
      btn.dataset.protected = '1';

      btn.addEventListener('click', (e) => {
        if (!API.Auth.isLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();

          const isInPages = window.location.pathname.includes('/pages/');
          const currentPage = window.location.pathname.split('/').pop() || 'index.html';

          sessionStorage.setItem('souq_redirect_after_login', currentPage);
          sessionStorage.setItem('souq_login_message',
            'يجب تسجيل الدخول أولاً لإضافة إعلان');

          window.location.href = isInPages ? 'login.html' : 'pages/login.html';
          return false;
        }
      }, true);
    });
  }

  /* ==========================================
     2) إضافة زر "لوحة التحكم" للأدمن تلقائياً
     ========================================== */
  function injectAdminButton() {
    // التحقق من أن المستخدم أدمن
    if (!window.API || !API.Users || !API.Users.isAdmin || !API.Users.isAdmin()) {
      return;
    }

    // إذا الزر موجود من قبل، لا نضيفه
    if (document.getElementById('adminPanelBtn')) return;

    // البحث عن حاوية الأزرار في الهيدر
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // تحديد المسار الصح للرابط
    const isInPages = window.location.pathname.includes('/pages/');
    const adminLink = isInPages ? 'admin.html' : 'pages/admin.html';

    // إنشاء الزر
    const btn = document.createElement('a');
    btn.href = adminLink;
    btn.className = 'btn-admin-panel';
    btn.id = 'adminPanelBtn';
    btn.innerHTML = `
      <i data-lucide="shield-check"></i>
      <span>لوحة التحكم</span>
    `;

    // إضافته قبل زر "أضف إعلان" (أو في نهاية الأزرار)
    const addBtn = headerActions.querySelector('.btn-primary');
    if (addBtn) {
      headerActions.insertBefore(btn, addBtn);
    } else {
      headerActions.appendChild(btn);
    }

    // إعادة تفعيل أيقونات Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================
     3) زر "لوحة التحكم" الثابت (لو موجود في HTML)
     ========================================== */
  function showStaticAdminButton() {
    const btn = document.getElementById('adminPanelBtn');
    if (!btn) return;

    // إذا كان الزر مضافاً يدوياً في HTML (بـ style="display:none;")
    if (window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin()) {
      btn.style.display = 'inline-flex';
    }
  }

  /* ==========================================
     التشغيل
     ========================================== */
  function init() {
    protectButtons();
    injectAdminButton();
    showStaticAdminButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();