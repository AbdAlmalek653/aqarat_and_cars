/* ==========================================
   صفحة العقارات - البيانات من API فقط
   الإصدار: 3.1 (إضافة شارة نوع العقار)
   ========================================== */

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let currentView = 'grid';
let allProperties = [];
let filteredProperties = [];
let mapInitialized = false;

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ✅ دالة ترجمة نوع العقار */
function getPropertyTypeName(type) {
  const types = {
    'apartment': 'شقة',
    'house': 'منزل',
    'villa': 'فيلا',
    'land': 'أرض',
    'shop': 'محل تجاري',
    'office': 'مكتب',
    'building': 'عمارة كاملة',
    'chalet': 'شاليه',
    'arabic-house': 'بيت عربي'
  };
  if (!type) return '';
  return types[String(type).toLowerCase()] || type;
}

async function loadProperties() {
  try {
    const listings = await API.Listings.getAll({ type: 'property' });
    allProperties = listings || [];
    applyFilters();
  } catch (e) {
    console.error('❌ خطأ في جلب العقارات:', e);
    allProperties = [];
    applyFilters();
  }
}

function getFilters() {
  return {
    purpose: document.querySelector('input[name="purpose"]:checked')?.value || '',
    types: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(c => c.value),
    city: document.getElementById('filterCity')?.value || '',
    priceMin: parseInt(document.getElementById('priceMin')?.value) || 0,
    priceMax: parseInt(document.getElementById('priceMax')?.value) || Infinity,
    rooms: parseInt(document.querySelector('input[name="rooms"]:checked')?.value) || 0,
    areaMin: parseInt(document.getElementById('areaMin')?.value) || 0,
    areaMax: parseInt(document.getElementById('areaMax')?.value) || Infinity,
    furnished: Array.from(document.querySelectorAll('input[name="furnished"]:checked')).map(c => c.value)
  };
}

function normalizeFilterValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getPropertyType(property) {
  const details = property.details || {};
  return property.property_type || property.subType || property.subtype ||
    property.propertyType || details.propertyType || details.property_type ||
    details.subType || details.subtype || details.type || '';
}

function propertyMatchesType(property, types) {
  if (!types.length) return true;
  const type = normalizeFilterValue(getPropertyType(property));
  return types.some(value => normalizeFilterValue(value) === type);
}

function propertyMatchesCity(property, city) {
  if (!city) return true;
  if (typeof cityMatches === 'function') return cityMatches(property, city);

  const target = normalizeFilterValue(city);
  return [property.city, property.city_slug, property.city_name]
    .filter(Boolean)
    .some(value => normalizeFilterValue(value) === target);
}

function propertyMatchScore(property, filters) {
  const details = property.details || {};
  let score = 0;

  if (filters.purpose && property.purpose !== filters.purpose) score += 5;
  if (filters.types.length && !filters.types.includes(getPropertyType(property))) score += 4;
  if (filters.city && !propertyMatchesCity(property, filters.city)) score += 4;

  const price = Number(property.price) || 0;
  if (price < filters.priceMin) score += Math.min(3, (filters.priceMin - price) / Math.max(filters.priceMin, 1));
  if (price > filters.priceMax) score += Math.min(3, (price - filters.priceMax) / Math.max(filters.priceMax, 1));

  const rooms = Number(details.rooms) || Number(property.rooms) || 0;
  if (filters.rooms) score += filters.rooms === 5 ? Math.max(0, 5 - rooms) : Math.abs(rooms - filters.rooms);

  const area = Number(details.area) || Number(property.area) || 0;
  if (area < filters.areaMin) score += Math.min(3, (filters.areaMin - area) / Math.max(filters.areaMin, 1));
  if (area > filters.areaMax) score += Math.min(3, (area - filters.areaMax) / Math.max(filters.areaMax, 1));

  if (filters.furnished.length) {
    const furnished = details.furnished || property.furnished;
    if (!filters.furnished.includes(furnished)) score += 2;
  }

  return score;
}

