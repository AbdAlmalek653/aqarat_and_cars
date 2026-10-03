/* ==========================================
   الصفحة الرئيسية - سوق
   الإصدار: 4.0 (فلترة مصححة + حماية ضد الأخطاء)
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
const PURPOSE_NAMES = { sale: 'للبيع', rent: 'للإيجار' };

/* ==========================================
   ✅ دوال مساعدة: توحيد اسم المحافظة والمقارنة
   ========================================== */

/**
 * استخراج كل المفاتيح المحتملة للمحافظة من الإعلان
 */
function normalizeCityKey(listing) {
  if (!listing) return [];
  const keys = [];
  if (listing.city_slug) keys.push(String(listing.city_slug).toLowerCase().trim());
  if (listing.city_name) keys.push(String(listing.city_name).toLowerCase().trim());
  if (listing.city) keys.push(String(listing.city).toLowerCase().trim());
  return keys.filter(Boolean);
}

/**
 * التحقق من تطابق المحافظة مع الفلتر (يدعم العربية والإنجليزية)
 */
function cityMatches(listing, targetSlug) {
  if (!targetSlug) return true;
  const target = String(targetSlug).toLowerCase().trim();
  const targetName = String(CITY_NAMES[target] || '').toLowerCase().trim();
  
  const listingKeys = normalizeCityKey(listing);
  
  return listingKeys.some(key => 
    key === target || 
    (targetName && key === targetName)
  );
}

/* ==========================================
   ✅ تحسين 1: منع استدعاءات API المتزامنة
   ========================================== */
let _listingsPromise = null;

async function getCachedListings(forceRefresh) {
  if (_listingsPromise && !forceRefresh) {
    return _listingsPromise;
  }

  _listingsPromise = (async () => {
    try {
      const options = forceRefresh ? { forceRefresh: true } : {};
      const data = await API.Listings.getAll({}, options);

      // ✅ حماية ضد أي شكل غير متوقع من البيانات
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.listings)) return data.listings;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && Array.isArray(data.items)) return data.items;

      console.warn('⚠️ استجابة غير متوقعة من API:', data);
      return [];
    } catch (error) {
      console.error('❌ فشل تحميل الإعلانات:', error);
      return [];
    } finally {
      setTimeout(() => { _listingsPromise = null; }, 100);
    }
  })();

  return _listingsPromise;
}

/* ==========================================
   ✅ تحسين 2: دالة موحدة لتوليد روابط الصور
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
   ✅ تحسين 3: createCard مع srcset + المدينة المصححة
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

  // ✅ إصلاح: استخدام city_slug و city_name و city بالترتيب الصحيح
  let locationText = '';
  const cityKey = item.city_slug || item.city;
  const cityName = item.city_name || (cityKey ? CITY_NAMES[cityKey] : '');
  if (cityName) locationText = cityName;
  if (item.area) locationText = locationText ? `${locationText} - ${item.area}` : item.area;
  if (!locationText) locationText = item.location || '—';

  const d = item.details || {};
  let chips = [];

  if (type === 'car') {
    const brandNames = { toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد', mazda: 'مازدا', mitsubishi: 'ميتسوبيشي', volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', other: 'أخرى' };
    if (d.brandName) chips.push({ icon: 'car', text: d.brandName });
    else if (d.brand) chips.push({ icon: 'car', text: brandNames[d.brand] || d.brand });
    if (d.model) chips.push({ icon: 'tag', text: d.model });
    if (d.year) chips.push({ icon: 'calendar', text: d.year });
    if (d.km && item.purpose === 'sale') chips.push({ icon: 'gauge', text: `${Number(d.km).toLocaleString('en-US')} كم` });
    if (d.transmission) chips.push({ icon: 'settings-2', text: d.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي' });
  } else {
    const typeNames = { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' };
    if (item.subType) chips.push({ icon: 'building-2', text: typeNames[item.subType] || item.subType });
    else if (d.propertyType) chips.push({ icon: 'building-2', text: typeNames[d.propertyType] || d.propertyType });
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

  return `<a href="pages/details.html?id=${item.id}&type=${type}" class="card">
      <div class="card-image">${imageContent}${featuredBadge}<span class="card-badge ${purposeClass}">${purposeText}</span></div>
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-location"><i data-lucide="map-pin"></i>${locationText}</p>
        ${chipsHTML}
        <p class="card-price">${priceText}</p>
      </div>
    </a>`;
}

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
   ✅ تحسين 4: عرض 8 بطاقات فقط لكل قسم
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

async function loadFeaturedProperties(forceRefresh) {
  const container = document.getElementById('featuredProperties');
  if (!container) return;
  try {
    const allListings = await getCachedListings(forceRefresh);
    const properties = allListings
      .filter(l => l.type === 'property')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_FEATURED_ITEMS);
    container.innerHTML = properties.length === 0
      ? emptyState('property')
      : properties.map(p => createCard(p, 'property')).join('');
    initIcons();
  } catch (e) {
    container.innerHTML = emptyState('property');
    initIcons();
  }
}

async function loadFeaturedCars(forceRefresh) {
  const container = document.getElementById('featuredCars');
  if (!container) return;
  try {
    const allListings = await getCachedListings(forceRefresh);
    const cars = allListings
      .filter(l => l.type === 'car')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_FEATURED_ITEMS);
    container.innerHTML = cars.length === 0
      ? emptyState('car')
      : cars.map(c => createCard(c, 'car')).join('');
    initIcons();
  } catch (e) {
    container.innerHTML = emptyState('car');
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

function setupSearchTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

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
  cascadeState.type = null; cascadeState.purpose = null; cascadeState.city = null;
  document.querySelectorAll('.cascade-btn').forEach(b => b.classList.remove('selected'));
  const step2 = document.querySelector('.cascade-step[data-step="2"]');
  const step3 = document.querySelector('.cascade-step[data-step="3"]');
  const step4 = document.querySelector('.cascade-step[data-step="4"]');
  if (step2) { step2.classList.add('locked'); step2.classList.remove('active'); }
  if (step3) { step3.classList.add('locked'); step3.classList.remove('active'); }
  if (step4) { step4.classList.add('locked'); step4.classList.remove('active'); }
  document.querySelectorAll('.cascade-btn[data-purpose]').forEach(b => { b.disabled = true; b.classList.remove('selected'); });
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
      step2.classList.remove('locked'); step2.classList.add('active');
      step2.querySelectorAll('.cascade-btn').forEach(b => { b.disabled = false; b.classList.remove('selected'); });
      const step3 = document.querySelector('.cascade-step[data-step="3"]');
      step3.classList.add('locked'); step3.classList.remove('active');
      const citySelect = document.getElementById('cascadeCity');
      if (citySelect) { citySelect.disabled = true; citySelect.value = ''; }
      const step4 = document.querySelector('.cascade-step[data-step="4"]');
      step4.classList.add('locked'); step4.classList.remove('active');
      const showBtn = document.getElementById('cascadeShowBtn');
      if (showBtn) showBtn.disabled = true;
      hideResults(); initIcons();
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
      step3.classList.remove('locked'); step3.classList.add('active');
      const citySelect = document.getElementById('cascadeCity');
      if (citySelect) { citySelect.disabled = false; citySelect.value = ''; }
      const step4 = document.querySelector('.cascade-step[data-step="4"]');
      step4.classList.add('locked'); step4.classList.remove('active');
      const showBtn = document.getElementById('cascadeShowBtn');
      if (showBtn) showBtn.disabled = true;
      hideResults(); initIcons();
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
      hideResults(); initIcons();
    });
  }

  const showBtn = document.getElementById('cascadeShowBtn');
  if (showBtn) showBtn.addEventListener('click', handleCascadeShow);
}

/* ==========================================
   🎯 الفلترة النهائية الشاملة (مصححة)
   ========================================== */
