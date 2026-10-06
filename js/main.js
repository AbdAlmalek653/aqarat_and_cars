/* ==========================================
   الصفحة الرئيسية - سوق
   الإصدار: 7.1 (إضافة شارة نوع العقار)
   ========================================== */

function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

const CITY_NAMES = {
  damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب',
  homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية',
  tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء',
  quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور',
  raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب'
};

const TYPE_NAMES = { property: 'عقارات', car: 'سيارات' };

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

const PURPOSE_NAMES = { sale: 'للبيع', rent: 'للإيجار' };

/* ✅ قاموس الماركات */
const CAR_BRANDS = {
  toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس',
  bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه',
  ford: 'فورد', mazda: 'مازدا', mitsubishi: 'ميتسوبيشي',
  volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس',
  renault: 'رينو', peugeot: 'بيجو', fiat: 'فيات', seat: 'سيات',
  skoda: 'سكودا', opel: 'أوبل', jeep: 'جيب', landrover: 'لاند روفر',
  tesla: 'تسلا', volvo: 'فولفو', subaru: 'سوبارو', other: 'أخرى'
};

/* ==========================================
   ✅ دوال مساعدة
   ========================================== */
function normalizeCityKey(listing) {
  if (!listing) return [];
  const keys = [];
  if (listing.city_slug) keys.push(String(listing.city_slug).toLowerCase().trim());
  if (listing.city_name) keys.push(String(listing.city_name).toLowerCase().trim());
  if (listing.city) keys.push(String(listing.city).toLowerCase().trim());
  return keys.filter(Boolean);
}

function cityMatches(listing, targetSlug) {
  if (!targetSlug) return true;
  const target = String(targetSlug).toLowerCase().trim();
  const targetName = String(CITY_NAMES[target] || '').toLowerCase().trim();
  const listingKeys = normalizeCityKey(listing);
  return listingKeys.some(key => key === target || (targetName && key === targetName));
}

function getNegotiableStatus(listing) {
  if (!listing) return null;
  const d = listing.details || {};
  const value = String(listing.negotiable || d.negotiable || '').trim().toLowerCase();
  if (value === 'قابل' || value === 'قابل للتفاوض' || value === 'negotiable' ||
      value === 'yes' || value === 'true' || value === '1') return 'yes';
  if (value === 'غير قابل' || value === 'غير قابل للتفاوض' || value === 'no' ||
      value === 'false' || value === '0') return 'no';
  return null;
}

/* ✅ استخراج ماركة وموديل السيارة */
function getCarBrandText(listing) {
  const d = listing.details || {};
  if (d.brandName) return String(d.brandName).trim();
  const key = String(d.brand || '').toLowerCase();
  return CAR_BRANDS[key] || d.brand || '';
}

function getCarModelText(listing) {
  const d = listing.details || {};
  return String(d.model || '').trim();
}

/* ==========================================
   ✅ دالة جلب الإعلانات
   ========================================== */
async function getCachedListings(forceRefresh) {
  try {
    const options = forceRefresh ? { forceRefresh: true } : {};
    console.log('🔄 جلب الإعلانات من API...');
    const data = await API.Listings.getAll({}, options);
    console.log('✅ API رجع:', data);

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.listings)) return data.listings;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.items)) return data.items;

    console.warn('⚠️ استجابة غير متوقعة من API:', data);
    return [];
  } catch (error) {
    console.error('❌ فشل تحميل الإعلانات:', error);
    return [];
  }
}

/* ==========================================
   ✅ روابط الصور
   ========================================== */
function getImageUrls(item, index = 0) {
  if (!item || !item.id) {
    return { thumb: null, medium: null, large: null, srcset: '', sizes: '' };
  }
  const base = `/api/listing_image.php?id=${item.id}&index=${index}`;
  const thumb  = `${base}&size=thumb`;
  const medium = `${base}&size=medium`;
  const large  = `${base}&size=large`;
  return {
    thumb,
    medium,
    large,
    srcset: `${thumb} 300w, ${medium} 800w, ${large} 1600w`,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw'
  };
}