function applyFilters() {
  const f = getFilters();

  filteredProperties = allProperties.filter(p => {
    if (f.purpose && p.purpose !== f.purpose) return false;

    if (!propertyMatchesType(p, f.types)) return false;

    if (!propertyMatchesCity(p, f.city)) return false;

    const price = Number(p.price) || 0;
    if (price < f.priceMin || price > f.priceMax) return false;

    const rooms = Number(p.details?.rooms) || Number(p.rooms) || 0;
    if (f.rooms && (f.rooms === 5 ? rooms < 5 : rooms !== f.rooms)) return false;

    const area = Number(p.details?.area) || Number(p.area) || 0;
    if (area < f.areaMin || area > f.areaMax) return false;

    if (f.furnished.length) {
      const isFurnished = p.details?.furnished || p.furnished;
      if (!f.furnished.includes(isFurnished)) return false;
    }

    return true;
  });

  if (!filteredProperties.length && allProperties.length) {
    const compatibleProperties = allProperties.filter(property =>
      (!f.purpose || property.purpose === f.purpose) &&
      propertyMatchesType(property, f.types)
    );

    filteredProperties = (compatibleProperties.length ? compatibleProperties : allProperties)
      .map(property => ({ property, score: propertyMatchScore(property, f) }))
      .sort((a, b) => a.score - b.score || new Date(b.property.createdAt) - new Date(a.property.createdAt))
      .slice(0, ITEMS_PER_PAGE)
      .map(result => result.property);
  }

  currentPage = 1;
  sortProperties();
}

function sortProperties() {
  const sort = document.getElementById('sortSelect')?.value || 'newest';

  switch (sort) {
    case 'price-asc': filteredProperties.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break;
    case 'price-desc': filteredProperties.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break;
    case 'area-desc': filteredProperties.sort((a, b) => (Number(b.details?.area || b.area) || 0) - (Number(a.details?.area || a.area) || 0)); break;
    default: filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderProperties();

  if (mapInitialized && document.getElementById('viewMapBtn')?.classList.contains('active')) {
    setTimeout(() => {
      if (window.MapView) window.MapView.addMarkers(filteredProperties || allProperties || []);
    }, 100);
  }
}

function getStatusBadge(status) {
  if (status === 'sold') return `<span class="status-badge sold"><i data-lucide="check-circle"></i>مباع</span>`;
  if (status === 'rented') return `<span class="status-badge rented"><i data-lucide="key-round"></i>مؤجر</span>`;
  return '';
}

function createPropertyCard(item) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceNum = Number(item.price) || 0;
  const priceText = item.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${priceNum} ${item.currency || 'USD'} <small>/ يوم</small>`;

  const featuredBadge = item.featured ? `<span class="card-badge featured">⭐ مميز</span>` : '';
  const statusBadge = getStatusBadge(item.status);
  const isUnavailable = item.status === 'sold' || item.status === 'rented';

  const icon = 'building-2';

  const imgData = window.getListingImageSrcset
    ? window.getListingImageSrcset(item, 0)
    : { src: null, srcset: '', sizes: '' };

  const safeTitle = (item.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const imageContent = imgData.src
    ? `<img 
         src="${imgData.src}"
         ${imgData.srcset ? `srcset="${imgData.srcset}"` : ''}
         ${imgData.sizes ? `sizes="${imgData.sizes}"` : ''}
         alt="${safeTitle}"
         loading="lazy"
         decoding="async"
         width="800"
         height="600"
         onerror="this.onerror=null;this.style.display='none';this.parentNode.classList.add('image-failed');this.parentNode.innerHTML='<i data-lucide=\\'${icon}\\'></i>';if(window.lucide)window.lucide.createIcons();">`
    : `<i data-lucide="${icon}"></i>`;

  const location = item.area || item.city || '—';

  const d = item.details || {};

  // ✅ استخراج نوع العقار كشارة
  let propertyTypeBadgeHTML = '';
  const rawType = item.subType || item.subtype || item.property_type || d.propertyType || d.type;
  const typeText = getPropertyTypeName(rawType);
  
  if (typeText) {
    propertyTypeBadgeHTML = `
      <div class="car-brand-badge" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-color: rgba(59, 130, 246, 0.3); margin-top: 5px; margin-bottom: 5px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
        </svg>
        <span>${typeText}</span>
      </div>`;
  }

  // باقي الشرائح (مساحة، غرف)
  const chips = [];
  if (d.rooms || item.rooms) chips.push({ icon: 'bed-double', text: `${d.rooms || item.rooms} غرف` });
  if (d.area || item.area) chips.push({ icon: 'square', text: `${d.area || item.area} م²` });
  
  let meta = '';
  if (chips.length) {
    meta = `<div class="card-meta">${chips.map(c => `<span class="card-meta-chip"><i data-lucide="${c.icon}"></i><span>${c.text}</span></span>`).join('')}</div>`;
  }

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
        ${propertyTypeBadgeHTML} <!-- ✅ شارة نوع العقار هنا -->
        <p class="card-location"><i data-lucide="map-pin"></i>${location}</p>
        ${meta}
        <p class="card-price">${priceText}</p>
      </div>
    </a>
  `;
}

