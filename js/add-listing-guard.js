/* ==========================================
   🎯 نظام إضافة الإعلان الذكي
   - يفتح نافذة اختيار النوع (عقار/سيارة)
   - إذا المستخدم مسجل → يكمّل
   - إذا لأ → يسجّل دخول ثم يرجع لنفس النقطة
   ========================================== */
(function() {
  'use strict';

  /* ===== 1. حقن نافذة الاختيار في الصفحة ===== */
  function injectModal() {
    if (document.getElementById('addTypeModal')) return;

    const modalHTML = `
      <div class="add-type-modal" id="addTypeModal">
        <div class="add-type-overlay" data-close-add-type></div>
        <div class="add-type-content">
          <button class="add-type-close" data-close-add-type type="button">
            <i data-lucide="x"></i>
          </button>
          <div class="add-type-header">
            <div class="add-type-icon"><i data-lucide="plus-circle"></i></div>
            <h2 class="add-type-title">ما نوع الإعلان الذي تريد إضافته؟</h2>
            <p class="add-type-subtitle">اختر النوع للبدء في إضافة إعلانك</p>
          </div>
          <div class="add-type-options">
            <button type="button" class="add-type-option add-type-property" data-add-type="property">
              <div class="add-type-option-bg"></div>
              <div class="add-type-option-icon"><i data-lucide="building-2"></i></div>
              <h3 class="add-type-option-title">عقار</h3>
              <p class="add-type-option-desc">شقق، فلل، أراضي، مكاتب ومحلات</p>
            </button>
            <button type="button" class="add-type-option add-type-car" data-add-type="car">
              <div class="add-type-option-bg"></div>
              <div class="add-type-option-icon"><i data-lucide="car"></i></div>
              <h3 class="add-type-option-title">سيارة</h3>
              <p class="add-type-option-desc">جديدة ومستعملة، للبيع والإيجار</p>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (window.lucide) window.lucide.createIcons();
  }

  /* ===== 2. فتح/إغلاق النافذة ===== */
  function openModal() {
    const modal = document.getElementById('addTypeModal');
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeModal() {
    const modal = document.getElementById('addTypeModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  /* ===== 3. معالجة اختيار النوع ===== */
  function handleTypeChoice(type) {
    // جلب المستخدم الحالي
    let currentUser = null;
    try {
      if (window.API && API.Users && API.Users.getCurrent) {
        currentUser = API.Users.getCurrent();
      }
    } catch (e) {
      console.warn('⚠️ API not available');
    }

    const isLoggedIn = !!(currentUser && currentUser.id);

    // تحديد المسار بناءً على موقع الصفحة
    const isInPages = window.location.pathname.includes('/pages/');
    const prefix = isInPages ? '' : 'pages/';
    const addUrl = `${prefix}add-listing.html?type=${type}`;

    console.log('✅ نوع الإعلان:', type);
    console.log('🔐 مسجل دخول؟', isLoggedIn);
    console.log('🔗 رابط الإضافة:', addUrl);

    if (isLoggedIn) {
      // المستخدم مسجل → يكمّل مباشرة
      window.location.href = addUrl;
    } else {
      // المستخدم غير مسجل → يسجل دخول ثم يرجع
      const loginUrl = `${prefix}login.html?redirect=${encodeURIComponent(addUrl)}`;
      console.log('🔐 رابط تسجيل الدخول:', loginUrl);
      window.location.href = loginUrl;
    }
  }

  /* ===== 4. Event Delegation - يلتقط كل الضغطات ===== */
  function installEventHandlers() {
    document.addEventListener('click', function(e) {

      // 4.1 - ضغط على زر "أضف إعلان" (أي زر، بأي مكان)
      const addLink = e.target.closest(
        'a[href*="add-listing"], .btn-add-listing-mobile, .bottom-nav-item.add-btn, .btn[href*="add-listing"]'
      );

      // تجاهل النقرات داخل النافذة
      if (addLink && !e.target.closest('#addTypeModal')) {
        const href = addLink.getAttribute('href') || '';
        const isAddBtn = 
          href.includes('add-listing') ||
          addLink.classList.contains('btn-add-listing-mobile') ||
          addLink.classList.contains('add-btn');

        if (isAddBtn) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎯 فتح نافذة اختيار النوع');
          openModal();
          return false;
        }
      }

      // 4.2 - ضغط على زر الإغلاق أو الـ overlay
      const closeBtn = e.target.closest('[data-close-add-type]');
      if (closeBtn) {
        e.preventDefault();
        closeModal();
        return false;
      }

      // 4.3 - ضغط على عقار أو سيارة
      const typeBtn = e.target.closest('[data-add-type]');
      if (typeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = typeBtn.getAttribute('data-add-type');
        closeModal();
        handleTypeChoice(type);
        return false;
      }
    }, true); // capture phase

    // 4.4 - إغلاق بمفتاح ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    console.log('✅ Add-listing guard installed');
  }

  /* ===== 5. التشغيل ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectModal();
      installEventHandlers();
    });
  } else {
    injectModal();
    installEventHandlers();
  }
})();