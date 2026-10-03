/* ==========================================
   صفحة تفاصيل الإعلان
   الإصدار: 3.2 (كل الحقول بالعربية - عقارات وسيارات)
   ========================================== */

const BROKER_PHONE = '963930932794';
let currentListing = null;
let currentImageIndex = 0;

/* ==========================================
   بيانات تجريبية (Fallback)
   ========================================== */
const MOCK_LISTINGS = {
  '1001': {id:'1001',type:'property',purpose:'sale',title:'شقة فاخرة بتشطيب سوبر ديلوكس في المزة',location:'دمشق - المزة',price:185000,currency:'USD',featured:true,whatsapp:'0930000001',description:'شقة فاخرة بمساحة 180 متر مربع، تتكون من 3 غرف نوم، صالون واسع، مطبخ حديث، 2 حمام.\n\nتشطيب سوبر ديلوكس، طابق ثالث من أصل 5، عمر البناء 3 سنوات، مع مصعد وموقف سيارة خاص.',images:[],details:{propertyType:'apartment',area:180,rooms:3,bathrooms:2,floor:3,age:3,furnished:'furnished',heating:'central',_whatsapp:'0930000001'}},
  '2001': {id:'2001',type:'car',purpose:'sale',title:'تويوتا كامري 2022 - فل كامل',location:'دمشق - المزة',price:28500,currency:'USD',featured:true,whatsapp:'0930000005',description:'تويوتا كامري 2022 فل كامل، ماشية 35,000 كم فقط، بحالة الوكالة.',images:[],details:{brand:'toyota',model:'كامري',year:2022,km:35000,transmission:'automatic',fuel:'petrol',color:'أبيض',condition:'used',_whatsapp:'0930000005'}}
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
   بناء المواصفات من التفاصيل - كل الحقول بالعربية
   ========================================== */
function buildSpecsFromDetails(listing) {
  if (listing.specs && listing.specs.length > 0) return listing.specs;

  const d = listing.details || {};
  const isProperty = listing.type === 'property';
  const isAdmin = window.API && API.Users && API.Users.isAdmin && API.Users.isAdmin();

  const sensitiveKeys = ['whatsapp', 'phone', 'mobile', 'email', '_whatsapp', '_phone', '_mobile'];

  // ==========================================
  // ✅ قاموس العقارات - شامل كل الحقول
  // ==========================================
  const propertyMap = {
    propertyType: {
      icon: 'building-2', label: 'نوع العقار',
      translate: { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' }
    },
    subType: {
      icon: 'layers', label: 'نوع العقار',
      translate: { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' }
    },
    subtype: {
      icon: 'layers', label: 'نوع العقار',
      translate: { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' }
    },
    'sub-type': {
      icon: 'layers', label: 'نوع العقار',
      translate: { apartment: 'شقة', villa: 'فيلا', 'arabic-house': 'بيت عربي', land: 'أرض', office: 'مكتب', shop: 'محل تجاري', chalet: 'شاليه', building: 'بناء كامل' }
    },

    area: { icon: 'square', label: 'المساحة', suffix: ' م²' },
    propertyArea: { icon: 'square', label: 'المساحة', suffix: ' م²' },
    property_area: { icon: 'square', label: 'المساحة', suffix: ' م²' },

    rooms: { icon: 'bed-double', label: 'عدد الغرف' },
    bedrooms: { icon: 'bed-double', label: 'غرف النوم' },
    bathrooms: { icon: 'bath', label: 'عدد الحمامات' },
    baths: { icon: 'bath', label: 'عدد الحمامات' },

    floor: { icon: 'layers', label: 'الطابق' },
    totalFloors: { icon: 'building', label: 'إجمالي الطوابق' },
    total_floors: { icon: 'building', label: 'إجمالي الطوابق' },
    floors: { icon: 'building', label: 'عدد الطوابق' },

    age: { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },
    buildingAge: { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },
    building_age: { icon: 'calendar', label: 'عمر البناء', suffix: ' سنة' },

    // ✅ الاتجاه
    direction: {
      icon: 'compass', label: 'الاتجاه',
      translate: {
        'شمالي': 'شمالي', 'جنوبي': 'جنوبي', 'شرقي': 'شرقي', 'غربي': 'غربي',
        'شمالي شرقي': 'شمالي شرقي', 'شمالي غربي': 'شمالي غربي',
        'جنوبي شرقي': 'جنوبي شرقي', 'جنوبي غربي': 'جنوبي غربي',
        north: 'شمالي', south: 'جنوبي', east: 'شرقي', west: 'غربي',
        'north-east': 'شمالي شرقي', 'north-west': 'شمالي غربي',
        'south-east': 'جنوبي شرقي', 'south-west': 'جنوبي غربي',
        ne: 'شمالي شرقي', nw: 'شمالي غربي', se: 'جنوبي شرقي', sw: 'جنوبي غربي'
      }
    },
    facing: {
      icon: 'compass', label: 'الاتجاه',
      translate: {
        'شمالي': 'شمالي', 'جنوبي': 'جنوبي', 'شرقي': 'شرقي', 'غربي': 'غربي',
        north: 'شمالي', south: 'جنوبي', east: 'شرقي', west: 'غربي'
      }
    },

    // ✅ نوع الفراغة
    vacancyType: {
      icon: 'file-check', label: 'نوع الفراغة',
      translate: {
        'عقد تنازل': 'عقد تنازل', 'طابو أخضر': 'طابو أخضر', 'عن طريق محكمة': 'عن طريق محكمة',
        contract: 'عقد تنازل', 'green-tabu': 'طابو أخضر', court: 'عن طريق محكمة'
      }
    },
    vacancy_type: {
      icon: 'file-check', label: 'نوع الفراغة',
      translate: {
        'عقد تنازل': 'عقد تنازل', 'طابو أخضر': 'طابو أخضر', 'عن طريق محكمة': 'عن طريق محكمة'
      }
    },

    // ✅ نوع الإكساء
    finishingType: {
      icon: 'sparkles', label: 'نوع الإكساء',
      translate: {
        'عادي': 'عادي', 'متوسط': 'متوسط', 'جيد': 'جيد', 'سوبر ديلوكس': 'سوبر ديلوكس',
        normal: 'عادي', medium: 'متوسط', good: 'جيد', 'super-deluxe': 'سوبر ديلوكس', deluxe: 'سوبر ديلوكس'
      }
    },
    finishing_type: {
      icon: 'sparkles', label: 'نوع الإكساء',
      translate: {
        'عادي': 'عادي', 'متوسط': 'متوسط', 'جيد': 'جيد', 'سوبر ديلوكس': 'سوبر ديلوكس'
      }
    },

    furnished: {
      icon: 'sofa', label: 'الفرش',
      translate: { furnished: 'مفروش', 'semi-furnished': 'نصف مفروش', unfurnished: 'غير مفروش' }
    },
    heating: {
      icon: 'flame', label: 'التدفئة',
      translate: { central: 'مركزي', split: 'مكيفات', kerosene: 'كاز', electric: 'كهرباء', none: 'بدون' }
    },
    garden: {
      icon: 'trees', label: 'الحديقة',
      translate: { yes: 'متوفر', no: 'غير متوفر', true: 'متوفر', false: 'غير متوفر' }
    },
    pool: {
      icon: 'waves', label: 'المسبح',
      translate: { yes: 'متوفر', no: 'غير متوفر', true: 'متوفر', false: 'غير متوفر' }
    },

    landArea: { icon: 'square', label: 'مساحة الأرض', suffix: ' م²' },
    land_area: { icon: 'square', label: 'مساحة الأرض', suffix: ' م²' },
    landFrontage: { icon: 'route', label: 'عرض الواجهة', suffix: ' م' },
    land_frontage: { icon: 'route', label: 'عرض الواجهة', suffix: ' م' },
    landDepth: { icon: 'move-horizontal', label: 'العمق', suffix: ' م' },
    land_depth: { icon: 'move-horizontal', label: 'العمق', suffix: ' م' },
    landZoning: {
      icon: 'map', label: 'التنظيم',
      translate: { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي', agricultural: 'زراعي', mixed: 'مختلط' }
    },
    land_zoning: {
      icon: 'map', label: 'التنظيم',
      translate: { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي', agricultural: 'زراعي', mixed: 'مختلط' }
    },
    landTabu: {
      icon: 'file-check', label: 'الطابو',
      translate: { green: 'أخضر', blue: 'أزرق', organized: 'منظم', unorganized: 'غير منظم' }
    }
  };

  // ==========================================
  // ✅ قاموس السيارات - شامل كل الحقول
  // ==========================================
  const carMap = {
    brand: {
      icon: 'car', label: 'الماركة',
      translate: {
        toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس',
        bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه',
        ford: 'فورد', mazda: 'مازدا', mitsubishi: 'ميتسوبيشي',
        volkswagen: 'فولكس فاجن', audi: 'أودي', lexus: 'لكزس',
        renault: 'رينو', peugeot: 'بيجو', fiat: 'فيات', seat: 'سيات',
        skoda: 'سكودا', opel: 'أوبل', jeep: 'جيب', landrover: 'لاند روفر',
        'land-rover': 'لاند روفر', porsche: 'بورش', ferrari: 'فيراري',
        tesla: 'تسلا', volvo: 'فولفو', subaru: 'سوبارو',
        infiniti: 'إنفينيتي', cadillac: 'كاديلاك', gmc: 'جي إم سي',
        dodge: 'دودج', chrysler: 'كرايسلر', suzuki: 'سوزوكي',
        'mercedes-benz': 'مرسيدس', other: 'أخرى'
      }
    },
    brandName: { skip: true },
    brand_name: { skip: true },

    model: { icon: 'tag', label: 'الموديل' },

    year: { icon: 'calendar', label: 'سنة الصنع' },

    km: { icon: 'gauge', label: 'الكيلومترات', suffix: ' كم' },
    mileage: { icon: 'gauge', label: 'الكيلومترات', suffix: ' كم' },

    condition: {
      icon: 'sparkles', label: 'الحالة',
      translate: { 
        new: 'جديد', used: 'مستعمل', 'like-new': 'كالجديد',
        excellent: 'ممتازة', good: 'جيدة', fair: 'مقبولة'
      }
    },

    transmission: {
      icon: 'settings-2', label: 'ناقل الحركة',
      translate: { 
        automatic: 'أوتوماتيك', manual: 'عادي', auto: 'أوتوماتيك',
        cvt: 'CVT', 'dual-clutch': 'دبل كلتش'
      }
    },
    gear: {
      icon: 'settings-2', label: 'ناقل الحركة',
      translate: { automatic: 'أوتوماتيك', manual: 'عادي' }
    },

    fuel: {
      icon: 'fuel', label: 'الوقود',
      translate: { 
        petrol: 'بنزين', diesel: 'ديزل', electric: 'كهرباء',
        hybrid: 'هايبرد', gasoline: 'بنزين', cng: 'غاز طبيعي'
      }
    },

    color: {
      icon: 'palette', label: 'اللون',
      translate: {
        white: 'أبيض', black: 'أسود', silver: 'فضي', gray: 'رمادي', grey: 'رمادي',
        red: 'أحمر', blue: 'أزرق', green: 'أخضر', yellow: 'أصفر',
        brown: 'بني', beige: 'بيج', gold: 'ذهبي', orange: 'برتقالي',
        'أبيض': 'أبيض', 'أسود': 'أسود', 'فضي': 'فضي', 'رمادي': 'رمادي'
      }
    },

    bodyType: {
      icon: 'car', label: 'نوع الجسم',
      translate: { 
        sedan: 'سيدان', suv: 'SUV', hatchback: 'هاتشباك',
        pickup: 'بيك أب', coupe: 'كوبيه', van: 'فان',
        convertible: 'كشف', wagon: 'ستيشن', crossover: 'كروس أوفر'
      }
    },
    body_type: {
      icon: 'car', label: 'نوع الجسم',
      translate: { 
        sedan: 'سيدان', suv: 'SUV', hatchback: 'هاتشباك',
        pickup: 'بيك أب', coupe: 'كوبيه', van: 'فان'
      }
    },

    carInsurance: {
      icon: 'shield-check', label: 'التأمين',
      translate: { yes: 'مؤمنة', no: 'غير مؤمنة', true: 'مؤمنة', false: 'غير مؤمنة' }
    },
    insurance: {
      icon: 'shield-check', label: 'التأمين',
      translate: { yes: 'مؤمنة', no: 'غير مؤمنة', true: 'مؤمنة', false: 'غير مؤمنة' }
    },

    minDays: { icon: 'calendar-clock', label: 'أقل مدة إيجار', suffix: ' يوم' },
    min_days: { icon: 'calendar-clock', label: 'أقل مدة إيجار', suffix: ' يوم' }
  };

  // ==========================================
  // ✅ قاموس عام (لأي حقل غير معروف)
  // ==========================================
  const globalFieldTranslations = {
    subtype: 'النوع الفرعي', sub_type: 'النوع الفرعي', 'sub-type': 'النوع الفرعي',
    propertytype: 'نوع العقار', property_type: 'نوع العقار', 'property-type': 'نوع العقار',
    direction: 'الاتجاه', facing: 'الاتجاه',
    vacancytype: 'نوع الفراغة', vacancy_type: 'نوع الفراغة',
    finishingtype: 'نوع الإكساء', finishing_type: 'نوع الإكساء',

    totalfloors: 'إجمالي الطوابق', total_floors: 'إجمالي الطوابق',
    floors: 'عدد الطوابق', floor: 'الطابق',
    rooms: 'عدد الغرف', bedrooms: 'غرف النوم',
    bathrooms: 'عدد الحمامات', baths: 'عدد الحمامات',
    area: 'المساحة', propertyarea: 'المساحة', property_area: 'المساحة',
    landarea: 'مساحة الأرض', land_area: 'مساحة الأرض',
    age: 'عمر البناء', buildingage: 'عمر البناء', building_age: 'عمر البناء',
    furnished: 'الفرش', heating: 'التدفئة', cooling: 'التبريد',
    garden: 'الحديقة', pool: 'المسبح', parking: 'موقف سيارة',
    elevator: 'مصعد', balcony: 'شرفة', terrace: 'تراس',
    address: 'العنوان', location: 'الموقع', city: 'المحافظة',
    area_name: 'المنطقة', district: 'الحي', neighborhood: 'الحي',

    brand: 'الماركة', brandname: 'الماركة', brand_name: 'الماركة',
    model: 'الموديل', year: 'السنة', km: 'الكيلومترات', mileage: 'المسافة المقطوعة',
    color: 'اللون', bodytype: 'نوع الجسم', body_type: 'نوع الجسم',
    fuel: 'الوقود', transmission: 'ناقل الحركة', gear: 'ناقل الحركة',
    condition: 'الحالة', carinsurance: 'التأمين', insurance: 'التأمين',
    mindays: 'أقل مدة إيجار', min_days: 'أقل مدة إيجار',
    wifi: 'واي فاي', ac: 'تكييف', kitchen: 'مطبخ'
  };

  const map = isProperty ? propertyMap : carMap;
  const specs = [];
  const usedLabels = new Set();

  Object.keys(d).forEach(key => {
    if (sensitiveKeys.includes(key.toLowerCase()) && !isAdmin) return;
    if (key.startsWith('_') && !isAdmin) return;
    if (key.startsWith('_') && key !== '_whatsapp' && key !== '_phone') return;

    let value = d[key];
    if (value === '' || value === null || value === undefined) return;

    let meta = map[key];

    // البحث في القاموس العام
    if (!meta) {
      const lowerKey = key.toLowerCase();
      const label = globalFieldTranslations[lowerKey] || globalFieldTranslations[key];
      if (label) {
        meta = { icon: 'info', label: label };
      } else {
        return; // ← لا نعرض الحقول غير المترجمة
      }
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

/* ==========================================
   استخراج نوع العقار/السيارة
   ========================================== */
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

/* ==========================================
   استخراج الموقع الصحيح
   ========================================== */
function buildLocationText(listing) {
  const cityNames = { damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب', homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية', tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء', quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور', raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب' };
  const cityAr = listing.city ? (cityNames[listing.city] || listing.city) : '';
  const area = listing.area || '';
  if (cityAr && area) return `${cityAr} - ${area}`;
  if (cityAr) return cityAr;
  if (area) return area;
  return listing.location || '—';
}

/* ==========================================
   Preload الصورة الرئيسية (LCP)
   ========================================== */
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

/* ==========================================
   عرض الإعلان
   ========================================== */
function renderListing(l) {
  currentListing = l;
  preloadMainImage(l);

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

  const listingUrl = window.location.href;
  const locationText = buildLocationText(l);
  const priceText = l.purpose === 'sale' ? `${priceNum.toLocaleString('en-US')} ${l.currency || 'USD'}` : `${priceNum} ${l.currency || 'USD'} / شهرياً`;
  const specificType = buildTypeText(l);
  const typeLabel = l.type === 'property' ? 'نوع العقار' : 'نوع السيارة';

  const msg = `مرحباً، انا مهتم بـ ${typeText} ورقم الإعلان هو: ${l.id}\n🔍 ${typeLabel}: ${specificType}\n📍 الموقع: ${locationText}\n💰 السعر: ${priceText}\n\n🔗 رابط الإعلان:\n${listingUrl}`;

  document.getElementById('whatsappBtn').href = `https://wa.me/${BROKER_PHONE}?text=${encodeURIComponent(msg)}`;

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
    btn.removeAttribute('href');
    btn.innerHTML = '';
    return;
  }

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
   معرض الصور
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

  const getUrl = window.getListingImageUrl;

  const largeUrls = imgs.map((_, i) => getUrl ? getUrl(l, i, 'large') : null).filter(Boolean);

  if (!largeUrls.length) {
    const raw = imgs.map(img => typeof img === 'string' ? img : null).filter(Boolean);
    largeUrls.push(...raw);
  }

  currentListing._galleryUrls = { large: largeUrls };
  const safeTitle = (l.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  main.innerHTML = `
    <img src="${largeUrls[0]}" alt="${safeTitle}" loading="eager" decoding="async" fetchpriority="high" style="width:100%;height:100%;object-fit:cover;display:block;">
    <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
    <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
    <div class="gallery-counter" id="galleryCounter">1 / ${largeUrls.length}</div>`;

  thumbs.innerHTML = largeUrls.map((url, i) => 
    `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="goToImage(${i})"><img src="${url}" alt="صورة ${i + 1}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;"></div>`
  ).join('');

  currentImageIndex = 0;
  initIcons();
}

window.prevImage = function() { if (!currentListing?._galleryUrls?.large?.length) return; const t = currentListing._galleryUrls.large.length; currentImageIndex = (currentImageIndex - 1 + t) % t; updateGallery(); };
window.nextImage = function() { if (!currentListing?._galleryUrls?.large?.length) return; const t = currentListing._galleryUrls.large.length; currentImageIndex = (currentImageIndex + 1) % t; updateGallery(); };
window.goToImage = function(i) { if (!currentListing?._galleryUrls?.large?.length) return; currentImageIndex = i; updateGallery(); };

function updateGallery() {
  const urls = currentListing._galleryUrls;
  if (!urls || !urls.large.length) return;
  const main = document.getElementById('galleryMain');
  const imgEl = main.querySelector('img');
  if (imgEl) imgEl.src = urls.large[currentImageIndex];
  const counter = document.getElementById('galleryCounter');
  if (counter) counter.textContent = `${currentImageIndex + 1} / ${urls.large.length}`;
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => t.classList.toggle('active', i === currentImageIndex));
}

/* ==========================================
   المفضلة
   ========================================== */
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

/* ==========================================
   المشاركة
   ========================================== */
function setupShare() {
  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    const data = { title: currentListing.title, text: `${currentListing.title} - ${currentListing.price} ${currentListing.currency}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); alert('تم نسخ رابط الإعلان!'); }
  });
}

/* ==========================================
   تعديل الإعلان (للأدمن)
   ========================================== */
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
      document.getElementById('adDescription').textContent = updates.description;
      document.getElementById('adLocation').textContent = buildLocationText(currentListing);

      const purposeText = currentListing.purpose === 'sale' ? 'للبيع' : 'للإيجار';
      const purposeClass = currentListing.purpose === 'sale' ? 'sale' : 'rent';
      const typeText = currentListing.type === 'property' ? 'عقار' : 'سيارة';
      let badges = `<span class="info-badge ${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span><span class="info-badge" style="background:var(--bg-secondary);color:var(--text-secondary);"><i data-lucide="${currentListing.type === 'property' ? 'building-2' : 'car'}"></i>${typeText}</span>`;
      if (updates.featured) badges += `<span class="info-badge featured"><i data-lucide="star"></i>مميز</span>`;
      document.getElementById('infoBadges').innerHTML = badges;

      setupSellerWhatsapp(currentListing);
      closeEditModal();
      showToast('✅ تم حفظ التعديلات بنجاح', 'success');
    } else { showToast('❌ فشل الحفظ: ' + (result.error || 'خطأ غير معروف'), 'error'); }
  } catch (err) { console.error('خطأ في التعديل:', err); showToast('❌ حدث خطأ أثناء الحفظ', 'error'); }
  finally {
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