function getImageUrl(item) {
  if (window.getListingImageUrl) return window.getListingImageUrl(item, 0);
  return getImageUrls(item).medium;
}

/* ==========================================
   ✅ createCard (مع شارة الماركة وشارة نوع العقار)
   ========================================== */
function createCard(item, type) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';
  const priceNum = Number(item.price) || 0;
  const priceText = item.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${priceNum} ${item.currency || 'USD'} <small>/ يوم</small>`;

  let icon = type === 'property' ? 'building-2' : 'car';
  if (item.subType === 'villa') icon = 'home';
  if (item.subType === 'land') icon = 'trees';
  if (item.subType === 'office') icon = 'briefcase';
  if (item.subType === 'shop') icon = 'store';
  if (item.subType === 'chalet') icon = 'tent';
  if (item.subType === 'arabic-house') icon = 'landmark';

  const urls = getImageUrls(item, 0);
  const safeTitle = (item.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const imageContent = urls.medium
    ? `<img 
         src="${urls.medium}"
         srcset="${urls.srcset}"
         sizes="${urls.sizes}"
         alt="${safeTitle}"
         loading="lazy"
         decoding="async"
         fetchpriority="low"
         width="800" 
         height="600"
         onerror="this.onerror=null;this.style.display='none';this.parentNode.classList.add('image-failed');this.parentNode.innerHTML='<i data-lucide=\\'${icon}\\'></i>';if(window.lucide)window.lucide.createIcons();"
       >`
    : `<i data-lucide="${icon}"></i>`;

  const featuredBadge = item.featured ? `<span class="card-badge featured">⭐ مميز</span>` : '';

  /* ✅ المحافظة */
  let locationText = '—';
  const citySlug = item.city_slug || item.city || '';
  const cityNameFromAPI = item.city_name || item.cityName || '';
  
  if (cityNameFromAPI && cityNameFromAPI.trim()) {
    locationText = cityNameFromAPI.trim();
  } else if (citySlug && CITY_NAMES[citySlug]) {
    locationText = CITY_NAMES[citySlug];
  } else if (citySlug && /[\u0600-\u06FF]/.test(citySlug)) {
    locationText = citySlug;
  } else if (item.location && item.location.trim()) {
    locationText = item.location.trim();
  }
  
  if (item.area && item.area.trim()) {
    locationText = locationText === '—' ? item.area : `${locationText} - ${item.area}`;
  }

  const d = item.details || {};
  let chips = [];
  let carBrandBadgeHTML = ''; // متغير مشترك للسيارات والعقارات

  if (type === 'car') {
    /* ✅ للسيارات: ماركة + موديل كشارة منفصلة */
    const brandText = getCarBrandText(item);
    const modelText = getCarModelText(item);
    const fullBrandModel = [brandText, modelText].filter(Boolean).join(' ');
    
    if (fullBrandModel) {
      carBrandBadgeHTML = `
        <div class="car-brand-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
          <span>${fullBrandModel}</span>
        </div>`;
    }
    
    if (d.year) chips.push({ icon: 'calendar', text: d.year });
    if (d.km && item.purpose === 'sale') chips.push({ icon: 'gauge', text: `${Number(d.km).toLocaleString('en-US')} كم` });
    if (d.transmission) chips.push({ icon: 'settings-2', text: d.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي' });

  } else {
    /* ✅ للعقارات: استخراج النوع كشارة منفصلة */
    const rawType = item.subType || item.subtype || d.propertyType || d.property_type || item.property_type;
    const typeText = getPropertyTypeName(rawType);
    
    if (typeText) {
      carBrandBadgeHTML = `
        <div class="car-brand-badge" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-color: rgba(59, 130, 246, 0.3);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
          </svg>
          <span>${typeText}</span>
        </div>`;
    }
    
    const area = d.area || d.landArea || d.commercialArea;
    if (area) chips.push({ icon: 'square', text: `${area} م²` });
    if (d.rooms) chips.push({ icon: 'bed-double', text: `${d.rooms} غرف` });
    if (d.bathrooms) chips.push({ icon: 'bath', text: `${d.bathrooms} حمام` });
    if (d.furnished && item.purpose === 'rent') {
      const furnishedText = { furnished: 'مفروش', 'semi-furnished': 'نصف مفروش', unfurnished: 'غير مفروش' }[d.furnished] || d.furnished;
      chips.push({ icon: 'sofa', text: furnishedText });
    }
  }

  chips = chips.slice(0, 3);
  const chipsHTML = chips.length
    ? `<div class="card-meta">${chips.map(c => `<span class="card-meta-chip"><i data-lucide="${c.icon}"></i><span>${c.text}</span></span>`).join('')}</div>`
    : '';

  /* ✅ شارة قابل للتفاوض */
  const negotiableStatus = getNegotiableStatus(item);
  let negotiableBadge = '';
  if (negotiableStatus === 'yes') {
    negotiableBadge = `<span class="card-negotiable yes"><i data-lucide="handshake"></i>قابل للتفاوض</span>`;
  } else if (negotiableStatus === 'no') {
    negotiableBadge = `<span class="card-negotiable no"><i data-lucide="x-circle"></i>غير قابل للتفاوض</span>`;
  }

  return `<a href="pages/details.html?id=${item.id}&type=${type}" class="card">
      <div class="card-image">${imageContent}${featuredBadge}<span class="card-badge ${purposeClass}">${purposeText}</span></div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        ${carBrandBadgeHTML}
        <p class="card-location"><i data-lucide="map-pin"></i>${locationText}</p>
        ${chipsHTML}
        <div class="card-price-row">
          <p class="card-price">${priceText}</p>
          ${negotiableBadge}
        </div>
      </div>
    </a>`;
}

/* ==========================================
   ✅ Empty States
   ========================================== */
function emptyState(type) {
  const isProperty = type === 'property';
  const icon = isProperty ? 'building-2' : 'car';
  const text = isProperty ? 'عقار' : 'سيارة';
  const pluralText = isProperty ? 'عقارات' : 'سيارات';
  return `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-bg-glow"></div>
      <div class="empty-icon-wrap"><div class="empty-icon-ring"></div><div class="empty-icon-ring ring-2"></div><div class="empty-icon"><i data-lucide="${icon}"></i></div></div>
      <h3 class="empty-title">لا توجد <span class="gradient-text">${pluralText}</span> حالياً</h3>
      <p class="empty-subtitle">كن أول من يضيف إعلان ${text} في منصتنا</p>
      <a href="pages/add-listing.html?type=${type}" class="empty-cta-btn">
        <span class="empty-cta-icon"><i data-lucide="plus"></i></span><span>أضف إعلان ${text} الآن</span><i data-lucide="arrow-left" class="empty-cta-arrow"></i>
      </a>
    </div>`;
}

function emptyFilterState() {
  const typeText = TYPE_NAMES[cascadeState.type] || '';
  const purposeText = PURPOSE_NAMES[cascadeState.purpose] || '';
  const cityText = CITY_NAMES[cascadeState.city] || '';
  const timestamp = Date.now();
  const refNumber = timestamp.toString().slice(-6);
  const waMessage = `مرحباً أبو أيمن، 👋\n\n🔍 أبحث عن إعلان:\n🏠 النوع: ${typeText}\n💰 الغرض: ${purposeText}\n📍 المحافظة: ${cityText}\n\n— رقم المرجع: #${refNumber}`;
  const waUrl = `https://wa.me/963930932794?text=${encodeURIComponent(waMessage)}&t=${timestamp}`;

  return `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-bg-glow"></div>
      <div class="empty-icon-wrap"><div class="empty-icon-ring"></div><div class="empty-icon-ring ring-2"></div><div class="empty-icon"><i data-lucide="search-x"></i></div></div>
      <h3 class="empty-title">لا توجد <span class="gradient-text">نتائج مطابقة</span></h3>
      <p class="empty-subtitle">عذراً، لا توجد ${typeText} ${purposeText} في ${cityText} حالياً</p>
      <div class="search-summary">
        <div class="search-summary-item"><i data-lucide="building-2"></i><span>${typeText}</span></div>
        <div class="search-summary-item"><i data-lucide="tag"></i><span>${purposeText}</span></div>
        <div class="search-summary-item"><i data-lucide="map-pin"></i><span>${cityText}</span></div>
      </div>
      <a href="${waUrl}" target="_blank" rel="noopener" class="empty-cta-btn empty-cta-whatsapp">
        <span class="empty-cta-icon"><i data-lucide="message-circle"></i></span>
        <span>تواصل مع أبو أيمن للبحث عن إعلان</span>
        <i data-lucide="arrow-left" class="empty-cta-arrow"></i>
      </a>
      <button class="empty-secondary-btn" onclick="resetCascadeFilter()" type="button">
        <i data-lucide="rotate-ccw"></i><span>تصفير الفلتر والبدء من جديد</span>
      </button>
    </div>`;
}

