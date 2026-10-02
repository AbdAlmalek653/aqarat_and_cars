/* ==========================================
   صفحة إضافة إعلان - منطق ذكي حسب النوع والغرض
   الإصدار: 3.0 (متوافق مع تصميم Dropzone الجديد)
   ========================================== */

let state = {
  type: null,        // 'property' | 'car'
  purpose: null,     // 'sale' | 'rent'
  subType: null,     // apartment, villa, land, office, shop, chalet, building, arabic-house
  brand: null,       // toyota, hyundai, ..., 'other'
  customBrand: ''    // اسم الماركة اللي يكتبه المستخدم عند اختيار "أخرى"
};

let uploadedImages = [];
let isProcessingImages = false; // ✅ منع رفع صور أثناء المعالجة

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ==========================================
   التنقل بين الخطوات
   ========================================== */
function showStep(n) {
  ['step1','step2','step3','step4'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (i + 1 === n) ? 'block' : 'none';
  });
  updateStepsIndicator(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepsIndicator(active) {
  document.querySelectorAll('.al-step-dot').forEach(dot => {
    const n = Number(dot.dataset.step);
    dot.classList.toggle('active', n === active);
    dot.classList.toggle('done', n < active);
  });
}

/* ==========================================
   الخطوة 1: النوع
   ========================================== */
function setupStep1() {
  document.querySelectorAll('#step1 .type-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      state.type = card.dataset.value;
      document.getElementById('purposeTypeName').textContent =
        state.type === 'property' ? 'العقار' : 'السيارة';
      showStep(2);
    });
  });
}

/* ==========================================
   الخطوة 2: الغرض
   ========================================== */
function setupStep2() {
  document.querySelectorAll('#step2 .type-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      state.purpose = card.dataset.value;
      prepareStep3();
      showStep(3);
    });
  });

  document.getElementById('backToStep1')?.addEventListener('click', () => {
    state.type = null;
    showStep(1);
  });

  document.getElementById('backToStep2')?.addEventListener('click', () => {
    if (confirm('هل تريد الرجوع؟ سيتم مسح البيانات المدخلة.')) {
      resetForm();
      showStep(2);
    }
  });
}

/* ==========================================
   الخطوة 3: تجهيز النموذج
   ========================================== */
function prepareStep3() {
  const isProperty = state.type === 'property';
  const isRent = state.purpose === 'rent';

  document.getElementById('formTitle').textContent = isProperty ? 'أضف إعلان عقار' : 'أضف إعلان سيارة';
  document.getElementById('currentTypeText').textContent = isProperty ? (isRent ? 'عقار للإيجار' : 'عقار للبيع') : (isRent ? 'سيارة للإيجار' : 'سيارة للبيع');
  document.getElementById('currentTypeIcon').setAttribute('data-lucide', isProperty ? 'building-2' : 'car');

  document.getElementById('subTypeSection').style.display = isProperty ? 'block' : 'none';
  document.getElementById('brandSection').style.display = isProperty ? 'none' : 'block';

  document.getElementById('priceSectionTitle').textContent = isRent ? 'سعر الإيجار' : 'السعر';
  document.getElementById('priceLabel').textContent = isRent ? 'السعر' : 'السعر';
  document.getElementById('price').placeholder = isRent ? 'مثال: 500' : 'مثال: 150000';

  document.getElementById('rentPeriodField').style.display = isRent ? 'flex' : 'none';
  document.getElementById('depositField').style.display = isRent ? 'flex' : 'none';
  document.getElementById('minDaysField').style.display = (isRent && !isProperty) ? 'flex' : 'none';
  document.getElementById('carInsuranceField').style.display = (isRent && !isProperty) ? 'flex' : 'none';
  document.getElementById('conditionField').style.display = (!isRent && !isProperty) ? 'flex' : 'none';
  document.getElementById('kmField').style.display = (!isRent && !isProperty) ? 'flex' : 'none';

  ['residentialSection', 'landSection', 'commercialSection', 'carSection']
    .forEach(id => document.getElementById(id).style.display = 'none');

  document.querySelectorAll('#subTypeGrid .subtype-card').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#brandGrid .subtype-card').forEach(b => b.classList.remove('active'));

  const otherField = document.getElementById('otherBrandField');
  if (otherField) otherField.style.display = 'none';

  if (!isProperty) {
    document.getElementById('carSection').style.display = 'block';
  }

  initIcons();
}

