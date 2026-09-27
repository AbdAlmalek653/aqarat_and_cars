/* ==========================================
   الصفحة الرئيسية - سوق
   البيانات كلها من API (قاعدة البيانات)
   النسخة النهائية: عرض كل الإعلانات + تحديث تلقائي
   ========================================== */

/* ===== تهيئة الأيقونات ===== */
function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/* ==========================================
   ترجمة الأسماء
   ========================================== */
const CITY_NAMES = {
  damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب',
  homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية',
  tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء',
  quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور',
  raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب'
};

const TYPE_NAMES = {
  property: 'عقارات',
  car: 'سيارات'
};

const PURPOSE_NAMES = {
  sale: 'للبيع',
  rent: 'للإيجار'
};

/* ==========================================
   ✨ جلب الإعلانات دائماً من السيرفر (بدون كاش)
   ========================================== */
async function getCachedListings() {
  try {
    console.log('🔄 جاري جلب أحدث الإعلانات من السيرفر...');
    const data = await API.Listings.getAll();
    console.log(`✅ تم جلب ${data ? data.length : 0} إعلان`);
    return data || [];
  } catch (error) {
    console.error('❌ فشل تحميل الإعلانات من الخادم:', error);
    return [];
  }
}

/* ==========================================
   إنشاء كارد إعلان
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

  // ✅ التعامل مع الصور - نتجاهل القيمة الوهمية 'has_image'
  const firstImage = item.images && item.images.length > 0 && item.images[0] !== 'has_image'
    ? item.images[0]
    : null;

  const imageContent = firstImage
    ? `<img src="${firstImage}" alt="${item.title}" loading="lazy">`
    : `<i data-lucide="${icon}"></i>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  let locationText = '';
  if (item.city) locationText = CITY_NAMES[item.city] || item.city;
  if (item.area) locationText = locationText ? `${locationText} - ${item.area}` : item.area;
  if (!locationText) locationText = item.location || '—';

  const d = item.details || {};
  let chips = [];

  if (type === 'car') {
    const brandNames = {
      toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا',
      mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان',
      honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد',
      mazda: 'مازدا', mitsubishi: 'ميتسوبيشي',
      volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', other: 'أخرى'
    };

    if (d.brandName) chips.push({ icon: 'car', text: d.brandName });
    else if (d.brand) chips.push({ icon: 'car', text: brandNames[d.brand] || d.brand });

    if (d.model) chips.push({ icon: 'tag', text: d.model });
    if (d.year) chips.push({ icon: 'calendar', text: d.year });

    if (d.km && item.purpose === 'sale') {
      chips.push({ icon: 'gauge', text: `${Number(d.km).toLocaleString('en-US')} كم` });
    }

    if (d.transmission) {
      chips.push({
        icon: 'settings-2',
        text: d.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي'
      });
    }
  } else {
    const typeNames = {
      apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي',
      land: 'أرض', office: 'مكتب', shop: 'محل تجاري',
      chalet: 'شاليه', building: 'بناء كامل'
    };

    if (item.subType) {
      chips.push({ icon: 'building-2', text: typeNames[item.subType] || item.subType });
    } else if (d.propertyType) {
      chips.push({ icon: 'building-2', text: typeNames[d.propertyType] || d.propertyType });
    }

    const area = d.area || d.landArea || d.commercialArea;
    if (area) chips.push({ icon: 'square', text: `${area} م²` });
    if (d.rooms) chips.push({ icon: 'bed-double', text: `${d.rooms} غرف` });
    if (d.bathrooms) chips.push({ icon: 'bath', text: `${d.bathrooms} حمام` });

    if (d.furnished && item.purpose === 'rent') {
      const furnishedText = {
        furnished: 'مفروش',
        'semi-furnished': 'نصف مفروش',
        unfurnished: 'غير مفروش'
      }[d.furnished] || d.furnished;
      chips.push({ icon: 'sofa', text: furnishedText });
    }
  }

  chips = chips.slice(0, 3);

  const chipsHTML = chips.length
    ? `<div class="card-meta">
        ${chips.map(c => `
          <span class="card-meta-chip">
            <i data-lucide="${c.icon}"></i>
            <span>${c.text}</span>
          </span>
        `).join('')}
      </div>`
    : '';

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
          ${locationText}
        </p>
        ${chipsHTML}
        <p class="card-price">${priceText}</p>
      </div>
    </a>
  `;
}

/* ==========================================
   حالة فاضية
   ========================================== */
