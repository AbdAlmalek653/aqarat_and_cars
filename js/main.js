/* ==========================================
   الصفحة الرئيسية - سوق
   البيانات كلها من API (قاعدة البيانات)
   ========================================== */

/* ===== تهيئة الأيقونات ===== */
function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/* ==========================================
   إنشاء كارد إعلان - مع مواصفات مختصرة
   ========================================== */
function createCard(item, type) {
  const purposeText = item.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = item.purpose === 'sale' ? 'sale' : 'rent';

  const priceNum = Number(item.price) || 0;
  const priceText = item.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${item.currency || 'USD'}`
    : `${priceNum} ${item.currency || 'USD'} <small>/ يوم</small>`;

  // تحديد الأيقونة حسب النوع
  let icon = type === 'property' ? 'building-2' : 'car';
  if (item.subType === 'villa') icon = 'home';
  if (item.subType === 'land') icon = 'trees';
  if (item.subType === 'office') icon = 'briefcase';
  if (item.subType === 'shop') icon = 'store';
  if (item.subType === 'chalet') icon = 'tent';
  if (item.subType === 'arabic-house') icon = 'landmark';

  // الصورة الأولى إن وجدت
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const imageContent = firstImage
    ? `<img src="${firstImage}" alt="${item.title}" loading="lazy">`
    : `<i data-lucide="${icon}"></i>`;

  const featuredBadge = item.featured
    ? `<span class="card-badge featured">⭐ مميز</span>`
    : '';

  /* ===== ترجمة المحافظة ===== */
  const cityNames = {
    damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب',
    homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية',
    tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء',
    quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور',
    raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب'
  };

  let locationText = '';
  if (item.city) locationText = cityNames[item.city] || item.city;
  if (item.area) locationText = locationText ? `${locationText} - ${item.area}` : item.area;
  if (!locationText) locationText = item.location || '—';

  /* ===== بناء شارات المواصفات المختصرة ===== */
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

    // الماركة
    if (d.brandName) chips.push({ icon: 'car', text: d.brandName });
    else if (d.brand) chips.push({ icon: 'car', text: brandNames[d.brand] || d.brand });

    // الموديل
    if (d.model) chips.push({ icon: 'tag', text: d.model });

    // السنة
    if (d.year) chips.push({ icon: 'calendar', text: d.year });

    // الكيلومترات (فقط للبيع)
    if (d.km && item.purpose === 'sale') {
      chips.push({ icon: 'gauge', text: `${Number(d.km).toLocaleString('en-US')} كم` });
    }

    // ناقل الحركة
    if (d.transmission) {
      chips.push({
        icon: 'settings-2',
        text: d.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي'
      });
    }
  } else {
    // عقارات
    const typeNames = {
      apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي',
      land: 'أرض', office: 'مكتب', shop: 'محل تجاري',
      chalet: 'شاليه', building: 'بناء كامل'
    };

    // نوع العقار
    if (item.subType) {
      chips.push({ icon: 'building-2', text: typeNames[item.subType] || item.subType });
    } else if (d.propertyType) {
      chips.push({ icon: 'building-2', text: typeNames[d.propertyType] || d.propertyType });
    }

    // المساحة
    const area = d.area || d.landArea || d.commercialArea;
    if (area) chips.push({ icon: 'square', text: `${area} م²` });

    // عدد الغرف
    if (d.rooms) chips.push({ icon: 'bed-double', text: `${d.rooms} غرف` });

    // الحمامات
    if (d.bathrooms) chips.push({ icon: 'bath', text: `${d.bathrooms} حمام` });

    // الفرش (للايجار)
    if (d.furnished && item.purpose === 'rent') {
      const furnishedText = {
        furnished: 'مفروش',
        'semi-furnished': 'نصف مفروش',
        unfurnished: 'غير مفروش'
      }[d.furnished] || d.furnished;
      chips.push({ icon: 'sofa', text: furnishedText });
    }
  }

  // نأخذ أول 3 مواصفات فقط
  chips = chips.slice(0, 3);

  // بناء HTML للـ chips
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
   حالة فاضية - تصميم مميز
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

      <a href="pages/add-listing.html" class="empty-cta-btn">
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

window.closeWelcome = function() {
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
   تشغيل عند التحميل
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProperties();
  loadFeaturedCars();
  loadStats();
  setupSearchTabs();
  setupSearchForm();
  setupWelcomeModal();
  initIcons();
});