/* ==========================================
   ✅ Load Featured
   ========================================== */
const MAX_FEATURED_ITEMS = 8;

async function loadAllFeatured(forceRefresh) {
  const propContainer = document.getElementById('featuredProperties');
  const carsContainer = document.getElementById('featuredCars');

  if (!propContainer && !carsContainer) return;

  try {
    const allListings = await getCachedListings(forceRefresh);

    const properties = allListings
      .filter(l => l.type === 'property')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_FEATURED_ITEMS);

    const cars = allListings
      .filter(l => l.type === 'car')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_FEATURED_ITEMS);

    if (propContainer) {
      propContainer.innerHTML = properties.length === 0
        ? emptyState('property')
        : properties.map(p => createCard(p, 'property')).join('');
    }

    if (carsContainer) {
      carsContainer.innerHTML = cars.length === 0
        ? emptyState('car')
        : cars.map(c => createCard(c, 'car')).join('');
    }

    initIcons();
  } catch (e) {
    console.error('❌ loadAllFeatured error:', e);
    if (propContainer) propContainer.innerHTML = emptyState('property');
    if (carsContainer) carsContainer.innerHTML = emptyState('car');
    initIcons();
  }
}

async function loadStats(forceRefresh) {
  try {
    const options = forceRefresh ? { forceRefresh: true } : {};
    const stats = await API.Stats.get(options);
    animateNumber('statProperties', stats.properties || 0);
    animateNumber('statCars', stats.cars || 0);
    animateNumber('statUsers', stats.users || 0);
  } catch (e) {
    try {
      const allListings = await getCachedListings(forceRefresh);
      if (allListings.length > 0) {
        animateNumber('statProperties', allListings.filter(l => l.type === 'property').length);
        animateNumber('statCars', allListings.filter(l => l.type === 'car').length);
      }
    } catch (fallbackError) {}
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (target === 0) { el.textContent = '0'; return; }
  const duration = 1200;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(0 + target * eased).toLocaleString('en-US');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('en-US') + '+';
  }
  requestAnimationFrame(update);
}

