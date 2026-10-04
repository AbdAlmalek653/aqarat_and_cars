/* ==========================================
   صفحة تفاصيل الإعلان - النسخة النهائية v7.0
   معرض: صورة كبيرة + شريط مصغرات
   ========================================== */

const BROKER_PHONE = '963930932794';
let currentListing = null;
let currentImageIndex = 0;

const MOCK_LISTINGS = {
  '1001': {id:'1001',type:'property',purpose:'sale',title:'شقة فاخرة',location:'دمشق',price:185000,currency:'USD',featured:true,negotiable:'قابل',whatsapp:'0930000001',description:'شقة فاخرة.',images:[],details:{propertyType:'apartment',area:180,rooms:3,bathrooms:2}},
  '2001': {id:'2001',type:'car',purpose:'sale',title:'تويوتا كامري',location:'دمشق',price:28500,currency:'USD',featured:true,negotiable:'غير قابل',whatsapp:'0930000005',description:'تويوتا كامري.',images:[],details:{brand:'toyota',model:'كامري',year:2022,km:35000}}
};

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { id: p.get('id'), type: p.get('type') || 'property' };
}

async function fetchListing(id) {
  if (window.API) {
    try {
      const s = await API.Listings.getById(id);
      if (s) return s;
    } catch (e) {}
  }
  return MOCK_LISTINGS[id] || null;
}

function getNegotiableStatus(listing) {
  if (!listing) return null;
  const d = listing.details || {};
  const value = String(listing.negotiable || d.negotiable || '').trim().toLowerCase();
  if (value === 'قابل' || value === 'قابل للتفاوض' || value === 'negotiable' || value === 'yes' || value === 'true' || value === '1') return 'yes';
  if (value === 'غير قابل' || value === 'غير قابل للتفاوض' || value === 'no' || value === 'false' || value === '0') return 'no';
  return null;
}

function cleanDescription(text) {
  if (!text) return '';
  let html = String(text);
  html = html.replace(/\*([^*\n<>]+)\*/g, '<strong>$1</strong>');
  html = html.replace(/\*/g, '');
  return html;
}