function emptyState(type) {
  const isProperty = type === 'property';
  const icon = isProperty ? 'building-2' : 'car';
  const text = isProperty ? 'عقار' : 'سيارة';
  const pluralText = isProperty ? 'عقارات' : 'سيارات';

  return `
    <div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-bg-glow"></div>
      <div class="empty-icon-wrap">
        <div class="empty-icon-ring"></div>
        <div class="empty-icon-ring ring-2"></div>
        <div class="empty-icon">
          <i data-lucide="${icon}"></i>
        </div>
      </div>
      <h3 class="empty-title">
        لا توجد <span class="gradient-text">${pluralText}</span> حالياً
      </h3>
      <p class="empty-subtitle">
        كن أول من يضيف إعلان ${text} في منصتنا وابدأ رحلتك معنا
      </p>
      <div class="empty-features">
        <div class="empty-feature">
          <i data-lucide="check-circle-2"></i>
          <span>نشر مجاني</span>
        </div>
        <div class="empty-feature">
          <i data-lucide="check-circle-2"></i>
          <span>عمولة عند البيع</span>
        </div>
        <div class="empty-feature">
          <i data-lucide="check-circle-2"></i>
          <span>تواصل مباشر</span>
        </div>
      </div>
      <a href="pages/add-listing.html?type=${type}" class="empty-cta-btn">
        <span class="empty-cta-icon">
          <i data-lucide="plus"></i>
        </span>
        <span>أضف إعلان ${text} الآن</span>
        <i data-lucide="arrow-left" class="empty-cta-arrow"></i>
      </a>
    </div>
  `;
}

/* ==========================================
   حالة فاضية مخصصة لنتائج الفلتر
   ========================================== */
function emptyFilterState() {
  const typeText = TYPE_NAMES[cascadeState.type] || '';
  const purposeText = PURPOSE_NAMES[cascadeState.purpose] || '';
  const cityText = CITY_NAMES[cascadeState.city] || '';

  return `
    <div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-bg-glow"></div>
      <div class="empty-icon-wrap">
        <div class="empty-icon-ring"></div>
        <div class="empty-icon-ring ring-2"></div>
        <div class="empty-icon">
          <i data-lucide="search-x"></i>
        </div>
      </div>
      <h3 class="empty-title">
        لا توجد <span class="gradient-text">نتائج مطابقة</span>
      </h3>
      <p class="empty-subtitle">
        لا توجد ${typeText} ${purposeText} في ${cityText} حالياً
      </p>
      <div class="empty-features">
        <div class="empty-feature">
          <i data-lucide="refresh-ccw"></i>
          <span>جرّب تغيير الفلتر</span>
        </div>
        <div class="empty-feature">
          <i data-lucide="map-pin"></i>
          <span>محافظة أخرى</span>
        </div>
      </div>
      <button class="empty-cta-btn" onclick="resetCascadeFilter()" type="button">
        <span class="empty-cta-icon">
          <i data-lucide="rotate-ccw"></i>
        </span>
        <span>تصفير الفلتر</span>
        <i data-lucide="arrow-left" class="empty-cta-arrow"></i>
      </button>
    </div>
  `;
}

/* ==========================================
   ✅ تحميل كل العقارات (بدون حد)
   ========================================== */