/* ==========================================
   ✅ Welcome Modal
   ========================================== */
function setupWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;
  const lastSeen = localStorage.getItem('souq_welcome_seen');
  if (lastSeen && (Date.now() - parseInt(lastSeen)) < 86400000) return;
  setTimeout(() => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    initIcons();
  }, 800);
}

window.closeWelcome = function () {
  const modal = document.getElementById('welcomeModal');
  if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
  localStorage.setItem('souq_welcome_seen', Date.now().toString());
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closeWelcome();
});

/* ==========================================
   ✅ Cascade Filter
   ========================================== */
const cascadeState = { type: null, purpose: null, city: null };

function hideResults() {
  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('latestGrid');
  const emptyEl = document.getElementById('cascadeEmpty');
  if (resultsSection) resultsSection.style.display = 'none';
  if (grid) { grid.style.display = 'none'; grid.innerHTML = ''; }
  if (emptyEl) emptyEl.style.display = 'none';
}

window.resetCascadeFilter = function () {
  cascadeState.type = null;
  cascadeState.purpose = null;
  cascadeState.city = null;

  document.querySelectorAll('.cascade-btn').forEach(b => b.classList.remove('selected'));

  const step2 = document.querySelector('.cascade-step[data-step="2"]');
  const step3 = document.querySelector('.cascade-step[data-step="3"]');
  const step4 = document.querySelector('.cascade-step[data-step="4"]');

  if (step2) { step2.classList.add('locked'); step2.classList.remove('active'); }
  if (step3) { step3.classList.add('locked'); step3.classList.remove('active'); }
  if (step4) { step4.classList.add('locked'); step4.classList.remove('active'); }

  document.querySelectorAll('.cascade-btn[data-purpose]').forEach(b => {
    b.disabled = true;
    b.classList.remove('selected');
  });

  const citySelect = document.getElementById('cascadeCity');
  if (citySelect) { citySelect.disabled = true; citySelect.value = ''; }

  const showBtn = document.getElementById('cascadeShowBtn');
  if (showBtn) showBtn.disabled = true;

  hideResults();
  initIcons();
};