/* ==========================================
   النوع الفرعي (للعقار) والماركة (للسيارة)
   ========================================== */
function setupSubType() {
  document.querySelectorAll('#subTypeGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#subTypeGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.subType = card.dataset.subtype;
      showPropertyFields();
    });
  });

  document.querySelectorAll('#brandGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#brandGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.brand = card.dataset.brand;

      const otherField = document.getElementById('otherBrandField');
      const otherInput = document.getElementById('otherBrand');

      if (card.dataset.brand === 'other') {
        otherField.style.display = 'flex';
        setTimeout(() => otherInput.focus(), 100);
      } else {
        otherField.style.display = 'none';
        otherInput.value = '';
        otherInput.classList.remove('error');
        const err = document.getElementById('otherBrandError');
        if (err) err.classList.remove('show');
      }
      initIcons();
    });
  });

  document.getElementById('otherBrand')?.addEventListener('input', (e) => {
    e.target.classList.remove('error');
    const err = document.getElementById('otherBrandError');
    if (err) err.classList.remove('show');
  });
}

function showPropertyFields() {
  const subType = state.subType;
  const isRent = state.purpose === 'rent';

  ['residentialSection', 'landSection', 'commercialSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  const residentialTypes = ['apartment', 'villa', 'arabic-house', 'chalet'];
  const landTypes = ['land'];
  const commercialTypes = ['office', 'shop'];
  const buildingTypes = ['building'];

  if (residentialTypes.includes(subType)) {
    document.getElementById('residentialSection').style.display = 'block';
    const hasGardenPool = ['villa', 'chalet'].includes(subType);
    document.getElementById('gardenField').style.display = hasGardenPool ? 'flex' : 'none';
    document.getElementById('poolField').style.display = hasGardenPool ? 'flex' : 'none';
    document.getElementById('furnishedField').style.display = isRent ? 'flex' : 'none';
    document.getElementById('rooms').disabled = false;
    document.getElementById('bathrooms').disabled = false;
  }

  if (landTypes.includes(subType)) {
    document.getElementById('landSection').style.display = 'block';
  }

  if (commercialTypes.includes(subType)) {
    document.getElementById('commercialSection').style.display = 'block';
  }

  if (buildingTypes.includes(subType)) {
    document.getElementById('residentialSection').style.display = 'block';
    document.getElementById('rooms').disabled = true;
    document.getElementById('bathrooms').disabled = true;
    document.getElementById('gardenField').style.display = 'none';
    document.getElementById('poolField').style.display = 'none';
    document.getElementById('furnishedField').style.display = 'none';
  } else {
    document.getElementById('rooms').disabled = false;
    document.getElementById('bathrooms').disabled = false;
  }

  initIcons();
}

/* ==========================================
   🖼️ ضغط الصور في المتصفح (Client-Side Compression)
   ========================================== */
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (file.size < 200 * 1024) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl.indexOf('data:image/webp') !== 0) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (err) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

/* ==========================================
   رفع الصور (متوافق مع التصميم الجديد Dropzone)
   ========================================== */