async function handleCascadeShow() {
  if (!cascadeState.type || !cascadeState.purpose || !cascadeState.city) {
    console.warn('⚠️ الفلتر غير مكتمل');
    return;
  }

  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('latestGrid');
  
  if (!resultsSection || !grid) return;

  // عرض قسم النتائج
  resultsSection.style.display = 'block';

  // إزالة رسائل "لا توجد نتائج" القديمة
  resultsSection.querySelectorAll('.empty-state').forEach(el => el.remove());

  // عرض مؤشر التحميل
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
    const allListings = await getCachedListings(false);

    // ✅ الفلترة المحسّنة باستخدام cityMatches
    const listings = allListings.filter(l => {
      // 1. النوع (سيارة/عقار)
      if (cascadeState.type && l.type !== cascadeState.type) return false;
      
      // 2. الغرض (بيع/إيجار)
      if (cascadeState.purpose && l.purpose !== cascadeState.purpose) return false;
      
      // 3. المحافظة (بالدالة المساعدة)
      if (cascadeState.city && !cityMatches(l, cascadeState.city)) return false;
      
      return true;
    });

    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const typeText = TYPE_NAMES[cascadeState.type] || '';
    const purposeText = PURPOSE_NAMES[cascadeState.purpose] || '';
    const cityText = CITY_NAMES[cascadeState.city] || cascadeState.city;

    if (resultsSection) {
      const resultsTitleEl = resultsSection.querySelector('.section-title span');
      const resultsSubtitleEl = resultsSection.querySelector('.section-subtitle');
      if (resultsTitleEl) resultsTitleEl.textContent = `نتائج البحث (${listings.length})`;
      if (resultsSubtitleEl) resultsSubtitleEl.textContent = `${typeText} ${purposeText} في ${cityText}`;
    }

    // ✅ إذا لا توجد نتائج
    if (listings.length === 0) {
      grid.style.display = 'none';
      grid.innerHTML = '';
      if (resultsSection) {
        const newEmpty = document.createElement('div');
        newEmpty.className = 'empty-state';
        newEmpty.id = 'cascadeEmpty';
        newEmpty.style.cssText = 'grid-column:1/-1;';
        newEmpty.innerHTML = emptyFilterState();
        resultsSection.appendChild(newEmpty);
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // ✅ عرض النتائج
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
   ✅ Auto-refresh ذكي
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
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadAllFeatured(false);
  loadStats(false);
  setupSearchTabs();
  setupSearchForm();
  setupWelcomeModal();
  setupCascadeFilter();
  initIcons();

  startAutoRefresh();
});