function setupCascadeFilter() {
  document.querySelectorAll('.cascade-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cascade-btn[data-type]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      cascadeState.type = btn.dataset.type;
      cascadeState.purpose = null;
      cascadeState.city = null;

      const step2 = document.querySelector('.cascade-step[data-step="2"]');
      step2.classList.remove('locked');
      step2.classList.add('active');
      step2.querySelectorAll('.cascade-btn').forEach(b => {
        b.disabled = false;
        b.classList.remove('selected');
      });

      const step3 = document.querySelector('.cascade-step[data-step="3"]');
      step3.classList.add('locked');
      step3.classList.remove('active');

      const citySelect = document.getElementById('cascadeCity');
      if (citySelect) { citySelect.disabled = true; citySelect.value = ''; }

      const step4 = document.querySelector('.cascade-step[data-step="4"]');
      step4.classList.add('locked');
      step4.classList.remove('active');

      const showBtn = document.getElementById('cascadeShowBtn');
      if (showBtn) showBtn.disabled = true;

      hideResults();
      initIcons();
    });
  });

  document.querySelectorAll('.cascade-btn[data-purpose]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      document.querySelectorAll('.cascade-btn[data-purpose]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      cascadeState.purpose = btn.dataset.purpose;
      cascadeState.city = null;

      const step3 = document.querySelector('.cascade-step[data-step="3"]');
      step3.classList.remove('locked');
      step3.classList.add('active');

      const citySelect = document.getElementById('cascadeCity');
      if (citySelect) { citySelect.disabled = false; citySelect.value = ''; }

      const step4 = document.querySelector('.cascade-step[data-step="4"]');
      step4.classList.add('locked');
      step4.classList.remove('active');

      const showBtn = document.getElementById('cascadeShowBtn');
      if (showBtn) showBtn.disabled = true;

      hideResults();
      initIcons();
    });
  });

  const citySelect = document.getElementById('cascadeCity');
  if (citySelect) {
    citySelect.addEventListener('change', () => {
      cascadeState.city = citySelect.value || null;
      const step4 = document.querySelector('.cascade-step[data-step="4"]');
      const showBtn = document.getElementById('cascadeShowBtn');
      if (cascadeState.city) {
        if (step4) { step4.classList.remove('locked'); step4.classList.add('active'); }
        if (showBtn) showBtn.disabled = false;
      } else {
        if (step4) { step4.classList.add('locked'); step4.classList.remove('active'); }
        if (showBtn) showBtn.disabled = true;
      }
      hideResults();
      initIcons();
    });
  }

  const showBtn = document.getElementById('cascadeShowBtn');
  if (showBtn) showBtn.addEventListener('click', handleCascadeShow);
}

