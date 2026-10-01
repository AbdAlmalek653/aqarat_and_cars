/* ==========================================
   بيانات السيارات
   ========================================== */

let allCars = [];

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let currentView = 'grid';
let filteredCars = [...allCars];

/* ==========================================
   الحصول على الفلاتر
   ========================================== */
function getFilters() {
  return {
    purpose: document.querySelector('input[name="purpose"]:checked')?.value || '',
    brands: Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(c => c.value),
    city: document.getElementById('filterCity')?.value || '',
    priceMin: parseInt(document.getElementById('priceMin')?.value) || 0,
    priceMax: parseInt(document.getElementById('priceMax')?.value) || Infinity,
    yearMin: parseInt(document.getElementById('yearMin')?.value) || 0,
    yearMax: parseInt(document.getElementById('yearMax')?.value) || Infinity,
    condition: document.querySelector('input[name="condition"]:checked')?.value || '',
    transmission: document.querySelector('input[name="transmission"]:checked')?.value || '',
    fuels: Array.from(document.querySelectorAll('input[name="fuel"]:checked')).map(c => c.value),
    kmMax: parseInt(document.getElementById('kmMax')?.value) || Infinity
  };
}

/* ==========================================
   تطبيق الفلاتر
   ========================================== */
function applyFilters() {
  const f = getFilters();

  filteredCars = allCars.filter(c => {
    if (f.purpose && c.purpose !== f.purpose) return false;
    if (f.brands.length && !f.brands.includes(c.brand)) return false;
    if (f.city && c.city !== f.city) return false;

    const price = Number(c.price) || 0;
    if (price < f.priceMin || price > f.priceMax) return false;

    const year = Number(c.year) || 0;
    if (year < f.yearMin || year > f.yearMax) return false;

    if (f.condition && c.condition !== f.condition) return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.fuels.length && !f.fuels.includes(c.fuel)) return false;

    const km = Number(c.km) || 0;
    if (km > f.kmMax) return false;

    return true;
  });

  currentPage = 1;
  sortCars();
}

/* ==========================================
   الترتيب
   ========================================== */
function sortCars() {
  const sort = document.getElementById('sortSelect')?.value || 'newest';

  switch (sort) {
    case 'price-asc':
      filteredCars.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      break;
    case 'price-desc':
      filteredCars.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      break;
    case 'year-desc':
      filteredCars.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      break;
    default:
      filteredCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderCars();
}

/* ==========================================
   حالة السيارة (مباع/مؤجر)
   ========================================== */
function getStatusBadge(status) {
  if (status === 'sold') return `<span class="status-badge sold"><i data-lucide="check-circle"></i>مباع</span>`;
  if (status === 'rented') return `<span class="status-badge rented"><i data-lucide="key-round"></i>مؤجر</span>`;
  return '';
}

/* ==========================================
   إنشاء كارد سيارة
   ========================================== */
function createCarCard(item) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  // ✅ حماية: تأكد من وجود السعر وتحويله لرقم
  const priceNum = Number(item.price) || 0;
  const currency = item.currency || 'USD';

  const priceText = item.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${currency}`
    : `${priceNum} ${currency} <small>/ يوم</small>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  const conditionText = item.condition === 'new' ? 'جديد' : 'مستعمل';
  const statusBadge = getStatusBadge(item.status);
  const isUnavailable = item.status === 'sold' || item.status === 'rented';

  // ✅ حماية: أيقونة افتراضية حسب النوع
  let icon = 'car';
  if (item.icon) icon = item.icon;

  // ✅ حماية: صورة السيارة
  const imageUrl = window.getListingImageUrl
    ? window.getListingImageUrl(item)
    : (item.images && item.images[0]);

  const imageContent = imageUrl
    ? `<img src="${imageUrl}"
            alt="${item.title || ''}"
            loading="lazy"
            onerror="this.onerror=null;this.style.display='none';this.parentNode.classList.add('image-failed');this.parentNode.innerHTML='<i data-lucide=\\'${icon}\\'></i>';if(window.lucide)window.lucide.createIcons();">`
    : `<i data-lucide="${icon}"></i>`;

  // ✅ حماية: الموقع
  const locationText = item.location || item.city || item.area || '—';

  // ✅ حماية: الكيلومترات
  const kmNum = Number(item.km) || 0;
  const kmText = item.purpose === 'sale'
    ? `${kmNum.toLocaleString('en-US')} كم`
    : '';

  // ✅ حماية: السنة
  const yearNum = Number(item.year) || '—';

  return `
    <a href="details.html?id=${item.id}&type=car" class="card ${isUnavailable ? 'card-unavailable' : ''}">
      <div class="card-image">
        ${imageContent}
        ${featuredBadge}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
        ${statusBadge}
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.title || 'بدون عنوان'}</h3>
        <p class="card-location">
          <i data-lucide="map-pin"></i>
          ${locationText}
        </p>
        <div class="car-meta">
          <span><i data-lucide="calendar"></i> ${yearNum}</span>
          <span><i data-lucide="gauge"></i> ${kmText || '—'}</span>
          <span><i data-lucide="settings-2"></i> ${conditionText}</span>
        </div>
        <p class="card-price">${priceText}</p>
      </div>
    </a>
  `;
}

