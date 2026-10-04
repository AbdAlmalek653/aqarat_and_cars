/* ==========================================
   app-inline.js - النسخة النهائية الكاملة
   الإصدار: 3.2 (محسّن + حماية ضد الأخطاء)
   ========================================== */

/* ==========================================
   🟢 1. نافذة تصفح الإعلانات (Browse Modal)
   ========================================== */
(function () {
  'use strict';

  function openBrowseModal() {
    const modal = document.getElementById('browseModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeBrowseModal() {
    const modal = document.getElementById('browseModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = '';
    document.body.style.overflow = '';
  }

  function scrollToSection(sectionId) {
    closeBrowseModal();
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
      const container = section.querySelector('.container');
      if (container) {
        container.style.transition = 'box-shadow 0.5s ease, border-radius 0.5s ease';
        container.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)';
        container.style.borderRadius = '20px';
        setTimeout(() => {
          container.style.boxShadow = '';
          container.style.borderRadius = '';
        }, 1800);
      }
    }, 350);
  }

  document.addEventListener('click', function (e) {
    const browseBtn = e.target.closest('#browseBtn');
    if (browseBtn) {
      e.preventDefault(); e.stopPropagation(); openBrowseModal(); return false;
    }
    const closeBtn = e.target.closest('[data-close-browse]');
    if (closeBtn) {
      e.preventDefault(); closeBrowseModal(); return false;
    }
    const optionBtn = e.target.closest('[data-scroll-to]');
    if (optionBtn) {
      e.preventDefault(); scrollToSection(optionBtn.getAttribute('data-scroll-to')); return false;
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBrowseModal();
  });

  window.openBrowseModal = openBrowseModal;
  window.closeBrowseModal = closeBrowseModal;
  window.scrollToSection = scrollToSection;
})();

/* ==========================================
   🎯 2. زر إضافة إعلان (Add Listing Modal)
   ========================================== */
