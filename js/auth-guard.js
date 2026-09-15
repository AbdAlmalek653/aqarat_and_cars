/* ==========================================
   حماية أزرار "أضف إعلان" - يعمل على كل الصفحات
   ========================================== */

(function() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectButtons);
  } else {
    protectButtons();
  }
})();