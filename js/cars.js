/* ==========================================
   صفحة السيارات - البيانات من API فقط
   الإصدار: 2.0 (محسّن للأداء + دعم أحجام متعددة)
   ========================================== */

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let currentView = 'grid';
let allCars = [];
let filteredCars = [];

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

async function loadCars() {
  try {
    const listings = await API.Listings.getAll({ type: 'car' });
    allCars = listings || [];
    applyFilters();
  } catch (e) {
    console.error('خطأ:', e);
    allCars = [];
    applyFilters();
  }
}

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

function applyFilters() {
  const f = getFilters();

  filteredCars = allCars.filter(c => {
    if (f.purpose && c.purpose !== f.purpose) return false;
    if (f.brands.length && !f.brands.includes(c.details?.brand)) return false;
    if (f.city && c.city !== f.city) return false;

    const price = Number(c.price) || 0;
    if (price < f.priceMin || price > f.priceMax) return false;

    const year = Number(c.details?.year) || 0;
    if (year < f.yearMin || year > f.yearMax) return false;

    if (f.condition && c.details?.condition !== f.condition) return false;
    if (f.transmission && c.details?.transmission !== f.transmission) return false;
    if (f.fuels.length && !f.fuels.includes(c.details?.fuel)) return false;

    const km = Number(c.details?.km) || 0;
    if (km > f.kmMax) return false;

    return true;
  });

  currentPage = 1;
  sortCars();
}

function sortCars() {
  const sort = document.getElementById('sortSelect')?.value || 'newest';

  switch (sort) {
    case 'price-asc': filteredCars.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break;
    case 'price-desc': filteredCars.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break;
    case 'year-desc': filteredCars.sort((a, b) => (Number(b.details?.year) || 0) - (Number(a.details?.year) || 0)); break;
    default: filteredCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderCars();
}

function getStatusBadge(status) {
  if (status === 'sold') return `<span class="status-badge sold"><i data-lucide="check-circle"></i>مباع</span>`;
  if (status === 'rented') return `<span class="status-badge rented"><i data-lucide="key-round"></i>مؤجر</span>`;
  return '';
}

function createCarCard(item) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceNum = Number(item.price) || 0;
  const priceText = item.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${priceNum} ${item.currency || 'USD'} <small>/ يوم</small>`;

  const featuredBadge = item.featured ? `<span class="card-badge featured">⭐ مميز</span>` : '';
  const statusBadge = getStatusBadge(item.status);
  const isUnavailable = item.status === 'sold' || item.status === 'rented';

  const icon = 'car';

  // ✅ استخدام srcset + sizes للأداء الفائق
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
  let meta = '';
  const chips = [];
  if (d.brandName || d.brand) chips.push({ icon: 'car', text: d.brandName || d.brand });
  if (d.year) chips.push({ icon: 'calendar', text: d.year });
  if (d.km && item.purpose === 'sale') chips.push({ icon: 'gauge', text: `${Number(d.km).toLocaleString('en-US')} كم` });

  if (chips.length) {
    meta = `<div class="card-meta">${chips.map(c => `<span class="card-meta-chip"><i data-lucide="${c.icon}"></i><span>${c.text}</span></span>`).join('')}</div>`;
  }

  return `
    <a href="details.html?id=${item.id}&type=car" class="card ${isUnavailable ? 'card-unavailable' : ''}">
      <div class="card-image">
        ${imageContent}
        ${featuredBadge}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
        ${statusBadge}
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-location"><i data-lucide="map-pin"></i>${location}</p>
        ${meta}
        <p class="card-price">${priceText}</p>
      </div>
    </a>
  `;
}

function renderCars() {
  const grid = document.getElementById('carsGrid');
  const countEl = document.getElementById('resultsCount');
  const noResultsMsg = document.getElementById('noResultsMessage');

  if (!grid) return;
  if (countEl) countEl.textContent = filteredCars.length;

  if (filteredCars.length === 0) {
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

  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredCars.slice(start, start + ITEMS_PER_PAGE);

  grid.className = currentView === 'grid' ? 'properties-grid' : 'properties-list';
  grid.innerHTML = pageItems.map(createCarCard).join('');

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
  renderCars();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.clearAllFilters = function() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelector('input[name="purpose"][value=""]').checked = true;
  document.querySelector('input[name="condition"][value=""]').checked = true;
  document.querySelector('input[name="transmission"][value=""]').checked = true;
  ['filterCity', 'priceMin', 'priceMax', 'yearMin', 'yearMax', 'kmMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyFilters();
};

function setupEvents() {
  document.querySelectorAll('input[name="purpose"], input[name="brand"], input[name="condition"], input[name="transmission"], input[name="fuel"]')
    .forEach(el => el.addEventListener('change', applyFilters));

  ['filterCity', 'priceMin', 'priceMax', 'yearMin', 'yearMax', 'kmMax'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
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

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEvents();
  loadCars();
});