/* ==========================================
   ✅ الفلترة النهائية
   ========================================== */
async function handleCascadeShow() {
  console.log('🎯 ضغط زر عرض الإعلانات');
  console.log('📊 الحالة:', cascadeState);

  if (!cascadeState.type || !cascadeState.purpose || !cascadeState.city) {
    console.warn('⚠️ الفلتر غير مكتمل');
    return;
  }

  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('latestGrid');

  if (!resultsSection || !grid) {
    console.error('❌ نتائج البحث غير موجودة');
    return;
  }

  resultsSection.style.display = 'block';
  resultsSection.querySelectorAll('.empty-state').forEach(el => el.remove());

  grid.style.display = 'grid';
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <i data-lucide="loader-2" class="spin" style="width:48px;height:48px;color:var(--primary);margin-bottom:16px;"></i>
      <p style="color:var(--text-secondary);">جاري تحميل الإعلانات...</p>
    </div>`;

  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  try {
    const allListings = await getCachedListings(true);
    console.log(`📦 عدد الإعلانات الكلي: ${allListings.length}`);

    const listings = allListings.filter(l => {
      if (cascadeState.type && l.type !== cascadeState.type) return false;
      if (cascadeState.purpose && l.purpose !== cascadeState.purpose) return false;
      if (cascadeState.city && !cityMatches(l, cascadeState.city)) return false;
      return true;
    });

    console.log(`✅ عدد النتائج بعد الفلترة: ${listings.length}`);

    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const typeText = TYPE_NAMES[cascadeState.type] || '';
    const purposeText = PURPOSE_NAMES[cascadeState.purpose] || '';
    const cityText = CITY_NAMES[cascadeState.city] || cascadeState.city;

    const resultsTitleEl = resultsSection.querySelector('.section-title span');
    const resultsSubtitleEl = resultsSection.querySelector('.section-subtitle');
    if (resultsTitleEl) resultsTitleEl.textContent = `نتائج البحث (${listings.length})`;
    if (resultsSubtitleEl) resultsSubtitleEl.textContent = `${typeText} ${purposeText} في ${cityText}`;

    if (listings.length === 0) {
      grid.style.display = 'none';
      grid.innerHTML = '';
      const newEmpty = document.createElement('div');
      newEmpty.className = 'empty-state';
      newEmpty.id = 'cascadeEmpty';
      newEmpty.style.cssText = 'grid-column:1/-1;';
      newEmpty.innerHTML = emptyFilterState();
      resultsSection.appendChild(newEmpty);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = listings.map(item => createCard(item, item.type)).join('');
    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    console.error('❌ خطأ في البحث:', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--danger);">
        <i data-lucide="alert-circle" style="width:48px;height:48px;margin-bottom:16px;"></i>
        <p>حدث خطأ أثناء تحميل الإعلانات.</p>
      </div>`;
    if (window.lucide) window.lucide.createIcons();
  }
}

/* ==========================================
   ✅ Auto-refresh
   ========================================== */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let refreshIntervalId = null;
let isRefreshing = false;

async function performRefresh() {
  if (isRefreshing) return;
  if (document.hidden) return;
  isRefreshing = true;
  try {
    await Promise.all([
      loadAllFeatured(true),
      loadStats(true)
    ]);
  } catch (e) {
    console.warn('⚠️ Auto-refresh error:', e);
  } finally {
    isRefreshing = false;
  }
}

function startAutoRefresh() {
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(performRefresh, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAutoRefresh();
  else startAutoRefresh();
});

/* ==========================================
   ✅ تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadAllFeatured(false);
  loadStats(false);
  setupWelcomeModal();
  setupCascadeFilter();
  initIcons();
  startAutoRefresh();
});