async function loadFeaturedProperties() {
  const container = document.getElementById('featuredProperties');
  if (!container) return;

  try {
    const allListings = await getCachedListings();
    const properties = allListings
      .filter(l => l.type === 'property')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
   ✅ تحميل كل السيارات (بدون حد)
   ========================================== */
async function loadFeaturedCars() {
  const container = document.getElementById('featuredCars');
  if (!container) return;

  try {
    const allListings = await getCachedListings();
    const cars = allListings
      .filter(l => l.type === 'car')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
   تحميل الإحصائيات الحقيقية (مع نظام احتياطي)
   ========================================== */
async function loadStats() {
  try {
    const stats = await API.Stats.get();
    animateNumber('statProperties', stats.properties || 0);
    animateNumber('statCars', stats.cars || 0);
    animateNumber('statUsers', stats.users || 0);
  } catch (e) {
    console.warn('⚠️ فشل جلب الإحصائيات من الـ API. جاري المحاولة من الإعلانات...', e);

    try {
      const allListings = await getCachedListings();
      if (allListings.length > 0) {
        const propsCount = allListings.filter(l => l.type === 'property').length;
        const carsCount = allListings.filter(l => l.type === 'car').length;
        animateNumber('statProperties', propsCount);
        animateNumber('statCars', carsCount);
      }
    } catch (fallbackError) {
      console.error('❌ فشل النظام الاحتياطي أيضاً:', fallbackError);
    }
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
   نافذة الترحيب
   ========================================== */
function setupWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;

  const lastSeen = localStorage.getItem('souq_welcome_seen');
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  if (lastSeen && (now - parseInt(lastSeen)) < DAY) {
    return;
  }

  setTimeout(() => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    initIcons();
  }, 800);
}

window.closeWelcome = function () {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  localStorage.setItem('souq_welcome_seen', Date.now().toString());
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeWelcome();
  }
});

/* ==========================================
   ✨ الفلتر المتدرج (Cascade Filter)
   ========================================== */
const cascadeState = {
  type: null,
  purpose: null,
  city: null
};

function hideResults() {
  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('latestGrid');
  const emptyEl = document.getElementById('cascadeEmpty');

  if (resultsSection) resultsSection.style.display = 'none';
  if (grid) {
    grid.style.display = 'none';
    grid.innerHTML = '';
  }
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
  if (citySelect) {
    citySelect.disabled = true;
    citySelect.value = '';
  }

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
      if (citySelect) {
        citySelect.disabled = true;
        citySelect.value = '';
      }

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
      if (citySelect) {
        citySelect.disabled = false;
        citySelect.value = '';
      }

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
        if (step4) {
          step4.classList.remove('locked');
          step4.classList.add('active');
        }
        if (showBtn) showBtn.disabled = false;
      } else {
        if (step4) {
          step4.classList.add('locked');
          step4.classList.remove('active');
        }
        if (showBtn) showBtn.disabled = true;
      }

      hideResults();
      initIcons();
    });
  }

  const showBtn = document.getElementById('cascadeShowBtn');
  if (showBtn) {
    showBtn.addEventListener('click', handleCascadeShow);
  }
}

async function handleCascadeShow() {
  if (!cascadeState.type || !cascadeState.purpose || !cascadeState.city) {
    return;
  }

  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('latestGrid');
  const emptyStateEl = document.getElementById('cascadeEmpty');

  if (resultsSection) resultsSection.style.display = 'block';

  grid.style.display = 'grid';
  if (emptyStateEl) emptyStateEl.style.display = 'none';

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <i data-lucide="loader-2" class="spin" style="width:48px;height:48px;color:var(--primary);margin-bottom:16px;"></i>
      <p style="color:var(--text-secondary);">جاري تحميل الإعلانات...</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);

  try {
    const allListings = await getCachedListings();

    const listings = allListings.filter(l => {
      if (l.type !== cascadeState.type) return false;
      if (l.purpose !== cascadeState.purpose) return false;
      if (l.city !== cascadeState.city) return false;
      return true;
    });

    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const typeText = TYPE_NAMES[cascadeState.type] || '';
    const purposeText = PURPOSE_NAMES[cascadeState.purpose] || '';
    const cityText = CITY_NAMES[cascadeState.city] || '';
    const summaryTitle = `${typeText} ${purposeText} في ${cityText}`;
    const summaryCount = listings.length;

    if (resultsSection) {
      const resultsTitleEl = resultsSection.querySelector('.section-title span');
      const resultsSubtitleEl = resultsSection.querySelector('.section-subtitle');

      if (resultsTitleEl) {
        resultsTitleEl.textContent = `نتائج البحث (${summaryCount})`;
      }
      if (resultsSubtitleEl) {
        resultsSubtitleEl.textContent = summaryTitle;
      }
    }

    if (listings.length === 0) {
      grid.style.display = 'none';
      if (emptyStateEl) {
        emptyStateEl.style.display = 'flex';
        emptyStateEl.outerHTML = emptyFilterState();
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = listings.map(item => createCard(item, item.type)).join('');
    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    console.error('خطأ في تحميل الإعلانات:', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--danger);">
        <i data-lucide="alert-circle" style="width:48px;height:48px;margin-bottom:16px;"></i>
        <p>حدث خطأ أثناء تحميل الإعلانات. حاول مرة أخرى.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function setupScrollDownBtn() {
  const scrollDownBtn = document.getElementById('scrollDownBtn');
  if (!scrollDownBtn) return;

  scrollDownBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const targetId = scrollDownBtn.getAttribute('href');
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

/* ==========================================
   تشغيل عند التحميل + 🔄 تحديث تلقائي كل 10 ثوانٍ
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProperties();
  loadFeaturedCars();
  loadStats();
  setupSearchTabs();
  setupSearchForm();
  setupWelcomeModal();
  setupCascadeFilter();
  setupScrollDownBtn();
  initIcons();

  // ✅ تحديث تلقائي كل 10 ثوانٍ لرؤية الإعلانات الجديدة فوراً
  setInterval(() => {
    loadFeaturedProperties();
    loadFeaturedCars();
    loadStats();
  }, 8000);
});