(function () {
  'use strict';

  function openAddModal() {
    const modal = document.getElementById('addTypeModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeAddModal() {
    const modal = document.getElementById('addTypeModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = '';
    document.body.style.overflow = '';
  }

  function handleTypeChoice(type) {
    let currentUser = null;
    try {
      if (window.API && API.Users && API.Users.getCurrent) {
        currentUser = API.Users.getCurrent();
      }
    } catch (e) { }

    const isLoggedIn = !!(currentUser && currentUser.id);
    const addUrl = `/pages/add-listing.html?type=${type}`;
    const loginUrl = `/pages/login.html?redirect=${encodeURIComponent(addUrl)}`;

    if (isLoggedIn) {
      window.location.href = addUrl;
    } else {
      window.location.href = loginUrl;
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#addTypeModal') && !e.target.closest('[data-add-type]') && !e.target.closest('[data-close-add-type]')) {
      return;
    }

    const addBtn = e.target.closest('a[href*="add-listing"], .btn-add-listing-mobile, .bottom-nav-item.add-btn, .cta-button[href*="add-listing"]');
    if (addBtn && !e.target.closest('#addTypeModal')) {
      e.preventDefault(); e.stopPropagation(); openAddModal(); return false;
    }

    if (e.target.closest('[data-close-add-type]')) {
      e.preventDefault(); closeAddModal(); return false;
    }

    const typeBtn = e.target.closest('[data-add-type]');
    if (typeBtn) {
      e.preventDefault(); e.stopPropagation();
      const type = typeBtn.getAttribute('data-add-type');
      closeAddModal();
      handleTypeChoice(type);
      return false;
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAddModal();
  });
})();

/* ==========================================
   🍔 3. قائمة الهامبرغر (فتح/إغلاق القائمة الجانبية)
   ========================================== */
(function () {
  'use strict';

  function initHamburger() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMobileMenu');

    if (!toggleBtn || !menu || !overlay) {
      console.warn('⚠️ Hamburger elements missing');
      return;
    }

    if (toggleBtn.dataset.bound === '1') return;
    toggleBtn.dataset.bound = '1';

    function openMenu() {
      menu.classList.add('show');
      menu.style.cssText = 'right:0 !important; display:flex !important;';
      overlay.classList.add('show');
      overlay.style.cssText = 'opacity:1 !important; visibility:visible !important; display:block !important;';
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    }

    function closeMenu() {
      menu.classList.remove('show');
      menu.style.cssText = '';
      overlay.classList.remove('show');
      overlay.style.cssText = '';
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (menu.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeMenu();
      });
    }

    overlay.addEventListener('click', function (e) {
      e.preventDefault();
      closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    console.log('✅ Hamburger menu installed');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }
  window.addEventListener('load', initHamburger);
})();

/* ==========================================
   📱 4. محتوى القائمة الذكية (حسابي / لوحة التحكم / خروج)
   ========================================== */
(function () {
  'use strict';

  function getCurrentUser() {
    try {
      if (window.API && API.Users && API.Users.getCurrent) return API.Users.getCurrent();
      const u = localStorage.getItem('user');
      if (u && u !== 'null' && u !== 'undefined') return JSON.parse(u);
      return null;
    } catch (e) { return null; }
  }

  function isAdminUser(user) {
    if (!user) return false;
    if (window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin()) return true;
    return user.role === 'admin' || user.role === 'super_admin';
  }

  function buildMenuItems() {
    const container = document.getElementById('mobileAuthContainer');
    if (!container) return;

    const user = getCurrentUser();
    const isLoggedIn = !!(user && (user.id || user.email));
    const isAdmin = isAdminUser(user);
    let html = '';

    if (isLoggedIn) {
      const userName = user.name || user.username || user.email || 'المستخدم';
      const userRole = user.role === 'super_admin' ? 'سوبر أدمن' : user.role === 'admin' ? 'أدمن' : 'مستخدم';

      html += `
        <div class="mobile-menu-user">
          <div class="mobile-menu-user-avatar"><i data-lucide="user"></i></div>
          <div class="mobile-menu-user-info">
            <span class="mobile-menu-user-name">${userName}</span>
            <span class="mobile-menu-user-role">${userRole}</span>
          </div>
        </div>
        <a href="/pages/account.html" class="mobile-menu-item mobile-menu-item-account">
          <i data-lucide="user-circle"></i><span>الملف الشخصي</span><i data-lucide="chevron-left" class="mobile-menu-item-arrow"></i>
        </a>`;

      if (isAdmin) {
        const adminPage = user.role === 'super_admin' ? 'superadmin.html' : 'admin.html';
        html += `
          <a href="/pages/${adminPage}" class="mobile-menu-item mobile-menu-item-admin">
            <i data-lucide="layout-dashboard"></i><span>لوحة التحكم</span>
            <span class="mobile-menu-badge">أدمن</span><i data-lucide="chevron-left" class="mobile-menu-item-arrow"></i>
          </a>`;
      }
      html += `<div class="mobile-menu-divider"></div>
        <button type="button" class="mobile-menu-item mobile-menu-item-logout" id="mobileLogoutBtn">
          <i data-lucide="log-out"></i><span>تسجيل الخروج</span>
        </button>`;
    } else {
      html += `
        <a href="/pages/login.html" class="mobile-menu-item mobile-menu-item-login">
          <i data-lucide="log-in"></i><span>تسجيل الدخول</span><i data-lucide="chevron-left" class="mobile-menu-item-arrow"></i>
        </a>
        <a href="/pages/register.html" class="mobile-menu-item">
          <i data-lucide="user-plus"></i><span>إنشاء حساب جديد</span><i data-lucide="chevron-left" class="mobile-menu-item-arrow"></i>
        </a>`;
    }

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    const logoutBtn = document.getElementById('mobileLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function (e) {
        e.preventDefault(); e.stopPropagation();
        try {
          if (window.API && API.Auth && API.Auth.logout) await API.Auth.logout();
          else { localStorage.removeItem('user'); localStorage.removeItem('token'); sessionStorage.clear(); }
        } catch (err) {
          localStorage.removeItem('user'); localStorage.removeItem('token');
        }
        window.location.href = '/index.html';
      });
    }
  }

  function run() {
    let attempts = 0;
    const checkInterval = setInterval(function () {
      attempts++;
      if (window.API && window.API.Users) {
        clearInterval(checkInterval); buildMenuItems();
      } else if (attempts > 20) {
        clearInterval(checkInterval); buildMenuItems();
      }
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  document.addEventListener('click', function (e) {
    if (e.target.closest('#mobileMenuToggle')) setTimeout(buildMenuItems, 100);
  }, true);
})();

/* ==========================================
   👤 5. تحويل "تسجيل الدخول" إلى "حسابي" في الشريط السفلي
   ========================================== */
(function () {
  'use strict';

  function getCurrentUser() {
    try {
      if (window.API && API.Users && API.Users.getCurrent) return API.Users.getCurrent();
      const u = localStorage.getItem('user');
      if (u && u !== 'null' && u !== 'undefined') return JSON.parse(u);
      return null;
    } catch (e) { return null; }
  }

  function updateBottomNav() {
    const user = getCurrentUser();
    const isLoggedIn = !!(user && (user.id || user.email));
    const accountLink = document.querySelector('.bottom-nav-item[href*="account"], .bottom-nav-item[href*="login"]');

    if (!accountLink) return;
    const textSpan = accountLink.querySelector('span');
    if (!textSpan) return;

    if (isLoggedIn) {
      textSpan.textContent = 'حسابي';
      accountLink.setAttribute('href', 'pages/account.html');
      accountLink.classList.add('is-logged-in');
    } else {
      textSpan.textContent = 'تسجيل الدخول';
      accountLink.setAttribute('href', 'pages/login.html');
      accountLink.classList.remove('is-logged-in');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function run() {
    updateBottomNav();
    let attempts = 0;
    const interval = setInterval(function () {
      attempts++; updateBottomNav();
      if (attempts >= 10) clearInterval(interval);
    }, 300);

    window.addEventListener('storage', updateBottomNav);
    const checkUserChange = setInterval(function () {
      const currentUser = localStorage.getItem('user');
      if (currentUser !== window.__lastUserState) {
        window.__lastUserState = currentUser; updateBottomNav();
      }
    }, 1000);
    setTimeout(() => clearInterval(checkUserChange), 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();