function setupImageUpload() {
  const dropzone = document.getElementById('uploadArea');
  const fileInput = document.getElementById('imageInput');
  const selectBtn = document.getElementById('selectImagesBtn');
  const preview = document.getElementById('imagePreview');

  if (!dropzone || !fileInput || !preview) return;

  // ✅ 1. فتح نافذة اختيار الملفات عند الضغط على الصندوق أو الزر
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#selectImagesBtn')) return; // الزر يتعامل مع النقر بنفسه
    fileInput.click();
  });

  if (selectBtn) {
    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // منع تكرار الحدث
      fileInput.click();
    });
  }

  // ✅ 2. تأثيرات السحب والإفلات
  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); });
  });

  // ✅ 3. معالجة الملفات
  dropzone.addEventListener('drop', e => {
    if (isProcessingImages) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });

  fileInput.addEventListener('change', () => {
    if (isProcessingImages) return;
    handleFiles(Array.from(fileInput.files));
  });

  async function handleFiles(files) {
    if (isProcessingImages) {
      showAlert('جاري معالجة الصور، الرجاء الانتظار...');
      return;
    }

    if (uploadedImages.length + files.length > 10) {
      showAlert('يمكنك اختيار حتى 10 صور فقط');
      return;
    }

    isProcessingImages = true;
    fileInput.disabled = true;

    showProcessingIndicator(true, files.length);

    let processed = 0;
    let failed = 0;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert(`الصورة "${file.name}" أكبر من 10 ميجابايت`);
        failed++;
        continue;
      }

      try {
        const compressedDataUrl = await compressImage(file, 1200, 0.75);
        const originalKB = (file.size / 1024).toFixed(0);
        const compressedKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
        const savings = Math.round((1 - compressedKB / originalKB) * 100);
        console.log(`✅ ${file.name}: ${originalKB}KB → ~${compressedKB}KB (توفير ${savings}%)`);

        uploadedImages.push({
          id: 'img_' + Date.now() + Math.random(),
          data: compressedDataUrl,
          name: file.name,
          size: compressedKB
        });

        processed++;
        renderPreview();
      } catch (err) {
        console.warn('⚠️ فشل ضغط:', file.name, err);
        try {
          const fallbackDataUrl = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = () => reject(new Error('فشل القراءة'));
            r.readAsDataURL(file);
          });
          uploadedImages.push({
            id: 'img_' + Date.now() + Math.random(),
            data: fallbackDataUrl,
            name: file.name,
            size: Math.round(file.size / 1024)
          });
          processed++;
          renderPreview();
        } catch (fallbackErr) {
          failed++;
        }
      }
    }

    showProcessingIndicator(false);
    isProcessingImages = false;
    fileInput.disabled = false;
    fileInput.value = '';

    if (failed > 0) {
      showAlert(`تمت معالجة ${processed} صورة، وفشلت ${failed} صورة`);
    } else if (processed > 0) {
      console.log(`✅ تمت معالجة ${processed} صورة بنجاح`);
    }
  }

  function showProcessingIndicator(show, count = 0) {
    let indicator = document.getElementById('imageProcessingIndicator');
    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'imageProcessingIndicator';
        indicator.style.cssText = `
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px; margin-top: 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px dashed rgba(59, 130, 246, 0.5);
          border-radius: 12px;
          color: #3B82F6; font-size: 14px; font-weight: 600;
        `;
        indicator.innerHTML = `
          <i data-lucide="loader-2" class="spin" style="animation: spin 1s linear infinite;"></i>
          <span>جاري ضغط الصور... (0/${count})</span>
        `;
        dropzone.parentNode.insertBefore(indicator, dropzone.nextSibling);
        initIcons();
      } else {
        const span = indicator.querySelector('span');
        if (span) span.textContent = `جاري ضغط الصور... (0/${count})`;
        indicator.style.display = 'flex';
      }
    } else if (indicator) {
      indicator.style.display = 'none';
    }
  }

  // ✅ 4. عرض الصور المصغرة (متوافق مع التصميم الجديد)
  function renderPreview() {
    preview.innerHTML = uploadedImages.map(img => `
      <div class="preview-item">
        <img src="${img.data}" alt="${img.name}" loading="lazy">
        <button type="button" class="remove-btn" data-id="${img.id}" title="حذف">
          <i data-lucide="x" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `).join('');

    preview.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // منع فتح نافذة اختيار الملفات عند الحذف
        uploadedImages = uploadedImages.filter(img => img.id !== btn.dataset.id);
        renderPreview();
      });
    });

    const totalSize = uploadedImages.reduce((sum, img) => sum + (img.size || 0), 0);
    let sizeInfo = document.getElementById('imageSizeInfo');
    if (!sizeInfo) {
      sizeInfo = document.createElement('div');
      sizeInfo.id = 'imageSizeInfo';
      sizeInfo.style.cssText = 'margin-top: 8px; font-size: 13px; color: #64748B; text-align: center;';
      preview.parentNode.insertBefore(sizeInfo, preview.nextSibling);
    }
    if (uploadedImages.length > 0) {
      sizeInfo.textContent = `📦 ${uploadedImages.length} صورة | الحجم الإجمالي: ${totalSize}KB`;
      sizeInfo.style.display = 'block';
    } else {
      sizeInfo.style.display = 'none';
    }

    initIcons();
  }
}

