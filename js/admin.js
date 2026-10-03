/* ==========================================
   لوحة التحكم - Admin Dashboard V4.0
   ========================================== */

let currentAdmin = null;
let allListings = [];
let allUsers = [];
let statsCache = null;

const ADMIN_API_BASE = '../api';
const listingStatusLabels = {
  active: 'متاح', pending: 'قيد المراجعة', rejected: 'مرفوض',
  sold: 'مباع', rented: 'مؤجر', expired: 'منتهي'
};
const roleLabels = { user: 'مستخدم', agent: 'وكيل', admin: 'أدمن', super_admin: 'أدمن عام' };

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character];
  });
}

async function adminRequest(path, options) {
  try {
    const response = await fetch(`${ADMIN_API_BASE}/${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`الخادم أرجع استجابة غير صالحة (${response.status})`);
    }
    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.error || `خطأ في الخادم (${response.status})`);
    }
    return result;
  } catch (error) {
    console.error(`❌ فشل الطلب ${path}:`, error);
    throw error;
  }
}

/* ==========================================
   التحقق من الصلاحيات
   ========================================== */
async function checkAccess() {
  const dashboardEl = document.getElementById('dashboardContent');
  const noAccessEl = document.getElementById('accessDenied');

  if (!dashboardEl || !noAccessEl) return false;

  try {
    const localUser = API.Users.getCurrent();
    if (!localUser || !API.Users.isAdmin()) {
      noAccessEl.hidden = false;
      dashboardEl.hidden = true;
      initIcons();
      return false;
    }

    dashboardEl.hidden = false;
    noAccessEl.hidden = true;

    // ✅ forceRefresh = true
    const serverUser = await API.Users.validateSession(true);

    if (!serverUser) {
      window.location.href = 'login.html';
      return false;
    }

    currentAdmin = serverUser;
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) {
      welcomeEl.textContent = serverUser.role === 'super_admin'
        ? 'لوحة السوبر أدمن'
        : 'لوحة التحكم';
    }

    return true;
  } catch (e) {
    console.error('❌ خطأ في checkAccess:', e);
    return false;
  }
}

/* ==========================================
   تحميل البيانات
   ========================================== */
async function loadData() {
  try {
    console.log('⏳ جاري جلب البيانات...');
    const startTime = performance.now();

    const listingsResult = await adminRequest('admin_listings.php');
    const usersResult = (currentAdmin && currentAdmin.role === 'super_admin')
      ? await adminRequest('admin_users.php')
      : { success: true };

    let rawListings = listingsResult.listings || listingsResult.data || listingsResult.items || [];
    if (!Array.isArray(rawListings)) rawListings = [];

    let rawUsers = usersResult.users || usersResult.data || usersResult.items || [];
    if (!Array.isArray(rawUsers)) rawUsers = [];

    allListings = rawListings.map(function (listing) {
      return Object.assign({}, listing, {
        userId: listing.userId || listing.user_id,
        city: listing.city || listing.city_name,
        createdAt: listing.createdAt || listing.created_at,
        featured: listing.featured !== undefined ? listing.featured : Boolean(listing.is_featured)
      });
    });

    allUsers = rawUsers;
    prepareStats();

    const endTime = performance.now();
    console.log(`✅ تم جلب ${allListings.length} إعلان و ${allUsers.length} مستخدم في ${(endTime - startTime).toFixed(2)}ms`);

    renderStats();
    renderListingsTable();
    if (currentAdmin.role === 'super_admin') renderUsersTable();

  } catch (e) {
    console.error('❌ خطأ في تحميل البيانات:', e);
  }
}

/* ==========================================
   تجهيز الإحصائيات
   ========================================== */
function prepareStats() {
  let propsCount = 0;
  let carsCount = 0;
  let totalViews = 0;

  allListings.forEach(l => {
    if (l.type === 'property') propsCount++;
    else if (l.type === 'car') carsCount++;
    totalViews += (l.views || 0);
  });

  statsCache = {
    totalProps: propsCount,
    totalCars: carsCount,
    totalViews: totalViews,
    totalListings: allListings.length,
    totalUsers: allUsers.length
  };
}

/* ==========================================
   عرض الإحصائيات
   ========================================== */
function renderStats() {
  if (!statsCache) prepareStats();
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('statTotalProps', statsCache.totalProps);
  setEl('statTotalCars', statsCache.totalCars);
  setEl('statTotalUsers', statsCache.totalUsers);
  setEl('statTotalViews', statsCache.totalViews.toLocaleString('en-US'));
}

/* ==========================================
   إدارة الإعلانات
   ========================================== */
function renderListingsTable() {
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  let filtered = allListings;
  if (statusFilter) filtered = filtered.filter(l => (l.status || 'active') === statusFilter);

  const tbody = document.getElementById('listingsTable');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">لا توجد إعلانات مطابقة</td></tr>`;
    initIcons();
    return;
  }

  const displayListings = filtered.slice(0, 200);

  tbody.innerHTML = displayListings.map(l => {
    const typeText = l.type === 'property' ? 'عقار' : 'سيارة';
    const status = l.status || 'active';
    const statusText = listingStatusLabels[status] || status;
    const price = l.purpose === 'sale'
      ? `${Number(l.price).toLocaleString('en-US')} ${l.currency || 'USD'}`
      : `${l.price} ${l.currency || 'USD'}`;

    const seller = allUsers.find(u => u.id === l.userId);
    const sellerName = l.owner_name || (seller ? seller.name : 'مستخدم');
    const title = escapeHtml(l.title);
    const listingId = escapeHtml(l.id);

    return `<tr>
      <td>
        <div class="listing-cell">
          <div class="listing-title">${title}</div>
          <div class="listing-id">#${listingId}</div>
        </div>
      </td>
      <td><span class="seller-name">${escapeHtml(sellerName)}</span></td>
      <td><span class="badge badge-${l.type}">${typeText}</span></td>
      <td><span class="price-tag">${escapeHtml(price)}</span></td>
      <td>
        <select class="admin-select" data-status-id="${listingId}" style="min-width:130px;padding:6px 28px 6px 10px;font-size:12px;">
          ${Object.entries(listingStatusLabels).map(([value, label]) =>
            `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`
          ).join('')}
        </select>
      </td>
      <td>
        <div class="actions-cell">
          <a href="details.html?id=${encodeURIComponent(l.id)}&type=${encodeURIComponent(l.type)}" class="icon-btn" title="عرض" target="_blank">
            <i data-lucide="eye"></i>
          </a>
          <button class="icon-btn" onclick="editAdminListing('${listingId}', '${escapeHtml(l.title)}', '${escapeHtml(l.price)}')" title="تعديل">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn danger" onclick="adminDeleteListing('${listingId}')" title="حذف">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-status-id]').forEach(select => {
    select.addEventListener('change', function () {
      updateAdminListing(select.dataset.statusId, { status: select.value });
    });
  });

  initIcons();
}

async function updateAdminListing(id, changes) {
  try {
    await adminRequest('admin_update_listing.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    const index = allListings.findIndex(l => l.id === id);
    if (index > -1) {
      Object.assign(allListings[index], changes);
      statsCache = null;
    }
    prepareStats();
    renderStats();
    renderListingsTable();
    showToast('✅ تم حفظ التعديل بنجاح');
  } catch (error) {
    showToast('❌ فشل التعديل: ' + error.message);
  }
}

window.editAdminListing = async function (id, currentTitle, currentPrice) {
  const newTitle = prompt('عنوان الإعلان:', currentTitle || '');
  if (newTitle === null) return;
  const newPrice = prompt('السعر:', currentPrice || '0');
  if (newPrice === null) return;
  await updateAdminListing(id, { title: newTitle.trim(), price: newPrice.trim() });
};

window.adminDeleteListing = async function (id) {
  if (!confirm('⚠️ هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
  if (!confirm('🔴 تأكيد أخير: سيتم الحذف نهائياً بدون إمكانية الاسترجاع.')) return;

  const result = await API.Listings.delete(id);
  if (result.success) {
    allListings = allListings.filter(l => l.id !== id);
    statsCache = null;
    prepareStats();
    renderStats();
    renderListingsTable();
    showToast('✅ تم الحذف بنجاح');
  } else {
    showToast(result.error || 'فشل الحذف');
  }
};

/* ==========================================
   إدارة المستخدمين
   ========================================== */
function renderUsersTable() {
  if (!currentAdmin || currentAdmin.role !== 'super_admin') return;

  const tbody = document.getElementById('usersTable');
  if (!tbody) return;

  if (!allUsers.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">لا يوجد مستخدمون</td></tr>`;
    initIcons();
    return;
  }

  const displayUsers = allUsers.slice(0, 200);

  tbody.innerHTML = displayUsers.map(u => {
    const role = u.role || 'user';
    const roleText = roleLabels[role] || role;
    const isSelf = u.id === currentAdmin.id;
    const userId = escapeHtml(u.id);
    const isActive = u.is_active !== false;

    return `<tr>
      <td><div class="listing-title">${escapeHtml(u.name)}</div></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge badge-${role}">${escapeHtml(roleText)}</span></td>
      <td>${allListings.filter(l => l.userId === u.id).length}</td>
      <td>
        <span class="badge badge-${isActive ? 'active' : 'rejected'}">
          ${isActive ? 'نشط' : 'معطل'}
        </span>
      </td>
      <td>
        <div class="actions-cell">
          ${!isSelf ? `
            <select class="admin-select" data-role-id="${userId}" style="min-width:120px;padding:6px 28px 6px 10px;font-size:12px;">
              ${Object.entries(roleLabels).map(([value, label]) =>
                `<option value="${value}" ${role === value ? 'selected' : ''}>${label}</option>`
              ).join('')}
            </select>
            <button class="icon-btn ${isActive ? '' : 'danger'}" data-active-id="${userId}" data-active="${isActive ? '1' : '0'}" title="${isActive ? 'تعطيل' : 'تفعيل'}">
              <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i>
            </button>
            <button class="icon-btn danger" onclick="adminDeleteUser('${userId}')" title="حذف">
              <i data-lucide="trash-2"></i>
            </button>
          ` : `<span style="color:var(--text-muted);font-size:11px;">أنت</span>`}
        </div>
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-role-id]').forEach(select => {
    select.addEventListener('change', function () {
      updateAdminUser(select.dataset.roleId, { role: select.value });
    });
  });
  document.querySelectorAll('[data-active-id]').forEach(button => {
    button.addEventListener('click', function () {
      updateAdminUser(button.dataset.activeId, { is_active: button.dataset.active !== '1' });
    });
  });

  initIcons();
}

async function updateAdminUser(id, changes) {
  try {
    await adminRequest('admin_update_user.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    showToast('✅ تم حفظ التعديل');
    await loadData();
  } catch (error) {
    showToast('❌ ' + error.message);
  }
}

window.adminDeleteUser = async function (id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;
  if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return;
  if (!confirm('🔴 سيتم حذف الحساب نهائياً.')) return;

  try {
    const result = await adminRequest('admin_delete_user.php', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (result.success) {
      allUsers = allUsers.filter(u => u.id !== id);
      statsCache = null;
      prepareStats();
      renderStats();
      renderUsersTable();
      showToast('✅ تم حذف المستخدم');
    } else {
      showToast(result.error || 'فشل الحذف');
    }
  } catch (error) {
    showToast('❌ حدث خطأ في الخادم');
  }
};

/* ==========================================
   Toast
   ========================================== */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === 'success'
    ? 'linear-gradient(135deg, #10B981, #059669)'
    : 'linear-gradient(135deg, #EF4444, #DC2626)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 بدء تشغيل لوحة التحكم...');
  initIcons();

  if (typeof API === 'undefined') {
    console.error('❌ خطأ قاتل: ملف api.js لم يتم تحميله!');
    return;
  }

  const hasAccess = await checkAccess();
  if (!hasAccess) return;

  document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    Promise.resolve(API.Users.logout()).finally(() => {
      window.location.href = '../index.html';
    });
  });

  document.getElementById('refreshBtn')?.addEventListener('click', async () => {
    showToast('🔄 جاري تحديث البيانات...');
    await loadData();
    showToast('✅ تم التحديث');
  });

  document.getElementById('statusFilter')?.addEventListener('change', renderListingsTable);

  initListingIdSearch();

  await loadData();
  initIcons();
  console.log('✅ اكتمل التشغيل');

  // ✅ مراقبة الجلسة كل 5 دقائق
  setInterval(async () => {
    const user = await API.Users.validateSession(true);
    if (!user) window.location.href = 'login.html';
  }, 5 * 60 * 1000);
});

/* ==========================================
   البحث برقم الإعلان
   ========================================== */
function initListingIdSearch() {
  const searchInput = document.getElementById('listingIdSearch');
  const searchBtn = document.getElementById('listingIdSearchBtn');
  const resultBox = document.getElementById('listingSearchResult');

  if (!searchInput || !searchBtn || !resultBox) return;

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
  });

  async function performSearch() {
    let id = searchInput.value.trim();
    if (!id) { showError('الرجاء إدخال رقم الإعلان'); return; }
    if (!id.startsWith('L') && !id.startsWith('l')) id = 'L' + id;
    id = id.replace(/^l/i, 'L');

    showLoading();

    try {
      const response = await fetch(`../api/listing.php?id=${encodeURIComponent(id)}`);
      if (!response.ok) {
        if (response.status === 404) { showNotFound(id); return; }
        throw new Error('فشل الاتصال: ' + response.status);
      }
      const data = await response.json();
      const listing = data.listing || data.data || data;
      if (!listing || (!listing.id && !listing.title)) { showNotFound(id); return; }
      showResult(listing);
    } catch (err) {
      console.error('❌', err);
      showError('حدث خطأ أثناء البحث');
    }
  }

  function showLoading() {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div style="text-align:center;padding:20px;color:#93C5FD;font-weight:700;">جاري البحث...</div>`;
  }

  function showNotFound(id) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div style="text-align:center;padding:20px;color:#F87171;">❌ لا يوجد إعلان بالرقم: <code>${id}</code></div>`;
  }

  function showError(msg) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div style="text-align:center;padding:20px;color:#F87171;">⚠️ ${msg}</div>`;
  }

  function showResult(listing) {
    const id = listing.id || '';
    const title = escapeHtml(listing.title || 'بدون عنوان');
    const type = listing.type === 'car' ? 'سيارة' : 'عقار';
    const purpose = listing.purpose === 'sale' ? 'للبيع' : 'للإيجار';
    const city = listing.city || '';
    const price = listing.price ? Number(listing.price).toLocaleString('en-US') + ' ' + (listing.currency || 'USD') : '—';
    const detailsUrl = `../pages/details.html?id=${encodeURIComponent(id)}&type=${listing.type || 'property'}`;

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="padding:16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;">
        <div style="color:#34D399;font-weight:800;margin-bottom:12px;">✅ تم العثور على الإعلان</div>
        <div style="font-size:15px;font-weight:700;color:#F8FAFC;margin-bottom:8px;">${title}</div>
        <div style="font-size:13px;color:#94A3B8;margin-bottom:12px;">
          ${type} • ${purpose} • ${price}${city ? ' • ' + escapeHtml(city) : ''}
        </div>
        <div style="font-size:11.5px;color:#64748B;margin-bottom:14px;font-family:monospace;direction:ltr;">ID: ${escapeHtml(id)}</div>
        <a href="${detailsUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:linear-gradient(135deg,#3B82F6,#2563EB);color:white;border-radius:9px;text-decoration:none;font-weight:700;font-size:13px;">
          👁️ عرض الإعلان
        </a>
      </div>
    `;
  }
}