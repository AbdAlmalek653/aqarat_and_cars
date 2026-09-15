/* ==========================================
   منطق صفحات المصادقة
   ========================================== */

/* ===== تهيئة الأيقونات ===== */
function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/* ===== إظهار / إخفاء كلمة المرور ===== */
function setupPasswordToggle() {
  const toggle = document.getElementById('togglePassword');
  const input = document.getElementById('password');
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    // تغيير الأيقونة
    toggle.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
    initIcons();
  });
}

/* ===== التحقق من البريد الإلكتروني ===== */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/* ===== إظهار رسالة خطأ في الحقل ===== */
function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const input = document.getElementById(fieldId);

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }

  if (input) {
    const wrapper = input.closest('.field-input');
    if (wrapper) wrapper.classList.add('error');
  }
}

/* ===== إزالة رسالة الخطأ ===== */
function clearFieldError(fieldId) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const input = document.getElementById(fieldId);

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }

  if (input) {
    const wrapper = input.closest('.field-input');
    if (wrapper) wrapper.classList.remove('error');
  }
}

/* ===== إظهار التنبيه العام ===== */
function showAlert(message, type = 'error') {
  const alert = document.getElementById('authError');
  const text = document.getElementById('authErrorText');
  if (!alert || !text) return;

  text.textContent = message;
  alert.className = 'auth-alert ' + type;
  alert.style.display = 'flex';

  const icon = alert.querySelector('svg') || alert.querySelector('i');
  if (icon) {
    icon.outerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle-2'}"></i>`;
    initIcons();
  }
}

/* ===== إخفاء التنبيه ===== */
function hideAlert() {
  const alert = document.getElementById('authError');
  if (alert) alert.style.display = 'none';
}

/* ==========================================
   نموذج تسجيل الدخول
   ========================================== */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheck = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('loginBtn');

  // ==========================================
  // ✅ تحميل البيانات المحفوظة (إن وجدت)
  // ==========================================
  const remembered = localStorage.getItem('souq_remembered_user');
  if (remembered) {
    try {
      const data = JSON.parse(remembered);
      if (data.email && emailInput) emailInput.value = data.email;
      if (data.password && passwordInput) passwordInput.value = data.password;
      if (rememberCheck) rememberCheck.checked = true;
    } catch (e) {
      console.error('خطأ في تحميل البيانات المحفوظة:', e);
      localStorage.removeItem('souq_remembered_user');
    }
  }

  // إزالة الخطأ عند الكتابة
  emailInput?.addEventListener('input', () => clearFieldError('email'));
  passwordInput?.addEventListener('input', () => clearFieldError('password'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let hasError = false;

    // التحقق من البريد
    if (!email) {
      showFieldError('email', 'الرجاء إدخال البريد الإلكتروني');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'البريد الإلكتروني غير صحيح');
      hasError = true;
    }

    // التحقق من كلمة المرور
    if (!password) {
      showFieldError('password', 'الرجاء إدخال كلمة المرور');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      hasError = true;
    }

    if (hasError) return;

    // إرسال
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i><span>جاري التحقق...</span>`;
    initIcons();

    setTimeout(async () => {
      const result = await API.Users.login(email, password);

      if (!result.success) {
        showAlert(result.error || 'حدث خطأ');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in"></i><span>تسجيل الدخول</span>`;
        initIcons();
        return;
      }

      // ==========================================
      // ✅ حفظ أو حذف بيانات "تذكرني"
      // ==========================================
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem('souq_remembered_user', JSON.stringify({
          email: email,
          password: password
        }));
      } else {
        localStorage.removeItem('souq_remembered_user');
      }

      showAlert('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');

      setTimeout(() => {
        // ✅ الرجوع للصفحة الأصلية إن وجدت
        const redirect = sessionStorage.getItem('souq_redirect_after_login');
        if (redirect) {
          sessionStorage.removeItem('souq_redirect_after_login');
          window.location.href = redirect;
        } else {
          window.location.href = 'account.html';
        }
      }, 900);

    }, 700);
  });
}

/* ==========================================
   نموذج إنشاء حساب
   ========================================== */
function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const termsCheck = document.getElementById('terms');
  const submitBtn = document.getElementById('registerBtn');

  // إزالة الأخطاء عند الكتابة
  ['name', 'email', 'phone', 'password', 'confirmPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => clearFieldError(id));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    let hasError = false;

    // الاسم
    if (!name) {
      showFieldError('name', 'الرجاء إدخال الاسم');
      hasError = true;
    } else if (name.length < 3) {
      showFieldError('name', 'الاسم قصير جداً');
      hasError = true;
    }

    // البريد
    if (!email) {
      showFieldError('email', 'الرجاء إدخال البريد الإلكتروني');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'البريد الإلكتروني غير صحيح');
      hasError = true;
    }

    // الهاتف
    if (!phone) {
      showFieldError('phone', 'الرجاء إدخال رقم الهاتف');
      hasError = true;
    } else if (!/^[0-9+\s-]{8,15}$/.test(phone)) {
      showFieldError('phone', 'رقم الهاتف غير صحيح');
      hasError = true;
    }

    // كلمة المرور
    if (!password) {
      showFieldError('password', 'الرجاء إدخال كلمة المرور');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      hasError = true;
    }

    // تأكيد كلمة المرور
    if (!confirm) {
      showFieldError('confirmPassword', 'الرجاء تأكيد كلمة المرور');
      hasError = true;
    } else if (password !== confirm) {
      showFieldError('confirmPassword', 'كلمتا المرور غير متطابقتين');
      hasError = true;
    }

    // الشروط
    if (!termsCheck.checked) {
      showAlert('يجب الموافقة على الشروط والأحكام');
      hasError = true;
    }

    if (hasError) return;

    // إرسال
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i><span>جاري إنشاء الحساب...</span>`;
    initIcons();

    setTimeout(async () => {
      const result = await API.Users.create({ name, email, phone, password });

      if (!result.success) {
        showAlert(result.error || 'حدث خطأ أثناء إنشاء الحساب');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="user-plus"></i><span>إنشاء الحساب</span>`;
        initIcons();
        return;
      }

      // تسجيل الدخول تلقائياً
      await API.Users.login(email, password);
      showAlert('تم إنشاء حسابك بنجاح! جاري التحويل...', 'success');

      setTimeout(() => {
        window.location.href = 'account.html';
      }, 1000);

    }, 700);
  });
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupPasswordToggle();
  setupLoginForm();
  setupRegisterForm();
});