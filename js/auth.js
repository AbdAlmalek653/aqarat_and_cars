/* ==========================================
   منطق صفحات المصادقة
   ========================================== */

/* ==========================================
   ✅ حفظ الجلسة: إذا المستخدم مسجل، وجّهه للرئيسية فوراً
   ========================================== */
(function() {
  function checkLoggedIn() {
    // انتظر حتى يتم تحميل api.js
    if (!window.API || !API.Users) {
      setTimeout(checkLoggedIn, 50);
      return;
    }

    // إذا المستخدم مسجل دخول → وجهه للصفحة الرئيسية
    if (API.Users.isLoggedIn && API.Users.isLoggedIn()) {
      const isInPages = window.location.pathname.includes('/pages/');
      const target = isInPages ? '../index.html' : 'index.html';
      window.location.replace(target);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoggedIn);
  } else {
    checkLoggedIn();
  }
})();

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

  emailInput?.addEventListener('input', () => clearFieldError('email'));
  passwordInput?.addEventListener('input', () => clearFieldError('password'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let hasError = false;

    if (!email) {
      showFieldError('email', 'الرجاء إدخال البريد الإلكتروني');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'البريد الإلكتروني غير صحيح');
      hasError = true;
    }

    if (!password) {
      showFieldError('password', 'الرجاء إدخال كلمة المرور');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i><span>جاري التحقق...</span>`;
    initIcons();

    // ✅ فحص أن api.js محمّل
    if (typeof API === 'undefined' || !API.Users) {
      setTimeout(() => {
        showAlert('❌ خطأ تقني: ملف api.js لم يُحمَّل.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in"></i><span>تسجيل الدخول</span>`;
        initIcons();
      }, 300);
      return;
    }

    setTimeout(async () => {
      try {
        const result = await API.Users.login(email, password);

        if (!result.success) {
          showAlert(result.error || 'حدث خطأ');
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="log-in"></i><span>تسجيل الدخول</span>`;
          initIcons();
          return;
        }

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
          const redirect = sessionStorage.getItem('souq_redirect_after_login');
          if (redirect) {
            sessionStorage.removeItem('souq_redirect_after_login');
            window.location.href = redirect;
          } else {
            window.location.href = '../index.html';
          }
        }, 900);

      } catch (err) {
        console.error('خطأ في تسجيل الدخول:', err);
        showAlert('حدث خطأ غير متوقع: ' + (err && err.message ? err.message : err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in"></i><span>تسجيل الدخول</span>`;
        initIcons();
      }
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

    if (!name) {
      showFieldError('name', 'الرجاء إدخال الاسم');
      hasError = true;
    } else if (name.length < 3) {
      showFieldError('name', 'الاسم قصير جداً');
      hasError = true;
    }

    if (!email) {
      showFieldError('email', 'الرجاء إدخال البريد الإلكتروني');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'البريد الإلكتروني غير صحيح');
      hasError = true;
    }

    if (!phone) {
      showFieldError('phone', 'الرجاء إدخال رقم الهاتف');
      hasError = true;
    } else if (!/^[0-9+\s-]{8,15}$/.test(phone)) {
      showFieldError('phone', 'رقم الهاتف غير صحيح');
      hasError = true;
    }

    if (!password) {
      showFieldError('password', 'الرجاء إدخال كلمة المرور');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      hasError = true;
    }

    if (!confirm) {
      showFieldError('confirmPassword', 'الرجاء تأكيد كلمة المرور');
      hasError = true;
    } else if (password !== confirm) {
      showFieldError('confirmPassword', 'كلمتا المرور غير متطابقتين');
      hasError = true;
    }

    if (!termsCheck.checked) {
      showAlert('يجب الموافقة على الشروط والأحكام');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i><span>جاري إنشاء الحساب...</span>`;
    initIcons();

    // ✅ فحص أن api.js محمّل
    if (typeof API === 'undefined' || !API.Users) {
      setTimeout(() => {
        showAlert('❌ خطأ تقني: ملف api.js لم يُحمَّل.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="user-plus"></i><span>إنشاء الحساب</span>`;
        initIcons();
      }, 300);
      return;
    }

    setTimeout(async () => {
      try {
        const result = await API.Users.create({ name, email, phone, password });

        if (!result.success) {
          showAlert(result.error || 'حدث خطأ أثناء إنشاء الحساب');
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="user-plus"></i><span>إنشاء الحساب</span>`;
          initIcons();
          return;
        }

        // تسجيل الدخول تلقائياً (API يتكفل بحفظ الجلسة)
        await API.Users.login(email, password);
        showAlert('تم إنشاء حسابك بنجاح! جاري التحويل...', 'success');

        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1000);

      } catch (err) {
        console.error('خطأ في إنشاء الحساب:', err);
        showAlert('حدث خطأ غير متوقع: ' + (err && err.message ? err.message : err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="user-plus"></i><span>إنشاء الحساب</span>`;
        initIcons();
      }
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