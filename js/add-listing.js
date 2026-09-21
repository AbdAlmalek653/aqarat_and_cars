/* ==========================================
   صفحة إضافة إعلان - منطق ذكي حسب النوع والغرض
   ========================================== */

let state = {
  type: null,        // 'property' | 'car'
  purpose: null,     // 'sale' | 'rent'
  subType: null,     // apartment, villa, land, office, shop, chalet, building, arabic-house
  brand: null,       // toyota, hyundai, ..., 'other'
  customBrand: ''    // اسم الماركة اللي يكتبه المستخدم عند اختيار "أخرى"
};

let uploadedImages = [];

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ==========================================
   التنقل بين الخطوات
   ========================================== */
function showStep(n) {
  ['step1','step2','step3','step4'].forEach((id, i) => {
    document.getElementById(id).style.display = (i + 1 === n) ? 'block' : 'none';
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

  // العنوان
  document.getElementById('formTitle').textContent =
    isProperty ? 'أضف إعلان عقار' : 'أضف إعلان سيارة';

  // الشارة
  document.getElementById('currentTypeText').textContent =
    isProperty
      ? (isRent ? 'عقار للإيجار' : 'عقار للبيع')
      : (isRent ? 'سيارة للإيجار' : 'سيارة للبيع');
  document.getElementById('currentTypeIcon').setAttribute('data-lucide',
    isProperty ? 'building-2' : 'car');

  // إظهار قسم النوع الفرعي للعقار فقط
  document.getElementById('subTypeSection').style.display = isProperty ? 'block' : 'none';

  // إظهار قسم الماركة للسيارة فقط
  document.getElementById('brandSection').style.display = isProperty ? 'none' : 'block';

  // قسم السعر
  document.getElementById('priceSectionTitle').textContent =
    isRent ? 'سعر الإيجار' : 'السعر';
  document.getElementById('priceLabel').textContent =
    isRent ? 'السعر' : 'السعر';
  document.getElementById('price').placeholder =
    isRent ? 'مثال: 500' : 'مثال: 150000';

  // حقول الإيجار
  document.getElementById('rentPeriodField').style.display = isRent ? 'flex' : 'none';
  document.getElementById('depositField').style.display = isRent ? 'flex' : 'none';
  document.getElementById('minDaysField').style.display =
    (isRent && !isProperty) ? 'flex' : 'none';
  document.getElementById('carInsuranceField').style.display =
    (isRent && !isProperty) ? 'flex' : 'none';

  // حقول البيع فقط للسيارة
  document.getElementById('conditionField').style.display =
    (!isRent && !isProperty) ? 'flex' : 'none';
  document.getElementById('kmField').style.display =
    (!isRent && !isProperty) ? 'flex' : 'none';

  // إخفاء كل أقسام التفاصيل أولاً
  ['residentialSection', 'landSection', 'commercialSection', 'carSection']
    .forEach(id => document.getElementById(id).style.display = 'none');

  // إعادة تعيين النوع الفرعي
  document.querySelectorAll('#subTypeGrid .subtype-card').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#brandGrid .subtype-card').forEach(b => b.classList.remove('active'));

  // إخفاء حقل الماركة المخصصة
  const otherField = document.getElementById('otherBrandField');
  if (otherField) otherField.style.display = 'none';

  if (!isProperty) {
    // للسيارة: يظهر قسم السيارة فقط
    document.getElementById('carSection').style.display = 'block';
  }

  initIcons();
}

/* ==========================================
   النوع الفرعي (للعقار) والماركة (للسيارة)
   ========================================== */
function setupSubType() {
  // النوع الفرعي للعقار
  document.querySelectorAll('#subTypeGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#subTypeGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.subType = card.dataset.subtype;
      showPropertyFields();
    });
  });

  // الماركة للسيارة
  document.querySelectorAll('#brandGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#brandGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.brand = card.dataset.brand;

      // إظهار/إخفاء حقل الماركة المخصصة
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

  // إزالة الخطأ عند الكتابة في حقل الماركة المخصصة
  document.getElementById('otherBrand')?.addEventListener('input', (e) => {
    e.target.classList.remove('error');
    const err = document.getElementById('otherBrandError');
    if (err) err.classList.remove('show');
  });
}

