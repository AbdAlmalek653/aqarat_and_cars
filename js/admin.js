/* ==========================================
   لوحة التحكم - Admin Dashboard
   ========================================== */

let currentAdmin = null;
let allListings = [];
let allUsers = [];
const ADMIN_API_BASE = '../api';
const listingStatusLabels = {
  active: 'متاح',
  pending: 'قيد المراجعة',
  rejected: 'مرفوض',
  sold: 'مباع',
  rented: 'مؤجر',
  expired: 'منتهي'
};
const roleLabels = { user: 'مستخدم', agent: 'وكيل', admin: 'أدمن', super_admin: 'أدمن عام' };

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character];
  });
}

async function adminRequest(path, options) {
  const response = await fetch(`${ADMIN_API_BASE}/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let result;
  try {
    result = await response.json();
  } catch (_) {
    throw new Error('استجابة غير صالحة من الخادم');
  }
  if (!response.ok || result.success === false) {
    throw new Error(result.error || 'حدث خطأ في الخادم');
  }
  return result;
}

function showAdminMessage(message) {
  alert(message);
}

async function updateAdminListing(id, changes) {
  try {
    await adminRequest('admin_update_listing.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    showAdminMessage('تم حفظ تعديل الإعلان');
    await loadData();
  } catch (error) {
    showAdminMessage(error.message);
  }
}

async function editAdminListing(id, currentTitle, currentPrice) {
  const title = prompt('عنوان الإعلان:', currentTitle || '');
  if (title === null) return;
  const price = prompt('السعر:', currentPrice || '0');
  if (price === null) return;
  await updateAdminListing(id, { title: title.trim(), price: price.trim() });
}

async function updateAdminUser(id, changes) {
  try {
    await adminRequest('admin_update_user.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    showAdminMessage('تم حفظ تعديل المستخدم');
    await loadData();
  } catch (error) {
    showAdminMessage(error.message);
  }
}

/* ==========================================
   التحقق من الصلاحيات
   ========================================== */
function checkAccess() {
  const user = API.Users.getCurrent();

  if (!user || !API.Users.isAdmin()) {
    document.getElementById('noAccess').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    initIcons();
    return false;
  }

  currentAdmin = user;
  document.getElementById('adminDashboard').style.display = 'grid';
  document.getElementById('adminName').textContent = user.name;
  document.getElementById('adminAvatar').textContent = (user.name || 'م').charAt(0);

  const roleEl = document.getElementById('adminRole');
  if (user.role === 'super_admin') {
    roleEl.textContent = 'أدمن عام';
    roleEl.classList.add('super');
  } else {
    roleEl.textContent = 'أدمن';
  }

  // إذا مو super_admin، اخفِ تبويب المستخدمين
  if (user.role !== 'super_admin') {
    document.getElementById('usersTabBtn').style.display = 'none';
  }

  return true;
}

/* ==========================================
   تحميل البيانات
   ========================================== */
async function loadData() {
  try {
    const [listings, users] = await Promise.all([
      adminRequest('admin_listings.php').then(function (result) {
        return (result.listings || []).map(function (listing) {
          return Object.assign({}, listing, {
            userId: listing.userId || listing.user_id,
            city: listing.city || listing.city_name,
            createdAt: listing.createdAt || listing.created_at,
            featured: listing.featured !== undefined
              ? listing.featured
              : Boolean(listing.is_featured)
          });
        });
      }),
      currentAdmin.role === 'super_admin'
        ? adminRequest('admin_users.php').then(function (result) { return result.users || []; })
        : Promise.resolve([])
    ]);

    allListings = listings || [];
    allUsers = users || [];

    renderOverview();
    renderListingsTable();
    if (currentAdmin.role === 'super_admin') renderUsersTable();
    renderReports();

  } catch (e) {
    console.error('خطأ في تحميل البيانات:', e);
  }
}

/* ==========================================
   Overview
   ========================================== */
function renderOverview() {
  const props = allListings.filter(l => l.type === 'property');
  const cars = allListings.filter(l => l.type === 'car');
  const totalViews = allListings.reduce((sum, l) => sum + (l.views || 0), 0);

  document.getElementById('statTotalProps').textContent = props.length;
  document.getElementById('statTotalCars').textContent = cars.length;
  document.getElementById('statTotalUsers').textContent = allUsers.length;
  document.getElementById('statTotalViews').textContent = totalViews.toLocaleString('en-US');

  document.getElementById('badgeListings').textContent = allListings.length;
  document.getElementById('badgeUsers').textContent = allUsers.length;

  // أحدث الإعلانات
  const recent = [...allListings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentEl = document.getElementById('recentListings');
  if (!recent.length) {
    recentEl.innerHTML = `<div class="admin-empty"><i data-lucide="inbox"></i><p>لا توجد إعلانات</p></div>`;
  } else {
    recentEl.innerHTML = recent.map(l => {
      const icon = l.type === 'property' ? 'building-2' : 'car';
      const typeText = l.type === 'property' ? 'عقار' : 'سيارة';
      return `<div class="admin-recent-item">
        <div class="admin-recent-icon"><i data-lucide="${icon}"></i></div>
        <div class="admin-recent-info">
          <div class="admin-recent-title">${l.title}</div>
          <div class="admin-recent-sub">${typeText} · ${l.city || '—'}</div>
        </div>
      </div>`;
    }).join('');
  }

  // أحدث المستخدمين
  const recentUsersEl = document.getElementById('recentUsers');
  if (currentAdmin.role === 'super_admin') {
    const recentU = [...allUsers]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (!recentU.length) {
      recentUsersEl.innerHTML = `<div class="admin-empty"><i data-lucide="users"></i><p>لا يوجد مستخدمون</p></div>`;
    } else {
      recentUsersEl.innerHTML = recentU.map(u => `
        <div class="admin-recent-item">
          <div class="admin-recent-icon"><i data-lucide="user"></i></div>
          <div class="admin-recent-info">
            <div class="admin-recent-title">${u.name}</div>
            <div class="admin-recent-sub">${u.email}</div>
          </div>
        </div>
      `).join('');
    }
  } else {
    recentUsersEl.innerHTML = `<div class="admin-empty"><i data-lucide="lock"></i><p>متاح للأدمن العام فقط</p></div>`;
  }

  initIcons();
}

/* ==========================================
   إدارة الإعلانات
   ========================================== */
function renderListingsTable() {
  const search = (document.getElementById('searchListings')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('filterType')?.value || '';
  const statusFilter = document.getElementById('filterStatus')?.value || '';

  let filtered = allListings;

  if (typeFilter) filtered = filtered.filter(l => l.type === typeFilter);
  if (statusFilter) filtered = filtered.filter(l => (l.status || 'active') === statusFilter);
  if (search) {
    filtered = filtered.filter(l =>
      (l.title || '').toLowerCase().includes(search) ||
      (l.city || '').toLowerCase().includes(search) ||
      (l.area || '').toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('listingsTable');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="admin-empty"><i data-lucide="inbox"></i><p>لا توجد إعلانات مطابقة</p></div></td></tr>`;
    initIcons();
    return;
  }

  tbody.innerHTML = filtered.map(l => {
    const typeText = l.type === 'property' ? 'عقار' : 'سيارة';
    const status = l.status || 'active';
    const statusText = listingStatusLabels[status] || status;
    const price = l.purpose === 'sale'
      ? `${Number(l.price).toLocaleString('en-US')} ${l.currency || 'USD'}`
      : `${l.price} ${l.currency || 'USD'}`;

    const seller = allUsers.find(u => u.id === l.userId);
    const sellerName = l.owner_name || (seller ? seller.name : 'مستخدم');

    const wa = l.whatsapp || (l.details && l.details._whatsapp) || '';
    const waClean = String(wa).replace(/[^0-9]/g, '');

    const title = escapeHtml(l.title);
    const listingId = escapeHtml(l.id);
    const isFeatured = Boolean(l.featured || l.is_featured);

    return `<tr>
      <td>
        <div class="admin-table-title">${title}</div>
        <div class="admin-table-sub">#${listingId}</div>
      </td>
      <td><span class="admin-tag ${l.type}">${typeText}</span></td>
      <td>${escapeHtml(price)}</td>
      <td><span class="admin-tag ${status}">${escapeHtml(statusText)}</span>${isFeatured ? '<div class="admin-table-sub">★ مميز</div>' : ''}</td>
      <td>${escapeHtml(sellerName)}</td>
      <td>
        ${waClean
        ? `<a href="https://wa.me/${waClean}" target="_blank" class="admin-icon-btn wa" title="واتساب البائع"><i data-lucide="message-circle"></i></a>`
        : `<span style="color:var(--text-muted);font-size:12px;">—</span>`
      }
      </td>
      <td>
        <div class="admin-actions">
          <a href="details.html?id=${encodeURIComponent(l.id)}&type=${encodeURIComponent(l.type)}" class="admin-icon-btn" title="عرض"><i data-lucide="eye"></i></a>
          <select class="admin-select admin-action-select" data-status-id="${listingId}" title="تغيير الحالة">
            ${Object.entries(listingStatusLabels).map(([value, label]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button class="admin-icon-btn ${isFeatured ? 'featured' : ''}" data-feature-id="${listingId}" data-featured="${isFeatured ? '1' : '0'}" title="${isFeatured ? 'إلغاء التمييز' : 'تمييز'}"><i data-lucide="star"></i></button>
          <button class="admin-icon-btn" data-edit-id="${listingId}" data-edit-title="${escapeHtml(l.title)}" data-edit-price="${escapeHtml(l.price)}" title="تعديل"><i data-lucide="pencil"></i></button>
          <button class="admin-icon-btn danger" onclick="adminDeleteListing('${listingId}')" title="حذف"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-status-id]').forEach(function (select) {
    select.addEventListener('change', function () {
      updateAdminListing(select.dataset.statusId, { status: select.value });
    });
  });
  document.querySelectorAll('[data-feature-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      updateAdminListing(button.dataset.featureId, { featured: button.dataset.featured !== '1' });
    });
  });
  document.querySelectorAll('[data-edit-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      editAdminListing(button.dataset.editId, button.dataset.editTitle, button.dataset.editPrice);
    });
  });

  initIcons();
}

window.adminDeleteListing = async function (id) {
  if (!confirm('⚠️ هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
  if (!confirm('🔴 تأكيد أخير: سيتم الحذف نهائياً بدون إمكانية الاسترجاع.')) return;

  const result = await API.Listings.delete(id);
  if (result.success) {
    allListings = allListings.filter(l => l.id !== id);
    renderOverview();
    renderListingsTable();
  } else {
    alert(result.error || 'فشل الحذف');
  }
};

/* ==========================================
   إدارة المستخدمين
   ========================================== */
function renderUsersTable() {
  if (currentAdmin.role !== 'super_admin') return;

  const search = (document.getElementById('searchUsers')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('filterRole')?.value || '';

  let filtered = allUsers;
  if (roleFilter) filtered = filtered.filter(u => (u.role || 'user') === roleFilter);
  if (search) {
    filtered = filtered.filter(u =>
      (u.name || '').toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('usersTable');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="admin-empty"><i data-lucide="users"></i><p>لا يوجد مستخدمون مطابقون</p></div></td></tr>`;
    initIcons();
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const role = u.role || 'user';
    const roleText = roleLabels[role] || role;
    const createdAt = u.createdAt || u.created_at;
    const created = createdAt ? new Date(createdAt).toLocaleDateString('ar-EG') : '—';
    const isSelf = u.id === currentAdmin.id;
    const userId = escapeHtml(u.id);
    const isActive = u.is_active !== false;

    return `<tr>
      <td><div class="admin-table-title">${escapeHtml(u.name)}</div></td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td><span class="admin-tag ${role}">${escapeHtml(roleText)}</span></td>
      <td>${created}</td>
      <td>
        <div class="admin-actions">
          ${!isSelf ? `
            <select class="admin-select admin-action-select" data-role-id="${userId}" title="تغيير الدور">
              ${Object.entries(roleLabels).map(([value, label]) => `<option value="${value}" ${role === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
            <button class="admin-icon-btn" data-active-id="${userId}" data-active="${isActive ? '1' : '0'}" title="${isActive ? 'تعطيل' : 'تفعيل'}"><i data-lucide="${isActive ? 'user-round-x' : 'user-round-check'}"></i></button>
          ` : `<span style="color:var(--text-muted);font-size:11px;">أنت</span>`}
        </div>
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-role-id]').forEach(function (select) {
    select.addEventListener('change', function () {
      updateAdminUser(select.dataset.roleId, { role: select.value });
    });
  });
  document.querySelectorAll('[data-active-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      updateAdminUser(button.dataset.activeId, { is_active: button.dataset.active !== '1' });
    });
  });

  initIcons();
}

