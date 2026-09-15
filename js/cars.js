/* ==========================================
   بيانات تجريبية للسيارات
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
    if (c.price < f.priceMin || c.price > f.priceMax) return false;
    if (c.year < f.yearMin || c.year > f.yearMax) return false;
    if (f.condition && c.condition !== f.condition) return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.fuels.length && !f.fuels.includes(c.fuel)) return false;
    if (c.km > f.kmMax) return false;

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
      filteredCars.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredCars.sort((a, b) => b.price - a.price);
      break;
    case 'year-desc':
      filteredCars.sort((a, b) => b.year - a.year);
      break;
    default:
      filteredCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderCars();
}

/* ==========================================
   إنشاء كارد سيارة
   ========================================== */
function getStatusBadge(status) {
  if (status === 'sold') return `<span class="status-badge sold"><i data-lucide="check-circle"></i>مباع</span>`;
  if (status === 'rented') return `<span class="status-badge rented"><i data-lucide="key-round"></i>مؤجر</span>`;
  return '';
}

// ⬇️ الدالة اللي بعدها مباشرة


function createCarCard(item) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceText = item.purpose === 'sale'
    ? `${item.price.toLocaleString('en-US')} ${item.currency}`
    : `${item.price} ${item.currency} <small>/ يوم</small>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  const conditionText = item.condition === 'new' ? 'جديد' : 'مستعمل';

  return `
    <a href="details.html?id=${item.id}&type=car" class="card">
      <div class="card-image">
        <i data-lucide="${item.icon}"></i>
        ${featuredBadge}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-location">
          <i data-lucide="map-pin"></i>
          ${item.location}
        </p>
        <div class="car-meta">
          <span><i data-lucide="calendar"></i> ${item.year}</span>
          <span><i data-lucide="gauge"></i> ${item.km.toLocaleString('en-US')} كم</span>
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
  document.querySelector('input[name="purpose"][value=""]').checked = true;
  document.querySelector('input[name="condition"][value=""]').checked = true;
  document.querySelector('input[name="transmission"][value=""]').checked = true;
  document.getElementById('filterCity').value = '';
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('yearMin').value = '';
  document.getElementById('yearMax').value = '';
  document.getElementById('kmMax').value = '';

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