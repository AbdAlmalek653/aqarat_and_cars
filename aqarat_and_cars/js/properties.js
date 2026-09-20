/* ==========================================
   صفحة العقارات - البيانات من API فقط
   ========================================== */

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let currentView = 'grid';
let allProperties = [];
let filteredProperties = [];

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ==========================================
   تحميل العقارات من API
   ========================================== */
async function loadProperties() {
  try {
    const listings = await API.Listings.getAll({ type: 'property' });
    allProperties = listings || [];
    applyFilters();
  } catch (e) {
    console.error('خطأ:', e);
    allProperties = [];
    applyFilters();
  }
}

/* ==========================================
   الفلاتر
   ========================================== */
function getFilters() {
  return {
    purpose: document.querySelector('input[name="purpose"]:checked')?.value || '',
    types: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(c => c.value),
    city: document.getElementById('filterCity')?.value || '',
    priceMin: parseInt(document.getElementById('priceMin')?.value) || 0,
    priceMax: parseInt(document.getElementById('priceMax')?.value) || Infinity,
    rooms: document.querySelector('input[name="rooms"]:checked')?.value || '',
    areaMin: parseInt(document.getElementById('areaMin')?.value) || 0,
    areaMax: parseInt(document.getElementById('areaMax')?.value) || Infinity,
    furnished: Array.from(document.querySelectorAll('input[name="furnished"]:checked')).map(c => c.value)
  };
}

function applyFilters() {
  const f = getFilters();

  filteredProperties = allProperties.filter(p => {
    if (f.purpose && p.purpose !== f.purpose) return false;
    if (f.types.length && !f.types.includes(p.subType)) return false;
    if (f.city && p.city !== f.city) return false;
    if (p.price < f.priceMin || p.price > f.priceMax) return false;

    if (f.rooms) {
      const r = parseInt(f.rooms);
      const pRooms = parseInt(p.details?.rooms) || 0;
      if (r === 5) { if (pRooms < 5) return false; }
      else if (pRooms !== r) return false;
    }

    const pArea = parseInt(p.details?.propertyArea) || parseInt(p.details?.landArea) || 0;
    if (pArea < f.areaMin || pArea > f.areaMax) return false;

    if (f.furnished.length) {
      const pFurnished = p.details?.furnished;
      if (pFurnished && !f.furnished.includes(pFurnished)) return false;
    }

    return true;
  });

  currentPage = 1;
  sortProperties();
}

function sortProperties() {
  const sort = document.getElementById('sortSelect')?.value || 'newest';
  switch (sort) {
    case 'price-asc': filteredProperties.sort((a, b) => a.price - b.price); break;
    case 'price-desc': filteredProperties.sort((a, b) => b.price - a.price); break;
    case 'area-desc':
      filteredProperties.sort((a, b) => {
        const aA = parseInt(a.details?.propertyArea) || 0;
        const bA = parseInt(b.details?.propertyArea) || 0;
        return bA - aA;
      });
      break;
    default: filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  renderProperties();
}

/* ==========================================
   شارات الحالة (متاح / مباع / مؤجر)
   ========================================== */
function getStatusBadge(status) {
  if (status === 'sold') {
    return `<span class="status-badge sold"><i data-lucide="check-circle"></i>مباع</span>`;
  }
  if (status === 'rented') {
    return `<span class="status-badge rented"><i data-lucide="key-round"></i>مؤجر</span>`;
  }
  return '';
}

/* ==========================================
   إنشاء كارد
   ========================================== */
function createPropertyCard(item) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceText = item.purpose === 'sale'
    ? `${item.price.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${item.price} ${item.currency || 'USD'} <small>/ شهرياً</small>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  const statusBadge = getStatusBadge(item.status);
  const isUnavailable = item.status === 'sold' || item.status === 'rented';

  // أيقونة حسب النوع
  let icon = 'building-2';
  if (item.subType === 'villa') icon = 'home';
  if (item.subType === 'land') icon = 'trees';
  if (item.subType === 'office') icon = 'briefcase';
  if (item.subType === 'shop') icon = 'store';
  if (item.subType === 'chalet') icon = 'tent';
  if (item.subType === 'arabic-house') icon = 'landmark';

  const firstImage = item.images && item.images[0];
  const imageContent = firstImage
    ? `<img src="${firstImage}" alt="${item.title}" loading="lazy">`
    : `<i data-lucide="${icon}"></i>`;

  const location = item.area || item.city || '—';

  return `
    <a href="details.html?id=${item.id}&type=property" class="card ${isUnavailable ? 'card-unavailable' : ''}">
      <div class="card-image">
        ${imageContent}
        ${featuredBadge}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
        ${statusBadge}
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
function emptyState() {
  return `
    <div class="empty-state" style="grid-column:1/-1;">
      <i data-lucide="building-2"></i>
      <h3>لا توجد عقارات حالياً</h3>
      <p>كن أول من يضيف إعلان عقار</p>
      <a href="add-listing.html" class="btn btn-primary">
        <i data-lucide="plus"></i>
        <span>أضف إعلان عقار</span>
      </a>
    </div>
  `;
}

/* ==========================================
   العرض
   ========================================== */
function renderProperties() {
  const grid = document.getElementById('propertiesGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;

  if (countEl) countEl.textContent = filteredProperties.length;

  if (filteredProperties.length === 0) {
    grid.className = 'properties-grid';
    grid.innerHTML = emptyState();
    document.getElementById('pagination').innerHTML = '';
    initIcons();
    return;
  }

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredProperties.slice(start, start + ITEMS_PER_PAGE);

  grid.className = currentView === 'grid' ? 'properties-grid' : 'properties-list';
  grid.innerHTML = pageItems.map(createPropertyCard).join('');

  renderPagination(totalPages);
  initIcons();
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i data-lucide="chevron-right"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i data-lucide="chevron-left"></i></button>`;

  container.innerHTML = html;
  initIcons();
}

window.goToPage = function(page) {
  currentPage = page;
  renderProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.clearAllFilters = function() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelector('input[name="purpose"][value=""]').checked = true;
  document.querySelector('input[name="rooms"][value=""]').checked = true;
  document.getElementById('filterCity').value = '';
  ['priceMin','priceMax','areaMin','areaMax'].forEach(id => document.getElementById(id).value = '');
  applyFilters();
};

/* ==========================================
   ربط الأحداث
   ========================================== */
function setupEvents() {
  document.querySelectorAll('input[name="purpose"], input[name="type"], input[name="rooms"], input[name="furnished"]')
    .forEach(el => el.addEventListener('change', applyFilters));

  ['filterCity', 'priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
  document.getElementById('sortSelect')?.addEventListener('change', sortProperties);

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderProperties();
    });
  });

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
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEvents();
  loadProperties();
});