/* ==========================================
   التحقق
   ========================================== */
function validateForm() {
  let ok = true;
  document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.al-field input, .al-field select, .al-field textarea')
    .forEach(el => el.classList.remove('error'));

  const title = document.getElementById('title').value.trim();
  if (!title) { showFieldError('title', 'الرجاء إدخال عنوان الإعلان'); ok = false; }
  else if (title.length < 10) { showFieldError('title', 'العنوان قصير جداً'); ok = false; }

  if (!document.getElementById('city').value) { showFieldError('city', 'الرجاء اختيار المحافظة'); ok = false; }

  const whatsapp = document.getElementById('whatsapp').value.trim();
  if (!whatsapp) {
    showFieldError('whatsapp', 'الرجاء إدخال رقم الواتساب');
    ok = false;
  } else if (!/^[0-9+\s-]{8,15}$/.test(whatsapp)) {
    showFieldError('whatsapp', 'رقم الواتساب غير صحيح (أرقام فقط)');
    ok = false;
  }

  const price = document.getElementById('price').value;
  if (!price || Number(price) <= 0) { showFieldError('price', 'الرجاء إدخال سعر صحيح'); ok = false; }

  if (state.purpose === 'rent' && !document.getElementById('rentPeriod').value) {
    showFieldError('rentPeriod', 'الرجاء اختيار مدة الإيجار'); ok = false;
  }

  if (state.type === 'property' && !state.subType) {
    showAlert('الرجاء اختيار نوع العقار');
    ok = false;
  }

  if (state.subType === 'land') {
    const landArea = document.getElementById('landArea').value;
    if (!landArea || Number(landArea) <= 0) {
      showFieldError('landArea', 'الرجاء إدخال مساحة الأرض'); ok = false;
    }
  }

  if (state.type === 'car') {
    if (!state.brand) {
      showAlert('الرجاء اختيار ماركة السيارة');
      ok = false;
    }

    if (state.brand === 'other') {
      const otherBrand = document.getElementById('otherBrand').value.trim();
      if (!otherBrand) {
        showFieldError('otherBrand', 'الرجاء كتابة اسم الماركة');
        ok = false;
      } else if (otherBrand.length < 2) {
        showFieldError('otherBrand', 'اسم الماركة قصير جداً');
        ok = false;
      }
    }

    if (!document.getElementById('model').value.trim()) {
      showFieldError('model', 'الرجاء إدخال الموديل'); ok = false;
    }
    if (!document.getElementById('year').value) {
      showFieldError('year', 'الرجاء إدخال سنة الصنع'); ok = false;
    }
    if (state.purpose === 'sale' && !document.getElementById('condition').value) {
      showFieldError('condition', 'الرجاء اختيار الحالة'); ok = false;
    }
  }

  const desc = document.getElementById('description').value.trim();
  if (!desc) { showFieldError('description', 'الرجاء إدخال الوصف'); ok = false; }
  else if (desc.length < 30) { showFieldError('description', 'الوصف قصير جداً'); ok = false; }

  if (uploadedImages.length === 0) {
    showAlert('الرجاء إضافة صورة واحدة على الأقل');
    ok = false;
  }

  return ok;
}

