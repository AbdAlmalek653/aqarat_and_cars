/* صفحة إضافة إعلان - الإصدار 4.0 */

(function() {
  'use strict';

  let currentStep = 1;
  let listingType = null;
  let listingPurpose = null;
  let subType = null;
  let brand = null;
  let selectedImages = [];
  const MAX_IMAGES = 10;
  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  function goToStep(step) {
    document.querySelectorAll('.al-step').forEach(el => el.style.display = 'none');
    const target = document.getElementById('step' + step);
    if (target) target.style.display = 'block';
    document.querySelectorAll('.al-step-dot').forEach(dot => {
      const s = parseInt(dot.dataset.step, 10);
      dot.classList.remove('active', 'done');
      if (s < step) dot.classList.add('done');
      if (s === step) dot.classList.add('active');
    });
    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  }

  document.querySelectorAll('#step1 .type-choice-card[data-value]').forEach(card => {
    card.addEventListener('click', () => {
      const value = card.dataset.value;
      if (value === 'property' || value === 'car') {
        listingType = value;
        const nameEl = document.getElementById('purposeTypeName');
        if (nameEl) nameEl.textContent = value === 'property' ? 'العقار' : 'السيارة';
        goToStep(2);
      }
    });
  });

  document.querySelectorAll('#step2 .type-choice-card[data-value]').forEach(card => {
    card.addEventListener('click', () => {
      const value = card.dataset.value;
      if (value === 'sale' || value === 'rent') {
        listingPurpose = value;
        prepareForm();
        goToStep(3);
      }
    });
  });

  document.getElementById('backToStep1')?.addEventListener('click', () => goToStep(1));
  document.getElementById('backToStep2')?.addEventListener('click', () => goToStep(2));

  function prepareForm() {
    const isProperty = listingType === 'property';
    const isRent = listingPurpose === 'rent';
    document.getElementById('formTitle').textContent = isProperty ? 'أضف إعلان عقار' : 'أضف إعلان سيارة';
    document.getElementById('formSubtitle').textContent = isRent ? 'للإيجار' : 'للبيع';
    const typeIcon = document.getElementById('currentTypeIcon');
    const typeText = document.getElementById('currentTypeText');
    if (typeIcon) typeIcon.setAttribute('data-lucide', isProperty ? 'building-2' : 'car');
    if (typeText) typeText.textContent = isProperty ? 'عقار' : 'سيارة';
    document.getElementById('subTypeSection').style.display = isProperty ? 'block' : 'none';
    document.getElementById('brandSection').style.display = isProperty ? 'none' : 'block';
    document.getElementById('residentialSection').style.display = isProperty ? 'block' : 'none';
    document.getElementById('landSection').style.display = 'none';
    document.getElementById('commercialSection').style.display = 'none';
    document.getElementById('carSection').style.display = isProperty ? 'none' : 'block';
    if (isRent) {
      document.getElementById('rentPeriodField').style.display = 'block';
      document.getElementById('depositField').style.display = 'block';
      document.getElementById('furnishedField').style.display = 'block';
    } else {
      document.getElementById('rentPeriodField').style.display = 'none';
      document.getElementById('depositField').style.display = 'none';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  document.querySelectorAll('#subTypeGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#subTypeGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      subType = card.dataset.subtype;
      const residentialSection = document.getElementById('residentialSection');
      const landSection = document.getElementById('landSection');
      const commercialSection = document.getElementById('commercialSection');
      residentialSection.style.display = 'none';
      landSection.style.display = 'none';
      commercialSection.style.display = 'none';
      if (subType === 'land') landSection.style.display = 'block';
      else if (subType === 'office' || subType === 'shop') commercialSection.style.display = 'block';
      else residentialSection.style.display = 'block';
      if (subType === 'chalet' || subType === 'villa') {
        document.getElementById('gardenField').style.display = 'block';
        document.getElementById('poolField').style.display = 'block';
      } else {
        document.getElementById('gardenField').style.display = 'none';
        document.getElementById('poolField').style.display = 'none';
      }
      if (window.lucide) window.lucide.createIcons();
    });
  });

  document.querySelectorAll('#brandGrid .subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#brandGrid .subtype-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      brand = card.dataset.brand;
      const otherField = document.getElementById('otherBrandField');
      if (otherField) otherField.style.display = brand === 'other' ? 'block' : 'none';
    });
  });

  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');

  document.getElementById('selectImagesBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    imageInput.click();
  });

  uploadArea?.addEventListener('click', (e) => {
    if (e.target.closest('#selectImagesBtn')) return;
    imageInput.click();
  });

  uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });

  imageInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    imageInput.value = '';
  });

  async function handleFiles(files) {
    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining <= 0) {
      showAlert('الحد الأقصى ' + MAX_IMAGES + ' صور', 'error');
      return;
    }
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_FILE_SIZE) {
        showAlert('الصورة ' + file.name + ' كبيرة جداً', 'error');
        continue;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        selectedImages.push(dataUrl);
      } catch (err) {
        console.error('خطأ:', err);
      }
    }
    renderPreview();
    if (window.lucide) window.lucide.createIcons();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderPreview() {
    if (!imagePreview) return;
    imagePreview.innerHTML = selectedImages.map((img, i) => `
      <div class="al-preview-item">
        <img src="${img}" alt="صورة ${i + 1}" loading="lazy">
        <button type="button" class="remove" onclick="window.__removeImage(${i})">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  window.__removeImage = function(i) {
    selectedImages.splice(i, 1);
    renderPreview();
  };

  document.getElementById('addListingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const submitBtn = document.getElementById('submitBtn');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i><span>جاري النشر...</span>';
    if (window.lucide) window.lucide.createIcons();

    try {
      const currentUser = API.Users.getCurrent();
      const userPhone = currentUser ? (currentUser.phone || '') : '';
      const whatsappInput = document.getElementById('whatsapp');
      const whatsapp = whatsappInput ? whatsappInput.value.trim() : userPhone;
      const details = {};
      const fieldIds = ['propertyArea', 'rooms', 'bathrooms', 'floor', 'direction', 'vacancyType', 'heating', 'finishingType', 'furnished', 'garden', 'pool', 'landArea', 'landFrontage', 'landDepth', 'landZoning', 'landTabu', 'commercialArea', 'commercialFloor', 'commercialAge', 'model', 'year', 'condition', 'km', 'transmission', 'fuel', 'color', 'bodyType', 'carInsurance', 'minDays'];
      fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value && el.value.trim() !== '') details[id] = el.value.trim();
      });
      if (listingType === 'property' && subType) {
        details.propertyType = subType;
        details.subType = subType;
      }
      if (listingType === 'car') {
        if (brand === 'other') {
          const otherBrand = document.getElementById('otherBrand');
          if (otherBrand && otherBrand.value.trim()) {
            details.brandName = otherBrand.value.trim();
            details.brand = 'other';
          }
        } else if (brand) {
          details.brand = brand;
        }
      }
      ['landWater', 'landElectric', 'landSewage', 'landStreet', 'commElectric', 'commWater', 'commAC', 'commParking'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.checked) details[id] = true;
      });
      details._whatsapp = whatsapp;

      const data = {
        type: listingType,
        purpose: listingPurpose,
        subType: subType,
        title: document.getElementById('title').value.trim(),
        city: document.getElementById('city').value,
        area: '',
        address: '',
        whatsapp: whatsapp,
        price: Number(document.getElementById('price').value) || 0,
        currency: document.getElementById('currency').value,
        negotiable: document.getElementById('negotiable')?.value || '',
        description: document.getElementById('description').value.trim(),
        images: selectedImages,
        details: details
      };

      if (listingPurpose === 'rent') {
        const rentPeriod = document.getElementById('rentPeriod');
        const deposit = document.getElementById('deposit');
        if (rentPeriod && rentPeriod.value) details.rentPeriod = rentPeriod.value;
        if (deposit && deposit.value) details.deposit = deposit.value;
      }

      const result = await API.Listings.create(data);
      if (result.success) goToStep(4);
      else showAlert('فشل النشر: ' + (result.error || 'خطأ'), 'error');
    } catch (err) {
      console.error('خطأ:', err);
      showAlert('حدث خطأ أثناء النشر', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  function validate() {
    clearErrors();
    let valid = true;
    let firstErrorField = null;
    const title = document.getElementById('title').value.trim();
    if (!title || title.length < 5) { showFieldError('title', 'العنوان 5 أحرف على الأقل'); if (!firstErrorField) firstErrorField = 'title'; valid = false; }
    const city = document.getElementById('city').value;
    if (!city) { showFieldError('city', 'اختر المحافظة'); if (!firstErrorField) firstErrorField = 'city'; valid = false; }
    const whatsapp = document.getElementById('whatsapp').value.trim();
    if (!whatsapp || whatsapp.length < 8) { showFieldError('whatsapp', 'أدخل رقم واتساب صحيح'); if (!firstErrorField) firstErrorField = 'whatsapp'; valid = false; }
    const price = document.getElementById('price').value;
    if (!price || Number(price) <= 0) { showFieldError('price', 'أدخل سعراً صحيحاً'); if (!firstErrorField) firstErrorField = 'price'; valid = false; }
    const desc = document.getElementById('description').value.trim();
    if (!desc || desc.length < 30) { showFieldError('description', 'الوصف 30 حرفاً على الأقل'); if (!firstErrorField) firstErrorField = 'description'; valid = false; }
    if (listingType === 'property' && !subType) { showAlert('اختر نوع العقار', 'error'); valid = false; }
    if (listingType === 'car' && !brand) { showAlert('اختر ماركة السيارة', 'error'); valid = false; }
    if (selectedImages.length === 0) { showAlert('أضف صورة واحدة على الأقل', 'error'); valid = false; }
    if (!valid && firstErrorField) {
      const el = document.getElementById(firstErrorField);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
    }
    return valid;
  }

  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (field) field.classList.add('error');
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
  }

  function clearErrors() {
    document.querySelectorAll('.al-field .error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-msg.show').forEach(el => el.classList.remove('show'));
    const alertEl = document.getElementById('alAlert');
    if (alertEl) alertEl.style.display = 'none';
  }

  function showAlert(message, type = 'error') {
    const alertEl = document.getElementById('alAlert');
    const alertText = document.getElementById('alAlertText');
    if (!alertEl || !alertText) return;
    alertText.textContent = message;
    alertEl.className = 'al-alert ' + type;
    alertEl.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  document.getElementById('cancelBtn')?.addEventListener('click', () => {
    if (confirm('هل تريد إلغاء الإعلان؟')) window.location.href = '../index.html';
  });

  document.getElementById('addAnotherBtn')?.addEventListener('click', () => {
    selectedImages = [];
    listingType = null;
    listingPurpose = null;
    subType = null;
    brand = null;
    document.getElementById('addListingForm')?.reset();
    if (imagePreview) imagePreview.innerHTML = '';
    ['subTypeSection', 'brandSection', 'residentialSection', 'landSection', 'commercialSection', 'carSection', 'gardenField', 'poolField', 'rentPeriodField', 'depositField', 'furnishedField'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.subtype-card').forEach(c => c.classList.remove('active'));
    goToStep(1);
  });

  document.querySelectorAll('.al-field input, .al-field select, .al-field textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const errorEl = document.getElementById(el.id + 'Error');
      if (errorEl) errorEl.classList.remove('show');
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();
  });

})();