/* ==========================================
   عرض السيارات
   ========================================== */
function renderCars() {
  const grid = document.getElementById('carsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;

  if (countEl) countEl.textContent = filteredCars.length;

  if (filteredCars.length === 0) {
    grid.className = 'properties-grid';
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x"></i>
        <h3>لا توجد نتائج</h3>
        <p>جرّب تغيير الفلاتر أو ابحث بكلمات مختلفة</p>
        <button class="btn btn-primary" onclick="clearAllFilters()">
          <i data-lucide="refresh-cw"></i>
          <span>إعادة تعيين الفلاتر</span>
        </button>
      </div>
    `;
    document.getElementById('pagination').innerHTML = '';
    initIcons();
    return;
  }

  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filteredCars.slice(start, end);

  grid.className = currentView === 'grid' ? 'properties-grid' : 'properties-list';
  grid.innerHTML = pageItems.map(createCarCard).join('');

  renderPagination(totalPages);
  initIcons();
}

/* ==========================================
   Pagination
   ========================================== */
function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
      <i data-lucide="chevron-right"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      html += `<span class="page-btn" style="border:none;background:none;">...</span>`;
    }
  }

  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
      <i data-lucide="chevron-left"></i>
    </button>
  `;

  container.innerHTML = html;
}

window.goToPage = function(page) {
  currentPage = page;
  renderCars();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ==========================================
   مسح الفلاتر
   ========================================== */
window.clearAllFilters = function() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);

  const purposeAll = document.querySelector('input[name="purpose"][value=""]');
  if (purposeAll) purposeAll.checked = true;

  const conditionAll = document.querySelector('input[name="condition"][value=""]');
  if (conditionAll) conditionAll.checked = true;

  const transmissionAll = document.querySelector('input[name="transmission"][value=""]');
  if (transmissionAll) transmissionAll.checked = true;

  ['filterCity', 'priceMin', 'priceMax', 'yearMin', 'yearMax', 'kmMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  applyFilters();
};

/* ==========================================
   تهيئة الأيقونات
   ========================================== */
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ==========================================
   ربط الأحداث
   ========================================== */
function setupEvents() {
  document.querySelectorAll('input[name="purpose"], input[name="brand"], input[name="condition"], input[name="transmission"], input[name="fuel"]')
    .forEach(el => el.addEventListener('change', applyFilters));

  ['filterCity', 'priceMin', 'priceMax', 'yearMin', 'yearMax', 'kmMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
  });

  document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
  document.getElementById('sortSelect')?.addEventListener('change', sortCars);

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderCars();
    });
  });

  // Sidebar جوال
  const filterToggle = document.getElementById('filterToggle');
  const sidebar = document.getElementById('filtersSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  filterToggle?.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  document.getElementById('applyFilters')?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

/* ==========================================
   تشغيل
   ========================================== */
async function loadCars() {
  try {
    const listings = await API.Listings.getAll({ type: 'car' });
    allCars = listings || [];
    console.log(`✅ تم تحميل ${allCars.length} سيارة`);
  } catch (e) {
    console.error('خطأ:', e);
    allCars = [];
  }
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEvents();
  loadCars();
});