window.adminChangeRole = async function (id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;

  const newRole = prompt(
    `تغيير دور "${user.name}"\n\nأدخل: user (مستخدم) أو admin (أدمن)`,
    user.role || 'user'
  );

  if (!newRole || !['user', 'admin'].includes(newRole)) return;

  user.role = newRole;
  const users = JSON.parse(localStorage.getItem('souq_users') || '[]');
  const idx = users.findIndex(u => u.id === id);
  if (idx > -1) {
    users[idx].role = newRole;
    localStorage.setItem('souq_users', JSON.stringify(users));
  }
  renderUsersTable();
  alert('✅ تم تحديث الدور');
};

window.adminDeleteUser = async function (id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;

  if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return;
  if (!confirm('🔴 سيتم حذف الحساب نهائياً.')) return;

  const users = JSON.parse(localStorage.getItem('souq_users') || '[]');
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem('souq_users', JSON.stringify(filtered));

  allUsers = filtered;
  renderOverview();
  renderUsersTable();
  alert('✅ تم حذف المستخدم');
};

/* ==========================================
   البلاغات
   ========================================== */
function renderReports() {
  const el = document.getElementById('reportsContent');
  if (!el) return;

  el.innerHTML = `
    <div class="admin-panel-card">
      <div class="admin-empty">
        <i data-lucide="check-circle"></i>
        <h3 style="font-size:18px;margin-bottom:8px;color:var(--text-primary);">لا توجد بلاغات حالياً</h3>
        <p>جميع الإعلانات تعمل بشكل جيد</p>
      </div>
    </div>
  `;
  initIcons();
}

/* ==========================================
   Tab Switching
   ========================================== */
window.switchAdminTab = function (tab) {
  document.querySelectorAll('.admin-menu-btn[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initIcons();
};

function setupTabs() {
  document.querySelectorAll('.admin-menu-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
  });

  document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    Promise.resolve(API.Users.logout()).finally(() => {
      window.location.href = '../index.html';
    });
  });
}

function setupFilters() {
  ['searchListings', 'filterType', 'filterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderListingsTable);
    document.getElementById(id)?.addEventListener('change', renderListingsTable);
  });

  ['searchUsers', 'filterRole'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderUsersTable);
    document.getElementById(id)?.addEventListener('change', renderUsersTable);
  });
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();

  if (!checkAccess()) return;

  setupTabs();
  setupFilters();
  await loadData();

  initIcons();
});