function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const input = document.getElementById(fieldId);
  if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
  if (input) input.classList.add('error');
}

/* ==========================================
   التنبيهات
   ========================================== */
function showAlert(message, type = 'error') {
  const alert = document.getElementById('alAlert');
  const text = document.getElementById('alAlertText');
  if (!alert || !text) return;
  text.textContent = message;
  alert.className = 'al-alert ' + type;
  alert.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAlert() {
  const alert = document.getElementById('alAlert');
  if (alert) alert.style.display = 'none';
}

/* ==========================================
   تحديث الإحصائيات بعد الإضافة
   ========================================== */
function updateStatsAfterListing(type) {
  const DEFAULT_PROPS = 6500;
  const DEFAULT_CARS = 3800;

  try {
    if (type === 'property') {
      let current = parseInt(localStorage.getItem('propsCount')) || DEFAULT_PROPS;
      localStorage.setItem('propsCount', current + 1);
    } else if (type === 'car') {
      let current = parseInt(localStorage.getItem('carsCount')) || DEFAULT_CARS;
      localStorage.setItem('carsCount', current + 1);
    }
  } catch (e) {
    console.warn('لم يتم تحديث الإحصائيات:', e);
  }
}

/* ==========================================
   إرسال النموذج
   ========================================== */
function setupFormSubmit() {
  const form = document.getElementById('addListingForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form) return;

  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const err = document.getElementById(el.id + 'Error');
      if (err) err.classList.remove('show');
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideAlert();

    if (isProcessingImages) {
      showAlert('جاري معالجة الصور، الرجاء الانتظار حتى الانتهاء...');
      return;
    }

    const sessionUser = await API.Users.validateSession();
    if (!sessionUser) {
      showAlert('يجب تسجيل الدخول أولاً.');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      return;
    }

    if (!validateForm()) {
      showAlert('الرجاء تصحيح الأخطاء في النموذج');
      return;
    }

    const data = {
      type: state.type,
      purpose: state.purpose,
      subType: state.subType,
      title: document.getElementById('title').value.trim(),
      city: document.getElementById('city').value,
      area: document.getElementById('area').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      price: document.getElementById('price').value,
      currency: document.getElementById('currency').value,
      negotiable: document.getElementById('negotiable').value,
      description: document.getElementById('description').value.trim(),
      images: uploadedImages.map(img => img.data),
      details: buildDetails()
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i><span>جاري النشر...</span>`;
    initIcons();

    setTimeout(async () => {
      const result = await API.Listings.create(data);
      if (!result.success) {
        showAlert(result.error || 'حدث خطأ أثناء النشر');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="send"></i><span>نشر الإعلان</span>`;
        initIcons();
        return;
      }

      updateStatsAfterListing(state.type);

      try {
        sessionStorage.setItem('souq_reload_home', '1');
      } catch (err) {}

      showStep(4);
      initIcons();
    }, 700);
  });
}