function buildSpecsFromDetails(listing) {
  if (listing.specs && listing.specs.length > 0) return listing.specs;

  const d = listing.details || {};
  const isProperty = listing.type === 'property';
  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();
  const sensitiveKeys = ['whatsapp', 'phone', 'mobile', 'email', '_whatsapp', '_phone', '_mobile'];

  const propertyMap = {
    propertyType: { icon: 'building-2', label: 'نوع العقار', translate: { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' } },
    subType: { icon: 'layers', label: 'نوع العقار', translate: { apartment: 'شقة', villa: 'فيلا', land: 'أرض' } },
    subtype: { icon: 'layers', label: 'نوع العقار' },
    area: { icon: 'square', label: 'المساحة', suffix: ' م²' },
    propertyArea: { icon: 'square', label: 'المساحة', suffix: ' م²' },
    rooms: { icon: 'bed-double', label: 'عدد الغرف' },
    bedrooms: { icon: 'bed-double', label: 'غرف النوم' },
    bathrooms: { icon: 'bath', label: 'عدد الحمامات' },
    baths: { icon: 'bath', label: 'عدد الحمامات' },
    floor: { icon: 'layers', label: 'الطابق' },
    totalFloors: { icon: 'building', label: 'إجمالي الطوابق' },
    age: { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },
    buildingAge: { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },
    direction: { icon: 'compass', label: 'الاتجاه' },
    vacancyType: { icon: 'file-check', label: 'نوع الفراغة' },
    finishingType: { icon: 'sparkles', label: 'نوع الإكساء' },
    furnished: { icon: 'sofa', label: 'الفرش', translate: { furnished: 'مفروش', 'semi-furnished': 'نصف مفروش', unfurnished: 'غير مفروش' } },
    heating: { icon: 'flame', label: 'التدفئة', translate: { central: 'مركزي', split: 'مكيفات', kerosene: 'كاز', electric: 'كهرباء', none: 'بدون' } },
    garden: { icon: 'trees', label: 'الحديقة', translate: { yes: 'متوفر', no: 'غير متوفر', true: 'متوفر', false: 'غير متوفر' } },
    pool: { icon: 'waves', label: 'المسبح', translate: { yes: 'متوفر', no: 'غير متوفر', true: 'متوفر', false: 'غير متوفر' } },
    landArea: { icon: 'square', label: 'مساحة الأرض', suffix: ' م²' },
    rentPeriod: { icon: 'calendar-clock', label: 'مدة الإيجار', translate: { daily: 'يومي', monthly: 'شهري', yearly: 'سنوي' } },
    deposit: { icon: 'wallet', label: 'مبلغ التأمين' }
  };

  const carMap = {
    brand: { icon: 'car', label: 'الماركة', translate: { toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد', mazda: 'مازدا', mitsubishi: 'ميتسوبيشي', volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', renault: 'رينو', peugeot: 'بيجو', fiat: 'فيات', seat: 'سيات', skoda: 'سكودا', opel: 'أوبل', jeep: 'جيب', landrover: 'لاند روفر', tesla: 'تسلا', volvo: 'فولفو', subaru: 'سوبارو', other: 'أخرى' } },
    brandName: { skip: true },
    model: { icon: 'tag', label: 'الموديل' },
    year: { icon: 'calendar', label: 'سنة الصنع' },
    km: { icon: 'gauge', label: 'الكيلومترات', suffix: ' كم' },
    mileage: { icon: 'gauge', label: 'الكيلومترات', suffix: ' كم' },
    condition: { icon: 'sparkles', label: 'الحالة', translate: { new: 'جديد', used: 'مستعمل', 'like-new': 'كالجديد', excellent: 'ممتازة', good: 'جيدة', fair: 'مقبولة' } },
    transmission: { icon: 'settings-2', label: 'ناقل الحركة', translate: { automatic: 'أوتوماتيك', manual: 'عادي', auto: 'أوتوماتيك', cvt: 'CVT' } },
    gear: { icon: 'settings-2', label: 'ناقل الحركة', translate: { automatic: 'أوتوماتيك', manual: 'عادي' } },
    fuel: { icon: 'fuel', label: 'الوقود', translate: { petrol: 'بنزين', diesel: 'ديزل', electric: 'كهرباء', hybrid: 'هايبرد' } },
    color: { icon: 'palette', label: 'اللون', translate: { white: 'أبيض', black: 'أسود', silver: 'فضي', gray: 'رمادي', red: 'أحمر', blue: 'أزرق', green: 'أخضر', yellow: 'أصفر', brown: 'بني', beige: 'بيج', gold: 'ذهبي', orange: 'برتقالي' } },
    bodyType: { icon: 'car', label: 'نوع الجسم', translate: { sedan: 'سيدان', suv: 'SUV', hatchback: 'هاتشباك', pickup: 'بيك أب', coupe: 'كوبيه', van: 'فان' } },
    carInsurance: { icon: 'shield-check', label: 'التأمين', translate: { yes: 'مؤمنة', no: 'غير مؤمنة' } },
    insurance: { icon: 'shield-check', label: 'التأمين' }
  };

  const globalFieldTranslations = {
    subtype: 'النوع الفرعي', propertytype: 'نوع العقار', direction: 'الاتجاه',
    vacancytype: 'نوع الفراغة', finishingtype: 'نوع الإكساء', totalfloors: 'إجمالي الطوابق',
    rooms: 'عدد الغرف', bedrooms: 'غرف النوم', bathrooms: 'عدد الحمامات', baths: 'عدد الحمامات',
    area: 'المساحة', age: 'عمر البناء', furnished: 'الفرش', heating: 'التدفئة',
    garden: 'الحديقة', pool: 'المسبح', brand: 'الماركة', model: 'الموديل', year: 'السنة',
    km: 'الكيلومترات', color: 'اللون', bodytype: 'نوع الجسم', fuel: 'الوقود',
    transmission: 'ناقل الحركة', condition: 'الحالة', insurance: 'التأمين'
  };

  const map = isProperty ? propertyMap : carMap;
  const specs = [];
  const usedLabels = new Set();

  const negotiableStatus = getNegotiableStatus(listing);
  if (negotiableStatus === 'yes') {
    specs.push({ icon: 'handshake', label: 'السعر قابل للتفاوض', value: 'نعم ✅', highlight: 'yes' });
    usedLabels.add('السعر قابل للتفاوض');
  } else if (negotiableStatus === 'no') {
    specs.push({ icon: 'x-circle', label: 'السعر قابل للتفاوض', value: 'لا ❌', highlight: 'no' });
    usedLabels.add('السعر قابل للتفاوض');
  }

  Object.keys(d).forEach(key => {
    if (sensitiveKeys.includes(key.toLowerCase()) && !isAdmin) return;
    if (key.startsWith('_') && !isAdmin) return;
    if (key.startsWith('_') && key !== '_whatsapp' && key !== '_phone') return;
    if (key === 'negotiable') return;

    let value = d[key];
    if (value === '' || value === null || value === undefined) return;

    let meta = map[key];
    if (!meta) {
      const lowerKey = key.toLowerCase();
      const label = globalFieldTranslations[lowerKey] || globalFieldTranslations[key];
      if (label) meta = { icon: 'info', label: label };
      else return;
    }

    if (meta.skip) return;
    if (usedLabels.has(meta.label)) return;
    usedLabels.add(meta.label);

    if (meta.translate && meta.translate[value]) value = meta.translate[value];
    if (typeof value === 'boolean') value = value ? 'نعم' : 'لا';
    else if (Array.isArray(value)) value = value.join('، ');
    else if (typeof value === 'object') value = JSON.stringify(value);
    if (meta.suffix) value = value + meta.suffix;

    specs.push({ icon: meta.icon, label: meta.label, value: String(value) });
  });

  return specs;
}

function buildTypeText(listing) {
  const d = listing.details || {};
  if (listing.type === 'property') {
    const types = { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' };
    return types[listing.subType || d.propertyType] || 'عقار';
  }
  if (listing.type === 'car') {
    const brands = { toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد', mazda: 'مازدا', mitsubishi: 'ميتسوبيشي', volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', other: 'أخرى' };
    const brand = d.brandName || brands[d.brand] || d.brand || '';
    const model = d.model || '';
    return [brand, model].filter(Boolean).join(' ') || 'سيارة';
  }
  return '';
}

function buildLocationText(listing) {
  const cityNames = { damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب', homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية', tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء', quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور', raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب' };
  const citySlug = listing.city_slug || listing.city || '';
  const cityNameFromAPI = listing.city_name || listing.cityName || '';
  const cityAr = listing.city ? (cityNames[listing.city] || listing.city) : '';

  let cityText = '';
  if (cityNameFromAPI && cityNameFromAPI.trim()) cityText = cityNameFromAPI.trim();
  else if (cityAr && /[\u0600-\u06FF]/.test(cityAr)) cityText = cityAr;
  else if (citySlug && cityNames[citySlug]) cityText = cityNames[citySlug];
  else if (citySlug && /[\u0600-\u06FF]/.test(citySlug)) cityText = citySlug;

  const area = listing.area || '';
  if (cityText && area) return `${cityText} - ${area}`;
  if (cityText) return cityText;
  if (area) return area;
  return listing.location || '—';
}

function preloadMainImage(item) {
  if (!item || !item.id || !window.getListingImageUrl) return;
  const mainUrl = window.getListingImageUrl(item, 0, 'large');
  if (!mainUrl || mainUrl.startsWith('data:')) return;
  if (document.querySelector('link[data-preload-main]')) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = mainUrl;
  link.setAttribute('data-preload-main', '1');
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}

function extractAllImageUrls(listing) {
  const urls = [];
  const seen = new Set();
  const imgs = listing.images || [];

  imgs.forEach((img, i) => {
    let url = null;
    if (typeof img === 'string') url = img;
    else if (img && typeof img === 'object') url = img.url || img.src || img.path || img.filename || null;
    if (!url && window.getListingImageUrl) {
      try { url = window.getListingImageUrl(listing, i, 'large'); } catch (e) {}
    }
    if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
  });

  return urls;
}

function renderListing(l) {
  currentListing = l;
  preloadMainImage(l);

  const parent = document.getElementById('breadcrumbParent');
  if (l.type === 'property') { parent.textContent = 'العقارات'; parent.href = 'properties.html'; }
  else { parent.textContent = 'السيارات'; parent.href = 'cars.html'; }
  document.getElementById('breadcrumbTitle').textContent = l.title;
  document.title = l.title + ' | سوق';
  document.getElementById('adTitle').textContent = l.title;

  const purposeText = l.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = l.purpose === 'sale' ? 'sale' : 'rent';
  const typeText = l.type === 'property' ? 'عقار' : 'سيارة';

  let badges = `<span class="info-badge ${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span><span class="info-badge" style="background:var(--bg-secondary);color:var(--text-secondary);"><i data-lucide="${l.type === 'property' ? 'building-2' : 'car'}"></i>${typeText}</span>`;

  const negotiableStatus = getNegotiableStatus(l);
  if (negotiableStatus === 'yes') badges += `<span class="info-badge negotiable-yes"><i data-lucide="handshake"></i>قابل للتفاوض</span>`;
  else if (negotiableStatus === 'no') badges += `<span class="info-badge negotiable-no"><i data-lucide="x-circle"></i>غير قابل للتفاوض</span>`;

  if (l.featured) badges += `<span class="info-badge featured"><i data-lucide="star"></i>مميز</span>`;
  document.getElementById('infoBadges').innerHTML = badges;

  const priceNum = Number(l.price) || 0;
  document.getElementById('adPrice').innerHTML = l.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${l.currency || 'USD'}`
    : `${priceNum} ${l.currency || 'USD'} <small>/ شهرياً</small>`;

  document.getElementById('adLocation').textContent = buildLocationText(l);

  const specs = buildSpecsFromDetails(l);
  const specsContainer = document.getElementById('adSpecs');
  if (specs.length === 0) {
    specsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:20px;">لا توجد مواصفات متاحة</p>';
  } else {
    specsContainer.innerHTML = specs.map(s => {
      const highlightClass = s.highlight ? `highlight-${s.highlight}` : '';
      return `<div class="spec-item ${highlightClass}"><div class="spec-icon"><i data-lucide="${s.icon}"></i></div><div class="spec-content"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div></div>`;
    }).join('');
  }

  const descEl = document.getElementById('adDescription');
  const cleanedDesc = cleanDescription(l.description || '');
  if (/<[a-z][\s\S]*>/i.test(cleanedDesc)) descEl.innerHTML = cleanedDesc;
  else descEl.textContent = cleanedDesc;

  document.getElementById('adId').textContent = '#' + l.id;

  const listingUrl = window.location.href;
  const locationText = buildLocationText(l);
  const priceText = l.purpose === 'sale' ? `${priceNum.toLocaleString('en-US')} ${l.currency || 'USD'}` : `${priceNum} ${l.currency || 'USD'} / شهرياً`;
  const specificType = buildTypeText(l);
  const typeLabel = l.type === 'property' ? 'نوع العقار' : 'نوع السيارة';

  let negotiableText = '';
  if (negotiableStatus === 'yes') negotiableText = '\n🤝 السعر قابل للتفاوض';
  else if (negotiableStatus === 'no') negotiableText = '\n🔒 السعر غير قابل للتفاوض';

  const msg = `مرحباً، انا مهتم بـ ${typeText} ورقم الإعلان هو: ${l.id}\n🔍 ${typeLabel}: ${specificType}\n📍 الموقع: ${locationText}\n💰 السعر: ${priceText}${negotiableText}\n\n🔗 رابط الإعلان:\n${listingUrl}`;
  document.getElementById('whatsappBtn').href = `https://wa.me/${BROKER_PHONE}?text=${encodeURIComponent(msg)}`;

  setupSellerWhatsapp(l);
  renderGallery(l);
  setupFavorite(l.id);

  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('detailsContent').style.display = 'flex';
  initIcons();
}

function setupSellerWhatsapp(listing) {
  const btn = document.getElementById('sellerWhatsappBtn');
  if (!btn) return;
  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();
  if (!isAdmin) { btn.style.display = 'none'; btn.removeAttribute('href'); btn.innerHTML = ''; return; }

  let sellerPhone = listing.whatsapp || (listing.details && listing.details._whatsapp) || '';
  sellerPhone = String(sellerPhone).replace(/[^0-9+]/g, '');
  if (sellerPhone.startsWith('+')) sellerPhone = sellerPhone.substring(1);

  if (!sellerPhone) {
    btn.style.display = 'flex';
    btn.style.background = 'var(--danger)';
    btn.style.borderStyle = 'solid';
    btn.href = '#';
    btn.innerHTML = `<i data-lucide="alert-circle"></i><span>لا يوجد رقم للبائع</span>`;
    btn.onclick = (e) => { e.preventDefault(); alert('لم يقم البائع بإدخال رقم واتساب لهذا الإعلان.'); };
    initIcons();
    return;
  }

  const typeText = listing.type === 'property' ? 'العقار' : 'السيارة';
  const message = `مرحباً، معك فريق سوق للوساطة الإلكترونية بخصوص ${typeText} رقم #${listing.id}\n${listing.title}`;
  btn.href = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;
  btn.style.display = 'flex';
  btn.style.background = '';
  btn.style.borderStyle = '';
  btn.innerHTML = `<i data-lucide="user-check"></i><span>واتساب البائع (${sellerPhone})</span>`;
  initIcons();
}

/* ==========================================
   ✅ معرض الصور: صورة كبيرة + شريط مصغرات
   ========================================== */
function renderGallery(listing) {
  const main = document.getElementById('galleryMain');
  const thumbs = document.getElementById('galleryThumbs');
  if (!main) return;

  const fallback = listing.type === 'property' ? 'building-2' : 'car';
  const urls = extractAllImageUrls(listing);
  console.log(`🖼️ عدد الصور: ${urls.length}`, urls);

  if (urls.length === 0) {
    main.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-muted);opacity:0.4;"><i data-lucide="${fallback}" style="width:80px;height:80px;"></i></div>`;
    if (thumbs) thumbs.innerHTML = '';
    initIcons();
    return;
  }

  window._galleryUrls = urls;
  window._currentImageIndex = 0;

  const safeTitle = (listing.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // الصورة الكبيرة
  main.innerHTML = `
    <img id="mainImage" src="${urls[0]}" alt="${safeTitle}" loading="eager" decoding="async" fetchpriority="high">
    <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
    <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
    <div class="gallery-counter"><span id="galleryCounter">1 / ${urls.length}</span></div>
  `;

  // شريط الصور المصغرة
  if (thumbs) {
    thumbs.style.display = 'flex';
    thumbs.innerHTML = urls.map((url, i) => 
      `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="goToImage(${i})"><img src="${url}" alt="صورة ${i + 1}" loading="lazy" decoding="async"></div>`
    ).join('');
  }

  initIcons();
}

window.prevImage = function() {
  const urls = window._galleryUrls || [];
  if (!urls.length) return;
  window._currentImageIndex = (window._currentImageIndex - 1 + urls.length) % urls.length;
  updateGalleryDisplay();
};

window.nextImage = function() {
  const urls = window._galleryUrls || [];
  if (!urls.length) return;
  window._currentImageIndex = (window._currentImageIndex + 1) % urls.length;
  updateGalleryDisplay();
};

window.goToImage = function(i) {
  window._currentImageIndex = i;
  updateGalleryDisplay();
};

function updateGalleryDisplay() {
  const urls = window._galleryUrls || [];
  const idx = window._currentImageIndex || 0;
  if (!urls.length) return;

  const mainImg = document.getElementById('mainImage');
  if (mainImg) mainImg.src = urls[idx];

  const counter = document.getElementById('galleryCounter');
  if (counter) counter.textContent = `${idx + 1} / ${urls.length}`;

  document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  const activeThumb = document.querySelector('.gallery-thumb.active');
  if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

async function setupFavorite(id) {
  const btn = document.getElementById('favBtn');
  if (!btn) return;
  const isFav = await API.Favorites.isFavorite(id);
  if (isFav) { btn.classList.add('active'); btn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`; }
  btn.addEventListener('click', async () => {
    const r = await API.Favorites.toggle(id);
    if (!r.success) { alert(r.error || 'يجب تسجيل الدخول أولاً'); return; }
    if (r.isFavorite) { btn.classList.add('active'); btn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`; }
    else { btn.classList.remove('active'); btn.innerHTML = `<i data-lucide="heart"></i><span>مفضلة</span>`; }
    initIcons();
  });
}

function setupShare() {
  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    const data = { title: currentListing.title, text: `${currentListing.title} - ${currentListing.price} ${currentListing.currency}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ رابط الإعلان!'); }
  });
}

function openEditModal() {
  if (!currentListing) { alert('لم يتم تحميل الإعلان بعد'); return; }
  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();
  if (!isAdmin) { alert('هذه الميزة للأدمن فقط'); return; }
  document.getElementById('editTitle').value = currentListing.title || '';
  document.getElementById('editPrice').value = currentListing.price || '';
  document.getElementById('editCurrency').value = currentListing.currency || 'USD';
  document.getElementById('editCity').value = currentListing.city || 'damascus';
  document.getElementById('editArea').value = currentListing.area || '';
  document.getElementById('editDescription').value = currentListing.description || '';
  document.getElementById('editWhatsapp').value = currentListing.whatsapp || '';
  document.getElementById('editStatus').value = currentListing.status || 'active';
  document.getElementById('editFeatured').checked = !!currentListing.featured;
  document.getElementById('editModal').classList.add('show');
  document.body.style.overflow = 'hidden';
  if (window.lucide) window.lucide.createIcons();
}

window.closeEditModal = function() {
  const modal = document.getElementById('editModal');
  if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
};

async function saveEdit(e) {
  e.preventDefault();
  if (!currentListing) return;
  const saveBtn = document.getElementById('editSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>جاري الحفظ...</span>';
  if (window.lucide) window.lucide.createIcons();

  const updates = {
    title: document.getElementById('editTitle').value.trim(),
    price: Number(document.getElementById('editPrice').value),
    currency: document.getElementById('editCurrency').value,
    city: document.getElementById('editCity').value,
    area: document.getElementById('editArea').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    whatsapp: document.getElementById('editWhatsapp').value.trim(),
    status: document.getElementById('editStatus').value,
    featured: document.getElementById('editFeatured').checked
  };

  try {
    const result = await API.Listings.update(currentListing.id, updates);
    if (result.success) {
      currentListing = Object.assign({}, currentListing, updates);
      document.getElementById('adTitle').textContent = updates.title;
      const priceEl = document.getElementById('adPrice');
      if (priceEl) {
        const priceText = Number(updates.price).toLocaleString('en-US');
        priceEl.innerHTML = currentListing.purpose === 'sale' ? `${priceText} ${updates.currency}` : `${priceText} ${updates.currency} <small>/ شهرياً</small>`;
      }
      const descEl = document.getElementById('adDescription');
      const cleaned = cleanDescription(updates.description);
      if (/<[a-z][\s\S]*>/i.test(cleaned)) descEl.innerHTML = cleaned;
      else descEl.textContent = cleaned;
      document.getElementById('adLocation').textContent = buildLocationText(currentListing);
      closeEditModal();
      showToast('✅ تم حفظ التعديلات بنجاح', 'success');
    } else { showToast('❌ فشل الحفظ: ' + (result.error || 'خطأ غير معروف'), 'error'); }
  } catch (err) { console.error('خطأ:', err); showToast('❌ حدث خطأ أثناء الحفظ', 'error'); }
  finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="save"></i><span>حفظ التعديلات</span>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `position: fixed; top: 90px; left: 50%; transform: translateX(-50%); padding: 14px 24px; background: ${type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'}; color: white; border-radius: 12px; font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); z-index: 99999; animation: slideDown 0.3s ease; max-width: 90%; text-align: center;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

if (!document.getElementById('toast-animation')) {
  const style = document.createElement('style');
  style.id = 'toast-animation';
  style.textContent = `@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  setupShare();

  const editBtn = document.getElementById('adminEditBtn');
  const editForm = document.getElementById('editForm');
  if (editBtn) editBtn.addEventListener('click', openEditModal);
  if (editForm) editForm.addEventListener('submit', saveEdit);

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeEditModal(); });

  const { id } = getParams();
  if (!id) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
    initIcons();
    return;
  }

  const l = await fetchListing(id);
  if (!l) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
    initIcons();
    return;
  }

  renderListing(l);
});