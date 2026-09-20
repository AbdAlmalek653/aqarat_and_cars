/* ==========================================
   لوحة التحكم - Admin Dashboard
   ========================================== */

let currentAdmin = null;
let allListings = [];
let allUsers = [];

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

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
      API.Listings.getAll(),
      currentAdmin.role === 'super_admin' ? API.Users.getAll() : Promise.resolve([])
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
    const statusText = { active: 'متاح', sold: 'مباع', rented: 'مؤجر' }[l.status || 'active'];
    const price = l.purpose === 'sale'
      ? `${Number(l.price).toLocaleString('en-US')} ${l.currency || 'USD'}`
      : `${l.price} ${l.currency || 'USD'}`;

    const seller = allUsers.find(u => u.id === l.userId);
    const sellerName = seller ? seller.name : 'مستخدم';

    const wa = l.whatsapp || (l.details && l.details._whatsapp) || '';
    const waClean = String(wa).replace(/[^0-9]/g, '');

    return `<tr>
      <td>
        <div class="admin-table-title">${l.title}</div>
        <div class="admin-table-sub">#${l.id}</div>
      </td>
      <td><span class="admin-tag ${l.type}">${typeText}</span></td>
      <td>${price}</td>
      <td><span class="admin-tag ${l.status || 'active'}">${statusText}</span></td>
      <td>${sellerName}</td>
      <td>
        ${waClean
          ? `<a href="https://wa.me/${waClean}" target="_blank" class="admin-icon-btn wa" title="واتساب البائع"><i data-lucide="message-circle"></i></a>`
          : `<span style="color:var(--text-muted);font-size:12px;">—</span>`
        }
      </td>
      <td>
        <div class="admin-actions">
          <a href="details.html?id=${l.id}&type=${l.type}" class="admin-icon-btn" title="عرض"><i data-lucide="eye"></i></a>
          <button class="admin-icon-btn danger" onclick="adminDeleteListing('${l.id}')" title="حذف"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  initIcons();
}

window.adminDeleteListing = async function(id) {
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
    const roleText = { user: 'مستخدم', admin: 'أدمن', super_admin: 'أدمن عام' }[role];
    const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '—';
    const isSelf = u.id === currentAdmin.id;

    return `<tr>
      <td><div class="admin-table-title">${u.name}</div></td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td><span class="admin-tag ${role}">${roleText}</span></td>
      <td>${created}</td>
      <td>
        <div class="admin-actions">
          ${!isSelf ? `
            <button class="admin-icon-btn" onclick="adminChangeRole('${u.id}')" title="تغيير الدور"><i data-lucide="shield"></i></button>
            <button class="admin-icon-btn danger" onclick="adminDeleteUser('${u.id}')" title="حذف"><i data-lucide="trash-2"></i></button>
          ` : `<span style="color:var(--text-muted);font-size:11px;">أنت</span>`}
        </div>
      </td>
    </tr>`;
  }).join('');

  initIcons();
}

window.adminChangeRole = async function(id) {
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

window.adminDeleteUser = async function(id) {
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
window.switchAdminTab = function(tab) {
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
    API.Users.logout();
    window.location.href = '../index.html';
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