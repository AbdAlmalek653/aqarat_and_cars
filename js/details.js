/* ==========================================
   صفحة تفاصيل الإعلان
   - المواصفات تظهر للجميع
   - رقم البائع يظهر للأدمن فقط
   - تعديل الإعلان (للأدمن فقط)
   ========================================== */

const BROKER_PHONE = '963930932794';
let currentListing = null;
let currentImageIndex = 0;

/* ==========================================
   بيانات تجريبية (Fallback)
   ========================================== */
const MOCK_LISTINGS = {
  '1001': {id:'1001',type:'property',purpose:'sale',title:'شقة فاخرة بتشطيب سوبر ديلوكس في المزة',location:'دمشق - المزة',price:185000,currency:'USD',featured:true,whatsapp:'0930000001',description:'شقة فاخرة بمساحة 180 متر مربع، تتكون من 3 غرف نوم، صالون واسع، مطبخ حديث، 2 حمام.\n\nتشطيب سوبر ديلوكس، طابق ثالث من أصل 5، عمر البناء 3 سنوات، مع مصعد وموقف سيارة خاص.',images:[],specs:[{icon:'building-2',label:'نوع العقار',value:'شقة'},{icon:'square',label:'المساحة',value:'180 م²'},{icon:'bed-double',label:'الغرف',value:'3 غرف'},{icon:'bath',label:'الحمامات',value:'2'},{icon:'layers',label:'الطابق',value:'الثالث'},{icon:'calendar',label:'عمر البناء',value:'3 سنوات'},{icon:'sofa',label:'الفرش',value:'مفروش'},{icon:'flame',label:'التدفئة',value:'مركزية'}]},
  '1002': {id:'1002',type:'property',purpose:'rent',title:'فيلا مستقلة مع مسبح وحديقة واسعة',location:'دمشق - قدسيا',price:950,currency:'USD',featured:true,whatsapp:'0930000002',description:'فيلا مستقلة بتصميم عصري، مساحة 350 متر مربع موزعة على طابقين، 5 غرف نوم، صالون كبير، مطبخ مجهز، 4 حمامات، حديقة خاصة 200م، مسبح، موقف سيارتين.',images:[],specs:[{icon:'home',label:'نوع العقار',value:'فيلا'},{icon:'square',label:'المساحة',value:'350 م²'},{icon:'bed-double',label:'الغرف',value:'5'},{icon:'bath',label:'الحمامات',value:'4'},{icon:'waves',label:'المسبح',value:'متوفر'},{icon:'trees',label:'الحديقة',value:'200 م²'},{icon:'car',label:'موقف',value:'متوفر'},{icon:'flame',label:'التدفئة',value:'مركزية'}]},
  '1003': {id:'1003',type:'property',purpose:'sale',title:'أرض سكنية 500م على شارعين',location:'ريف دمشق - جرمانا',price:75000,currency:'USD',featured:false,whatsapp:'0930000003',description:'أرض سكنية بمساحة 500 متر مربع، على شارعين (شرقي وغربي)، منظمة ضمن المخطط التنظيمي، جاهزة للبناء مباشرة.',images:[],specs:[{icon:'trees',label:'النوع',value:'أرض'},{icon:'square',label:'المساحة',value:'500 م²'},{icon:'route',label:'الواجهات',value:'شارعين'},{icon:'file-check',label:'الطابو',value:'منظم'}]},
  '1004': {id:'1004',type:'property',purpose:'rent',title:'مكتب تجاري مجهز بالكامل في أبو رمانة',location:'دمشق - أبو رمانة',price:600,currency:'USD',featured:false,whatsapp:'0930000004',description:'مكتب تجاري بمساحة 120 متر مربع في منطقة حيوية، مجهز بالكامل بالأثاث والمعدات المكتبية، مكيفات، حمام، مطبخ صغير.',images:[],specs:[{icon:'briefcase',label:'النوع',value:'مكتب'},{icon:'square',label:'المساحة',value:'120 م²'},{icon:'layers',label:'الطابق',value:'الثاني'},{icon:'snowflake',label:'التكييف',value:'متوفر'},{icon:'sofa',label:'الفرش',value:'مجهز'},{icon:'car',label:'موقف',value:'متوفر'}]},
  '2001': {id:'2001',type:'car',purpose:'sale',title:'تويوتا كامري 2022 - فل كامل',location:'دمشق - المزة',price:28500,currency:'USD',featured:true,whatsapp:'0930000005',description:'تويوتا كامري 2022 فل كامل، ماشية 35,000 كم فقط، بحالة الوكالة، صيانة دورية في الوكالة، بدون حوادث نهائياً.\n\nالمواصفات: فتحة سقف، جلد، شاشة، كاميرا خلفية، حساسات، مثبت سرعة، مقاعد كهربائية.',images:[],specs:[{icon:'car',label:'الماركة',value:'تويوتا'},{icon:'tag',label:'الموديل',value:'كامري'},{icon:'calendar',label:'السنة',value:'2022'},{icon:'gauge',label:'الكيلومترات',value:'35,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أبيض'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2002': {id:'2002',type:'car',purpose:'rent',title:'هيونداي إلنترا 2020 - نظيفة جداً',location:'حلب - العزيزية',price:45,currency:'USD',featured:true,whatsapp:'0930000006',description:'هيونداي إلنترا 2020 للإيجار اليومي، ماشية 85,000 كم، حالة ممتازة، مكيفة، أوتوماتيك، اقتصادية بالوقود.',images:[],specs:[{icon:'car',label:'الماركة',value:'هيونداي'},{icon:'tag',label:'الموديل',value:'إلنترا'},{icon:'calendar',label:'السنة',value:'2020'},{icon:'gauge',label:'الكيلومترات',value:'85,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'فضي'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2003': {id:'2003',type:'car',purpose:'sale',title:'كيا سبورتاج 2021 - بحالة الوكالة',location:'دمشق - قدسيا',price:32000,currency:'USD',featured:false,whatsapp:'0930000007',description:'كيا سبورتاج 2021، ماشية 45,000 كم، حالة ممتازة، صيانة دورية، بدون حوادث.',images:[],specs:[{icon:'car',label:'الماركة',value:'كيا'},{icon:'tag',label:'الموديل',value:'سبورتاج'},{icon:'calendar',label:'السنة',value:'2021'},{icon:'gauge',label:'الكيلومترات',value:'45,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أسود'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2004': {id:'2004',type:'car',purpose:'rent',title:'مرسيدس E200 2019 - فخامة',location:'حمص - الوعر',price:70,currency:'USD',featured:false,whatsapp:'0930000008',description:'مرسيدس E200 2019 للإيجار اليومي، فخامة وأداء عالي، مكيفة، أوتوماتيك، بحالة ممتازة.',images:[],specs:[{icon:'car',label:'الماركة',value:'مرسيدس'},{icon:'tag',label:'الموديل',value:'E200'},{icon:'calendar',label:'السنة',value:'2019'},{icon:'gauge',label:'الكيلومترات',value:'70,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أسود'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]}
};

/* ==========================================
   أدوات مساعدة
   ========================================== */
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

/* ==========================================
   تحويل details (Object) إلى specs (Array)
   ========================================== */
function buildSpecsFromDetails(listing) {
  if (listing.specs && listing.specs.length > 0) return listing.specs;

  const d = listing.details || {};
  const isProperty = listing.type === 'property';

  const propertyMap = {
    propertyType: { icon: 'building-2', label: 'نوع العقار', translate: {
      apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي',
      land: 'أرض', office: 'مكتب', shop: 'محل تجاري',
      chalet: 'شاليه', building: 'بناء كامل'
    }},
    area:         { icon: 'square', label: 'المساحة', suffix: ' م²' },
    propertyArea: { icon: 'square', label: 'المساحة', suffix: ' م²' },
    rooms:        { icon: 'bed-double', label: 'الغرف' },
    bathrooms:    { icon: 'bath', label: 'الحمامات' },
    floor:        { icon: 'layers', label: 'الطابق' },
    totalFloors:  { icon: 'building', label: 'إجمالي الطوابق' },
    age:          { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },
    furnished:    { icon: 'sofa', label: 'الفرش', translate: {
      furnished: 'مفروش', 'semi-furnished': 'نصف مفروش', unfurnished: 'غير مفروش'
    }},
    heating:      { icon: 'flame', label: 'التدفئة', translate: {
      central: 'مركزي', split: 'مكيفات', kerosene: 'كاز',
      electric: 'كهرباء', none: 'بدون'
    }},
    garden:       { icon: 'trees', label: 'الحديقة', translate: { yes: 'متوفر', no: 'غير متوفر' }},
    pool:         { icon: 'waves', label: 'المسبح', translate: { yes: 'متوفر', no: 'غير متوفر' }},
    landArea:     { icon: 'square', label: 'مساحة الأرض', suffix: ' م²' },
    landFrontage: { icon: 'route', label: 'عرض الواجهة', suffix: ' م' },
    landDepth:    { icon: 'move-horizontal', label: 'العمق', suffix: ' م' },
    landZoning:   { icon: 'map', label: 'التنظيم', translate: {
      residential: 'سكني', commercial: 'تجاري',
      industrial: 'صناعي', agricultural: 'زراعي', mixed: 'مختلط'
    }},
    landTabu:     { icon: 'file-check', label: 'الطابو', translate: {
      green: 'أخضر', blue: 'أزرق', organized: 'منظم', unorganized: 'غير منظم'
    }},
    commercialArea:  { icon: 'square', label: 'المساحة', suffix: ' م²' },
    commercialFloor: { icon: 'layers', label: 'الطابق' },
    commercialAge:   { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' }
  };

  const carMap = {
    brand:        { icon: 'car', label: 'الماركة', translate: {
      toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا',
      mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان',
      honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد',
      mazda: 'مازدا', mitsubishi: 'ميتسوبيشي',
      volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', other: 'أخرى'
    }},
    brandName:    { skip: true },
    model:        { icon: 'tag', label: 'الموديل' },
    year:         { icon: 'calendar', label: 'السنة' },
    km:           { icon: 'gauge', label: 'الكيلومترات', suffix: ' كم' },
    condition:    { icon: 'sparkles', label: 'الحالة', translate: {
      new: 'جديد', used: 'مستعمل'
    }},
    transmission: { icon: 'settings-2', label: 'ناقل الحركة', translate: {
      automatic: 'أوتوماتيك', manual: 'عادي'
    }},
    fuel:         { icon: 'fuel', label: 'الوقود', translate: {
      petrol: 'بنزين', diesel: 'ديزل',
      electric: 'كهرباء', hybrid: 'هايبرد'
    }},
    color:        { icon: 'palette', label: 'اللون' },
    bodyType:     { icon: 'car', label: 'نوع الجسم', translate: {
      sedan: 'سيدان', suv: 'SUV', hatchback: 'هاتشباك',
      pickup: 'بيك أب', coupe: 'كوبيه', van: 'فان'
    }},
    carInsurance: { icon: 'shield-check', label: 'التأمين', translate: {
      yes: 'مؤمنة', no: 'غير مؤمنة'
    }},
    minDays:      { icon: 'calendar-clock', label: 'أقل مدة إيجار', suffix: ' يوم' }
  };

  const map = isProperty ? propertyMap : carMap;
  const specs = [];
  const usedLabels = new Set();

  Object.keys(d).forEach(key => {
    if (key.startsWith('_')) return;
    const meta = map[key];
    if (!meta || meta.skip) return;

    let value = d[key];
    if (value === '' || value === null || value === undefined) return;

    if (usedLabels.has(meta.label)) return;
    usedLabels.add(meta.label);

    if (meta.translate && meta.translate[value]) {
      value = meta.translate[value];
    }

    if (meta.suffix) value = value + meta.suffix;

    specs.push({
      icon: meta.icon,
      label: meta.label,
      value: String(value)
    });
  });

  return specs;
}

/* ==========================================
   ✅ استخراج نوع العقار/السيارة
   ========================================== */
function buildTypeText(listing) {
  const d = listing.details || {};

  if (listing.type === 'property') {
    const propertyTypes = {
      apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي',
      land: 'أرض', office: 'مكتب', shop: 'محل تجاري',
      chalet: 'شاليه', building: 'بناء كامل'
    };
    const type = listing.subType || d.propertyType;
    return propertyTypes[type] || 'عقار';
  }

  if (listing.type === 'car') {
    const brandNames = {
      toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا',
      mercedes: 'مرسيدس', bmw: 'BMW', nissan: 'نيسان',
      honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد',
      mazda: 'مازدا', mitsubishi: 'ميتسوبيشي',
      volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس', other: 'أخرى'
    };
    const brand = d.brandName || brandNames[d.brand] || d.brand || '';
    const model = d.model || '';
    const full = [brand, model].filter(Boolean).join(' ');
    return full || 'سيارة';
  }

  return '';
}

/* ==========================================
   استخراج الموقع الصحيح
   ========================================== */
function buildLocationText(listing) {
  const cityNames = {
    damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب',
    homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية',
    tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء',
    quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور',
    raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب'
  };

  const cityAr = listing.city ? (cityNames[listing.city] || listing.city) : '';
  const area = listing.area || '';

  if (cityAr && area) return `${cityAr} - ${area}`;
  if (cityAr) return cityAr;
  if (area) return area;
  return listing.location || '—';
}

/* ==========================================
   عرض الإعلان
   ========================================== */
function renderListing(l) {
  currentListing = l;

  const parent = document.getElementById('breadcrumbParent');
  if (l.type === 'property') {
    parent.textContent = 'العقارات';
    parent.href = 'properties.html';
  } else {
    parent.textContent = 'السيارات';
    parent.href = 'cars.html';
  }
  document.getElementById('breadcrumbTitle').textContent = l.title;
  document.title = l.title + ' | سوق';
  document.getElementById('adTitle').textContent = l.title;

  const purposeText = l.purpose === 'sale' ? 'للبيع' : 'للإيجار';
  const purposeClass = l.purpose === 'sale' ? 'sale' : 'rent';
  const typeText = l.type === 'property' ? 'عقار' : 'سيارة';

  let badges = `
    <span class="info-badge ${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span>
    <span class="info-badge" style="background:var(--bg-secondary);color:var(--text-secondary);">
      <i data-lucide="${l.type === 'property' ? 'building-2' : 'car'}"></i>${typeText}
    </span>`;
  if (l.featured) {
    badges += `<span class="info-badge featured"><i data-lucide="star"></i>مميز</span>`;
  }
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
    specsContainer.innerHTML = specs.map(s => `
      <div class="spec-item">
        <div class="spec-icon"><i data-lucide="${s.icon}"></i></div>
        <div class="spec-content">
          <div class="spec-label">${s.label}</div>
          <div class="spec-value">${s.value}</div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('adDescription').textContent = l.description || '';
  document.getElementById('adId').textContent = '#' + l.id;

  // ✅ زر واتساب الوسيط - مع النوع والموقع والسعر والرابط
  const listingUrl = window.location.href;
  const locationText = buildLocationText(l);
  const priceText = l.purpose === 'sale'
    ? `${priceNum.toLocaleString('en-US')} ${l.currency || 'USD'}`
    : `${priceNum} ${l.currency || 'USD'} / شهرياً`;

  const specificType = buildTypeText(l);
  const typeLabel = l.type === 'property' ? 'نوع العقار' : 'نوع السيارة';

  const msg = 
`مرحباً، انا مهتم بـ ${typeText} ورقم الإعلان هو: ${l.id}
🔍 ${typeLabel}: ${specificType}
📍 الموقع: ${locationText}
💰 السعر: ${priceText}

🔗 رابط الإعلان:
${listingUrl}`;

  document.getElementById('whatsappBtn').href =
    `https://wa.me/${BROKER_PHONE}?text=${encodeURIComponent(msg)}`;

  setupSellerWhatsapp(l);
  renderGallery(l.images || [], l);
  setupFavorite(l.id);

  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('detailsContent').style.display = 'grid';
  initIcons();
}

/* ==========================================
   زر واتساب البائع (للأدمن فقط)
   ========================================== */
function setupSellerWhatsapp(listing) {
  const btn = document.getElementById('sellerWhatsappBtn');
  if (!btn) return;

  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();
  if (!isAdmin) {
    btn.style.display = 'none';
    return;
  }

  let sellerPhone = listing.whatsapp ||
                    (listing.details && listing.details._whatsapp) ||
                    '';

  sellerPhone = String(sellerPhone).replace(/[^0-9+]/g, '');
  if (sellerPhone.startsWith('+')) sellerPhone = sellerPhone.substring(1);

  if (!sellerPhone) {
    btn.style.display = 'flex';
    btn.style.background = 'var(--danger)';
    btn.style.borderStyle = 'solid';
    btn.href = '#';
    btn.innerHTML = `<i data-lucide="alert-circle"></i><span>لا يوجد رقم للبائع</span>`;
    btn.onclick = (e) => {
      e.preventDefault();
      alert('لم يقم البائع بإدخال رقم واتساب لهذا الإعلان.');
    };
    initIcons();
    return;
  }

  const typeText = listing.type === 'property' ? 'العقار' : 'السيارة';
  const message = `مرحباً،  معك فريق سوق السيارت &  العقارات للوساطة الإلكترونية  بخصوص ${typeText} رقم #${listing.id}\n${listing.title}`;

  btn.href = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;
  btn.style.display = 'flex';
  btn.style.background = '';
  btn.style.borderStyle = '';

  btn.innerHTML = `<i data-lucide="user-check"></i><span>واتساب البائع (${sellerPhone})</span>`;

  initIcons();
}

/* ==========================================
   ✅ معرض الصور - يستخدم الدالة الموحّدة getListingImageUrl
   ========================================== */
function renderGallery(imgs, l) {
  const main = document.getElementById('galleryMain');
  const thumbs = document.getElementById('galleryThumbs');
  const fallback = l.type === 'property' ? 'building-2' : 'car';

  if (!imgs.length) {
    main.innerHTML = `<i data-lucide="${fallback}"></i>
      <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
      <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
      <div class="gallery-counter">1 / 1</div>`;
    thumbs.innerHTML = `<div class="gallery-thumb active"><i data-lucide="${fallback}" style="color:var(--text-muted);"></i></div>`;
    initIcons();
    return;
  }

  // ✅✅✅ استخدام الدالة الموحّدة من api.js
  const imageUrls = imgs.map(function (img, i) {
    if (window.getListingImageUrl) {
      return window.getListingImageUrl(l, i);
    }
    // fallback (احتياطي)
    return typeof img === 'string' ? img : null;
  }).filter(Boolean);

  currentListing.images = imageUrls;

  main.innerHTML = `<img src="${imageUrls[0]}" alt="${l.title}" loading="eager">
    <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
    <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
    <div class="gallery-counter" id="galleryCounter">1 / ${imageUrls.length}</div>`;

  thumbs.innerHTML = imageUrls.map(function (url, i) {
    return `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="goToImage(${i})"><img src="${url}" alt="صورة ${i + 1}" loading="lazy"></div>`;
  }).join('');

  currentImageIndex = 0;
  initIcons();
}

window.prevImage = function() {
  if (!currentListing?.images?.length) return;
  const t = currentListing.images.length;
  currentImageIndex = (currentImageIndex - 1 + t) % t;
  updateGallery();
};

window.nextImage = function() {
  if (!currentListing?.images?.length) return;
  const t = currentListing.images.length;
  currentImageIndex = (currentImageIndex + 1) % t;
  updateGallery();
};

window.goToImage = function(i) {
  if (!currentListing?.images?.length) return;
  currentImageIndex = i;
  updateGallery();
};

function updateGallery() {
  const imgs = currentListing.images;
  const main = document.getElementById('galleryMain');
  main.querySelector('img').src = imgs[currentImageIndex];
  document.getElementById('galleryCounter').textContent = `${currentImageIndex + 1} / ${imgs.length}`;
  document.querySelectorAll('.gallery-thumb').forEach((t, i) =>
    t.classList.toggle('active', i === currentImageIndex)
  );
}

/* ==========================================
   المفضلة
   ========================================== */
async function setupFavorite(id) {
  const btn = document.getElementById('favBtn');
  if (!btn) return;

  const isFav = await API.Favorites.isFavorite(id);
  if (isFav) {
    btn.classList.add('active');
    btn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`;
  }

  btn.addEventListener('click', async () => {
    const r = await API.Favorites.toggle(id);
    if (!r.success) {
      alert(r.error || 'يجب تسجيل الدخول أولاً');
      return;
    }
    if (r.isFavorite) {
      btn.classList.add('active');
      btn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`;
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `<i data-lucide="heart"></i><span>مفضلة</span>`;
    }
    initIcons();
  });
}

/* ==========================================
   المشاركة
   ========================================== */
function setupShare() {
  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    const data = {
      title: currentListing.title,
      text: `${currentListing.title} - ${currentListing.price} ${currentListing.currency}`,
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الإعلان!');
    }
  });
}

/* ==========================================
   ✏️ تعديل الإعلان (للأدمن)
   ========================================== */
function openEditModal() {
  if (!currentListing) {
    alert('لم يتم تحميل الإعلان بعد');
    return;
  }

  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();
  if (!isAdmin) {
    alert('هذه الميزة للأدمن فقط');
    return;
  }

  document.getElementById('editTitle').value = currentListing.title || '';
  document.getElementById('editPrice').value = currentListing.price || '';
  document.getElementById('editCurrency').value = currentListing.currency || 'USD';
  document.getElementById('editCity').value = currentListing.city || 'damascus';
  document.getElementById('editArea').value = currentListing.area || '';
  document.getElementById('editDescription').value = currentListing.description || '';
  document.getElementById('editWhatsapp').value = currentListing.whatsapp || '';
  document.getElementById('editStatus').value = currentListing.status || 'active';
  document.getElementById('editFeatured').checked = !!currentListing.featured;

  const modal = document.getElementById('editModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  if (window.lucide) window.lucide.createIcons();
}

window.closeEditModal = function() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
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

      const titleEl = document.getElementById('adTitle');
      if (titleEl) titleEl.textContent = updates.title;

      const priceEl = document.getElementById('adPrice');
      if (priceEl) {
        const priceText = Number(updates.price).toLocaleString('en-US');
        if (currentListing.purpose === 'sale') {
          priceEl.innerHTML = `${priceText} ${updates.currency}`;
        } else {
          priceEl.innerHTML = `${priceText} ${updates.currency} <small>/ شهرياً</small>`;
        }
      }

      const descEl = document.getElementById('adDescription');
      if (descEl) descEl.textContent = updates.description;

      const locEl = document.getElementById('adLocation');
      if (locEl) locEl.textContent = buildLocationText(currentListing);

      const purposeText = currentListing.purpose === 'sale' ? 'للبيع' : 'للإيجار';
      const purposeClass = currentListing.purpose === 'sale' ? 'sale' : 'rent';
      const typeText = currentListing.type === 'property' ? 'عقار' : 'سيارة';

      let badges = `
        <span class="info-badge ${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span>
        <span class="info-badge" style="background:var(--bg-secondary);color:var(--text-secondary);">
          <i data-lucide="${currentListing.type === 'property' ? 'building-2' : 'car'}"></i>${typeText}
        </span>`;
      if (updates.featured) {
        badges += `<span class="info-badge featured"><i data-lucide="star"></i>مميز</span>`;
      }
      const badgesEl = document.getElementById('infoBadges');
      if (badgesEl) badgesEl.innerHTML = badges;

      setupSellerWhatsapp(currentListing);

      closeEditModal();
      showToast('✅ تم حفظ التعديلات بنجاح', 'success');
    } else {
      showToast('❌ فشل الحفظ: ' + (result.error || 'خطأ غير معروف'), 'error');
    }
  } catch (err) {
    console.error('خطأ في التعديل:', err);
    showToast('❌ حدث خطأ أثناء الحفظ', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="save"></i><span>حفظ التعديلات</span>';
    if (window.lucide) window.lucide.createIcons();
  }
}

/* ==========================================
   Toast
   ========================================== */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 90px;
    left: 50%;
    transform: translateX(-50%);
    padding: 14px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'};
    color: white;
    border-radius: 12px;
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    z-index: 99999;
    animation: slideDown 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

if (!document.getElementById('toast-animation')) {
  const style = document.createElement('style');
  style.id = 'toast-animation';
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin { animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(style);
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  setupShare();

  const editBtn = document.getElementById('adminEditBtn');
  const editForm = document.getElementById('editForm');

  if (editBtn) editBtn.addEventListener('click', openEditModal);
  if (editForm) editForm.addEventListener('submit', saveEdit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeEditModal();
    }
  });

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

// ==========================================
// إخفاء رقم هاتف البائع عن المستخدمين العاديين
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const sellerBtn = document.getElementById('sellerWhatsappBtn'); 
    
    if (!sellerBtn) return;

    const currentUser = API.Users.getCurrent();
    
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');
    
    if (isAdmin) {
        sellerBtn.style.display = 'flex';
        console.log('🛡️ أدمن: تم إظهار رقم البائع.');
    } else {
        sellerBtn.style.display = 'none';
        console.log('👤 مستخدم عادي: تم إخفاء رقم البائع.');
    }
});ء  