function buildDetails() {
  const details = {};

  if (state.type === 'property') {
    details.subType = state.subType;

    if (state.purpose === 'rent') {
      details.rentPeriod = document.getElementById('rentPeriod').value;
      details.deposit = document.getElementById('deposit').value;
    }

    if (['apartment', 'villa', 'arabic-house', 'chalet', 'building'].includes(state.subType)) {
      details.propertyArea = document.getElementById('propertyArea').value;
      details.rooms = document.getElementById('rooms').value;
      details.bathrooms = document.getElementById('bathrooms').value;
      details.floor = document.getElementById('floor').value;
      details.direction = document.getElementById('direction').value;
      details.vacancyType = document.getElementById('vacancyType').value;
      details.heating = document.getElementById('heating').value;
      details.finishingType = document.getElementById('finishingType').value;

      if (state.purpose === 'rent') {
        details.furnished = document.getElementById('furnished').value;
      }

      if (['villa', 'chalet'].includes(state.subType)) {
        details.garden = document.getElementById('garden').value;
        details.pool = document.getElementById('pool').value;
      }
    }

    if (state.subType === 'land') {
      details.landArea = document.getElementById('landArea').value;
      details.landFrontage = document.getElementById('landFrontage').value;
      details.landDepth = document.getElementById('landDepth').value;
      details.landZoning = document.getElementById('landZoning').value;
      details.landTabu = document.getElementById('landTabu').value;
      details.landWater = document.getElementById('landWater').checked;
      details.landElectric = document.getElementById('landElectric').checked;
      details.landSewage = document.getElementById('landSewage').checked;
      details.landStreet = document.getElementById('landStreet').checked;
    }

    if (['office', 'shop'].includes(state.subType)) {
      details.commercialArea = document.getElementById('commercialArea').value;
      details.commercialFloor = document.getElementById('commercialFloor').value;
      details.commercialAge = document.getElementById('commercialAge').value;
      details.commElectric = document.getElementById('commElectric').checked;
      details.commWater = document.getElementById('commWater').checked;
      details.commAC = document.getElementById('commAC').checked;
      details.commParking = document.getElementById('commParking').checked;
    }
  }

  if (state.type === 'car') {
    if (state.brand === 'other') {
      details.brand = 'other';
      details.brandName = document.getElementById('otherBrand').value.trim();
    } else {
      details.brand = state.brand;
      const brandNames = {
        toyota: 'تويوتا', hyundai: 'هيونداي', kia: 'كيا', mercedes: 'مرسيدس',
        bmw: 'BMW', nissan: 'نيسان', honda: 'هوندا', chevrolet: 'شيفروليه', ford: 'فورد'
      };
      details.brandName = brandNames[state.brand] || state.brand;
    }

    details.model = document.getElementById('model').value;
    details.year = document.getElementById('year').value;
    details.transmission = document.getElementById('transmission').value;
    details.fuel = document.getElementById('fuel').value;
    details.color = document.getElementById('color').value;
    details.bodyType = document.getElementById('bodyType').value;

    if (state.purpose === 'sale') {
      details.condition = document.getElementById('condition').value;
      details.km = document.getElementById('km').value;
    } else {
      details.carInsurance = document.getElementById('carInsurance').value;
      details.minDays = document.getElementById('minDays').value;
    }
  }

  return details;
}

/* ==========================================
   إعادة تعيين
   ========================================== */
function resetForm() {
  document.getElementById('addListingForm')?.reset();
  uploadedImages = [];
  const preview = document.getElementById('imagePreview');
  if (preview) preview.innerHTML = '';
  
  document.querySelectorAll('.subtype-card').forEach(b => b.classList.remove('active'));
  state.subType = null;
  state.brand = null;
  state.customBrand = '';

  const otherField = document.getElementById('otherBrandField');
  if (otherField) otherField.style.display = 'none';
  const otherInput = document.getElementById('otherBrand');
  if (otherInput) otherInput.value = '';

  const sizeInfo = document.getElementById('imageSizeInfo');
  if (sizeInfo) sizeInfo.style.display = 'none';

  hideAlert();
}

/* ==========================================
   ✅ قراءة النوع من الرابط (Preselect Type)
   ========================================== */
function checkPreselectedType() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectType = urlParams.get('type');

  if (preselectType === 'property' || preselectType === 'car') {
    state.type = preselectType;

    const purposeNameEl = document.getElementById('purposeTypeName');
    if (purposeNameEl) {
      purposeNameEl.textContent = preselectType === 'property' ? 'العقار' : 'السيارة';
    }

    showStep(2);
  }
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupStep1();
  setupStep2();
  setupSubType();
  setupImageUpload();
  setupFormSubmit();

  document.getElementById('cancelBtn')?.addEventListener('click', () => {
    if (confirm('هل تريد إلغاء الإعلان؟')) window.location.href = '../index.html';
  });

  document.getElementById('addAnotherBtn')?.addEventListener('click', () => {
    resetForm();
    state.type = null;
    state.purpose = null;
    showStep(1);
  });

  checkPreselectedType();
});