function renderProperties() {
  const grid = document.getElementById('propertiesGrid');
  const countEl = document.getElementById('resultsCount');
  const noResultsMsg = document.getElementById('noResultsMessage');

  if (!grid) return;
  if (countEl) countEl.textContent = filteredProperties.length;

  if (filteredProperties.length === 0) {
    grid.style.display = 'none';
    grid.innerHTML = '';
    if (noResultsMsg) {
      noResultsMsg.style.display = 'block';
      initIcons();
    }
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.style.display = '';
  if (noResultsMsg) noResultsMsg.style.display = 'none';

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

window.goToPage = function (page) {
  currentPage = page;
  renderProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.clearAllFilters = function () {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);

  const purposeAll = document.querySelector('input[name="purpose"][value=""]');
  if (purposeAll) purposeAll.checked = true;
  const roomsAll = document.querySelector('input[name="rooms"][value=""]');
  if (roomsAll) roomsAll.checked = true;

  ['filterCity', 'priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyFilters();
};

function setupEvents() {
  document.querySelectorAll('input[name="purpose"], input[name="type"], input[name="rooms"], input[name="furnished"]')
    .forEach(el => el.addEventListener('change', applyFilters));

  ['filterCity', 'priceMin', 'priceMax', 'areaMin', 'areaMax'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
  document.getElementById('sortSelect')?.addEventListener('change', sortProperties);

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
   🗺️ تبديل عرض القائمة / الخريطة (محسّن)
   ========================================== */
function setupMapToggle() {
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewMapBtn = document.getElementById('viewMapBtn');
  const mapContainer = document.getElementById('mapContainer');
  const grid = document.getElementById('propertiesGrid');

  if (!viewGridBtn || !viewMapBtn || !mapContainer || !grid) return;

  viewGridBtn.addEventListener('click', () => {
    viewGridBtn.classList.add('active');
    viewMapBtn.classList.remove('active');
    mapContainer.style.display = 'none';
    grid.classList.remove('map-hidden');
    grid.style.display = '';
  });

  viewMapBtn.addEventListener('click', () => {
    viewGridBtn.classList.remove('active');
    viewMapBtn.classList.add('active');
    grid.classList.add('map-hidden');
    mapContainer.style.display = 'block';

    if (!mapInitialized) {
      setTimeout(() => {
        if (!window.MapView) return;
        window.MapView.init('mapContainer');
        window.MapView.addMarkers(filteredProperties || allProperties || []);
        mapInitialized = true;
        initIcons();
      }, 100);
    } else {
      setTimeout(() => {
        if (window.MapView) window.MapView.addMarkers(filteredProperties || allProperties || []);
      }, 100);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEvents();
  setupMapToggle();
  loadProperties();
});