function showPropertyFields() {
  const subType = state.subType;
  const isRent = state.purpose === 'rent';

  // إخفاء الكل
  ['residentialSection', 'landSection', 'commercialSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  // تحديد الأقسام الظاهرة
  const residentialTypes = ['apartment', 'villa', 'arabic-house', 'chalet'];
  const landTypes = ['land'];
  const commercialTypes = ['office', 'shop'];
  const buildingTypes = ['building'];

  if (residentialTypes.includes(subType)) {
    document.getElementById('residentialSection').style.display = 'block';

    // حقول الفيلا والشاليه فقط
    const hasGardenPool = ['villa', 'chalet'].includes(subType);
    document.getElementById('gardenField').style.display = hasGardenPool ? 'flex' : 'none';
    document.getElementById('poolField').style.display = hasGardenPool ? 'flex' : 'none';

    // الفرش للإيجار فقط
    document.getElementById('furnishedField').style.display = isRent ? 'flex' : 'none';

    // تأكد من تفعيل الغرف
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
    // البناء يشبه السكني لكن بدون غرف/حمامات
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
   رفع الصور
   ========================================== */
function setupImageUpload() {
  const input = document.getElementById('imageInput');
  const uploadArea = document.getElementById('uploadArea');
  const preview = document.getElementById('imagePreview');
  if (!input) return;

  ['dragenter', 'dragover'].forEach(ev => {
    uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.remove('dragover'); });
  });

  uploadArea.addEventListener('drop', e => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });

  input.addEventListener('change', () => handleFiles(Array.from(input.files)));

  function handleFiles(files) {
    if (uploadedImages.length + files.length > 10) {
      showAlert('يمكنك اختيار حتى 10 صور فقط');
      return;
    }
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showAlert(`الصورة "${file.name}" أكبر من 5 ميجابايت`);
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        uploadedImages.push({
          id: 'img_' + Date.now() + Math.random(),
          data: e.target.result,
          name: file.name
        });
        renderPreview();
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  function renderPreview() {
    preview.innerHTML = uploadedImages.map(img => `
      <div class="al-preview-item">
        <img src="${img.data}" alt="${img.name}">
        <button type="button" class="remove" data-id="${img.id}"><i data-lucide="x"></i></button>
      </div>
    `).join('');

    preview.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedImages = uploadedImages.filter(img => img.id !== btn.dataset.id);
        renderPreview();
      });
    });
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

  // ✅ التحقق من رقم الواتساب
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

  // تحقق للنوع الفرعي (للعقار)
  if (state.type === 'property' && !state.subType) {
    showAlert('الرجاء اختيار نوع العقار');
    ok = false;
  }

  // تحقق للأرض
  if (state.subType === 'land') {
    const landArea = document.getElementById('landArea').value;
    if (!landArea || Number(landArea) <= 0) {
      showFieldError('landArea', 'الرجاء إدخال مساحة الأرض'); ok = false;
    }
  }

  // تحقق للسيارة
  if (state.type === 'car') {
    if (!state.brand) {
      showAlert('الرجاء اختيار ماركة السيارة');
      ok = false;
    }

    // تحقق من الماركة المخصصة
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

    if (!API.Users.isLoggedIn()) {
      showAlert('يجب تسجيل الدخول أولاً.');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      return;
    }

    if (!validateForm()) {
      showAlert('الرجاء تصحيح الأخطاء في النموذج');
      return;
    }

    // بناء البيانات
    const data = {
      type: state.type,
      purpose: state.purpose,
      subType: state.subType,
      title: document.getElementById('title').value.trim(),
      city: document.getElementById('city').value,
      area: document.getElementById('area').value.trim(),
      address: document.getElementById('address').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      price: document.getElementById('price').value,
      currency: document.getElementById('currency').value,
      negotiable: document.getElementById('negotiable').checked, // ✅ السعر قابل للتفاوض
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
      showStep(4);
      initIcons();
    }, 700);
  });
}

function buildDetails() {
  const details = {};

  // للعقار
  if (state.type === 'property') {
    details.subType = state.subType;

    if (state.purpose === 'rent') {
      details.rentPeriod = document.getElementById('rentPeriod').value;
      details.deposit = document.getElementById('deposit').value;
    }

    // سكني / بناء
    if (['apartment', 'villa', 'arabic-house', 'chalet', 'building'].includes(state.subType)) {
      details.propertyArea = document.getElementById('propertyArea').value;
      details.rooms = document.getElementById('rooms').value;
      details.bathrooms = document.getElementById('bathrooms').value;
      details.floor = document.getElementById('floor').value;
      
      // ✅ استبدال حقلي "إجمالي الطوابق" و "عمر البناء" بالحقلين الجديدين
      details.direction = document.getElementById('direction').value;
      details.vacancyType = document.getElementById('vacancyType').value;

      details.heating = document.getElementById('heating').value;
      
      // ✅ حقل نوع الإكساء
      details.finishingType = document.getElementById('finishingType').value;

      if (state.purpose === 'rent') {
        details.furnished = document.getElementById('furnished').value;
      }

      if (['villa', 'chalet'].includes(state.subType)) {
        details.garden = document.getElementById('garden').value;
        details.pool = document.getElementById('pool').value;
      }
    }

    // أرض
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

    // مكتب / محل
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

  // للسيارة
  if (state.type === 'car') {
    // إذا اختار "أخرى"، نأخذ الاسم اللي كتبه
    if (state.brand === 'other') {
      details.brand = 'other';
      details.brandName = document.getElementById('otherBrand').value.trim();
    } else {
      details.brand = state.brand;
      const brandNames = {
        toyota: 'تويوتا',
        hyundai: 'هيونداي',
        kia: 'كيا',
        mercedes: 'مرسيدس',
        bmw: 'BMW',
        nissan: 'نيسان',
        honda: 'هوندا',
        chevrolet: 'شيفروليه',
        ford: 'فورد'
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
  document.getElementById('imagePreview').innerHTML = '';
  document.querySelectorAll('.subtype-card').forEach(b => b.classList.remove('active'));
  state.subType = null;
  state.brand = null;
  state.customBrand = '';

  // إخفاء حقل الماركة المخصصة
  const otherField = document.getElementById('otherBrandField');
  if (otherField) otherField.style.display = 'none';
  const otherInput = document.getElementById('otherBrand');
  if (otherInput) otherInput.value = '';

  hideAlert();
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
});