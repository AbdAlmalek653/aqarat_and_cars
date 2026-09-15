/* ==========================================
   الصفحة الرئيسية - سوق
   البيانات كلها من API (قاعدة البيانات)
   ========================================== */

/* ===== تهيئة الأيقونات ===== */
function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/* ==========================================
   إنشاء كارد إعلان
   ========================================== */
function createCard(item, type) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceText = item.purpose === 'sale'
    ? `${item.price.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${item.price} ${item.currency || 'USD'} <small>/ يوم</small>`;

  // تحديد الأيقونة حسب النوع
  let icon = type === 'property' ? 'building-2' : 'car';
  if (item.subType === 'villa') icon = 'home';
  if (item.subType === 'land') icon = 'trees';
  if (item.subType === 'office') icon = 'briefcase';
  if (item.subType === 'shop') icon = 'store';
  if (item.subType === 'chalet') icon = 'tent';

  // الصورة الأولى إن وجدت
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const imageContent = firstImage
    ? `<img src="${firstImage}" alt="${item.title}" loading="lazy">`
    : `<i data-lucide="${icon}"></i>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  // موقع الإعلان
  const location = item.area || item.city || '—';

  return `
    <a href="pages/details.html?id=${item.id}&type=${type}" class="card">
      <div class="card-image">
        ${imageContent}
        ${featuredBadge}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-location">
          <i data-lucide="map-pin"></i>
          ${location}
        </p>
        <p class="card-price">${priceText}</p>
      </div>
    </a>
  `;
}

/* ==========================================
   حالة فاضية
   ========================================== */
function emptyState(type) {
  const icon = type === 'property' ? 'building-2' : 'car';
  const text = type === 'property' ? 'عقار' : 'سيارة';

  return `
    <div class="empty-state" style="grid-column:1/-1;">
      <i data-lucide="${icon}"></i>
      <h3>لا توجد ${text === 'عقار' ? 'عقارات' : 'سيارات'} حالياً</h3>
      <p>كن أول من يضيف إعلان ${text}</p>
      <a href="pages/add-listing.html" class="btn btn-primary">
        <i data-lucide="plus"></i>
        <span>أضف إعلان ${text}</span>
      </a>
    </div>
  `;
}

/* ==========================================
   تحميل العقارات المميزة
   ========================================== */
async function loadFeaturedProperties() {
  const container = document.getElementById('featuredProperties');
  if (!container) return;

  try {
    const allListings = await API.Listings.getAll();
    const properties = allListings
      .filter(l => l.type === 'property')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    if (properties.length === 0) {
      container.innerHTML = emptyState('property');
    } else {
      container.innerHTML = properties.map(p => createCard(p, 'property')).join('');
    }
    initIcons();
  } catch (e) {
    console.error('خطأ في تحميل العقارات:', e);
    container.innerHTML = emptyState('property');
    initIcons();
  }
}

/* ==========================================
   تحميل السيارات المميزة
   ========================================== */
async function loadFeaturedCars() {
  const container = document.getElementById('featuredCars');
  if (!container) return;

  try {
    const allListings = await API.Listings.getAll();
    const cars = allListings
      .filter(l => l.type === 'car')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    if (cars.length === 0) {
      container.innerHTML = emptyState('car');
    } else {
      container.innerHTML = cars.map(c => createCard(c, 'car')).join('');
    }
    initIcons();
  } catch (e) {
    console.error('خطأ في تحميل السيارات:', e);
    container.innerHTML = emptyState('car');
    initIcons();
  }
}

/* ==========================================
   تحميل الإحصائيات الحقيقية
   ========================================== */
async function loadStats() {
  try {
    const allListings = await API.Listings.getAll();
    const properties = allListings.filter(l => l.type === 'property');
    const cars = allListings.filter(l => l.type === 'car');
    const users = await API.Users.getAll();

    animateNumber('statProperties', properties.length);
    animateNumber('statCars', cars.length);
    animateNumber('statUsers', users.length);
  } catch (e) {
    console.error('خطأ في تحميل الإحصائيات:', e);
  }
}

/* ==========================================
   تأثير العد التصاعدي
   ========================================== */
function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (target === 0) {
    el.textContent = '0';
    return;
  }

  const duration = 1200;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(0 + target * eased);

    el.textContent = current.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString('en-US') + '+';
    }
  }

  requestAnimationFrame(update);
}

/* ==========================================
   تبويبات البحث
   ========================================== */
function setupSearchTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

/* ==========================================
   نموذج البحث
   ========================================== */
function setupSearchForm() {
  const form = document.getElementById('searchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const activeTab = document.querySelector('.tab.active');
    const type = activeTab ? activeTab.dataset.type : 'property';
    const location = document.getElementById('searchLocation').value.trim();
    const purpose = document.getElementById('searchPurpose').value;

    const params = new URLSearchParams();
    if (location) params.append('q', location);
    if (purpose) params.append('purpose', purpose);

    const page = type === 'property' ? 'properties.html' : 'cars.html';
    window.location.href = `pages/${page}?${params.toString()}`;
  });
}
/* ==========================================
   حماية زر "أضف إعلان"
   ========================================== */
function protectAddListingButtons() {
  // كل الأزرار اللي تودي لـ add-listing.html
  const buttons = document.querySelectorAll('a[href*="add-listing.html"]');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!API.Auth.isLoggedIn()) {
        e.preventDefault();

        // نحفظ الصفحة اللي كان فيها
        sessionStorage.setItem('souq_redirect_after_login', 'pages/add-listing.html');
        sessionStorage.setItem('souq_login_message', 'يجب تسجيل الدخول أولاً لإضافة إعلان');

        window.location.href = 'pages/login.html?redirect=add-listing';
        return false;
      }
    });
  });
}

/* ==========================================
   تشغيل عند التحميل
   ========================================== */
   document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProperties();
  loadFeaturedCars();
  loadStats();
  setupSearchTabs();
  setupSearchForm();
  protectAddListingButtons();
  setupWelcomeModal();  // ← جديد
  initIcons();
});
/* ==========================================
   نافذة الترحيب
   ========================================== */
function setupWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;

  // التحقق: هل شاهدها من قبل؟
  const lastSeen = localStorage.getItem('souq_welcome_seen');
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000; // 24 ساعة

  // إذا شافها من أقل من 24 ساعة → لا تظهر
  if (lastSeen && (now - parseInt(lastSeen)) < DAY) {
    return;
  }

  // إظهار النافذة بعد 800ms
  setTimeout(() => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // منع التمرير
    initIcons();
  }, 800);
}

window.closeWelcome = function() {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  // حفظ إن المستخدم شافها
  localStorage.setItem('souq_welcome_seen', Date.now().toString());
};

// إغلاق بمفتاح ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeWelcome();
  }
});