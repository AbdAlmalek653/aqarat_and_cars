const AdminDashboard = (() => {
  const requiredRole = document.body.dataset.dashboardRole || 'admin';
  const API_BASE = '../api';
  const statusLabels = {active:'نشط', pending:'قيد المراجعة', rejected:'مرفوض', sold:'مباع', rented:'مؤجر', expired:'منتهي'};
  const roleLabels = {user:'مستخدم', agent:'وكيل', admin:'أدمن', super_admin:'سوبر أدمن'};
  const iconNames = {users:'users', listings:'layout-list', pending:'clock-3', active:'check-circle-2', featured:'star'};

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}/${path}`, {credentials:'include', headers:{'Content-Type':'application/json'}, ...options});
    let data;
    try { data = await response.json(); } catch (_) { throw new Error('استجابة غير صالحة من الخادم'); }
    if (!response.ok || data.success === false) throw new Error(data.error || 'حدث خطأ في الخادم');
    return data;
  }

  function showToast(message, error = false) {
    const toast = $('toast');
    toast.textContent = message;
    toast.style.borderColor = error ? 'rgba(239,68,68,.5)' : 'rgba(16,185,129,.45)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function initIcons() { if (window.lucide) window.lucide.createIcons(); }

  async function checkAccess() {
    try {
      const result = await request('me.php');
      const user = result.user;
      const allowed = requiredRole === 'super_admin'
        ? user.role === 'super_admin'
        : ['admin', 'super_admin'].includes(user.role);
      if (!allowed) throw new Error('ليس لديك صلاحية الدخول إلى هذه الصفحة');
      $('dashboardContent').hidden = false;
      $('welcomeName').textContent = `مرحباً، ${user.name}`;
      document.querySelectorAll('.super-only').forEach(el => { el.hidden = requiredRole !== 'super_admin'; });
      if (requiredRole === 'super_admin' && $('dashboardTitle')) $('dashboardTitle').textContent = 'السوبر أدمن';
      await refreshAll();
    } catch (error) {
      $('accessDenied').hidden = false;
      showToast(error.message, true);
    }
  }

  async function loadStats() {
    const {stats} = await request('admin_stats.php');
    const cards = [
      ['users', 'المستخدمون', stats.users],
      ['listings', 'كل الإعلانات', stats.listings],
      ['pending', 'قيد المراجعة', stats.pending],
      ['active', 'الإعلانات النشطة', stats.active],
      ['featured', 'إعلانات مميزة', stats.featured]
    ];
    $('statsGrid').innerHTML = cards.map(([key, label, value]) => `<div class="stat-card"><div class="stat-icon"><i data-lucide="${iconNames[key]}"></i></div><div><div class="stat-value">${Number(value).toLocaleString('ar')}</div><div class="stat-label">${label}</div></div></div>`).join('');
    initIcons();
  }

  function statusClass(status) { return status === 'active' ? 'status-active' : status === 'pending' ? 'status-pending' : status === 'rejected' ? 'status-rejected' : 'status-other'; }

  async function loadListings() {
    const status = $('statusFilter').value;
    const {listings} = await request(`admin_listings.php${status ? `?status=${encodeURIComponent(status)}` : ''}`);
    $('listingsTable').innerHTML = listings.length ? listings.map(listing => {
      const statusOptions = Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${listing.status === value ? 'selected' : ''}>${label}</option>`).join('');
      return `<tr><td><span class="listing-name">${escapeHtml(listing.title)}</span><span class="listing-sub">${escapeHtml(listing.city_name || '—')} · ${escapeHtml(listing.id)}</span></td><td>${escapeHtml(listing.owner_name || '—')}<span class="listing-sub">${escapeHtml(listing.owner_email || '')}</span></td><td>${listing.type === 'car' ? 'سيارة' : 'عقار'}</td><td>${Number(listing.price).toLocaleString('en-US')} ${escapeHtml(listing.currency)}</td><td><span class="status-pill ${statusClass(listing.status)}">${statusLabels[listing.status] || listing.status}</span>${listing.is_featured ? '<span class="listing-sub">★ مميز</span>' : ''}</td><td><div class="table-actions"><select class="action-select" data-status-id="${escapeHtml(listing.id)}">${statusOptions}</select><button class="small-btn ${listing.is_featured ? 'featured' : ''}" data-feature-id="${escapeHtml(listing.id)}" data-featured="${listing.is_featured ? '1' : '0'}">${listing.is_featured ? 'إلغاء التمييز' : 'تمييز'}</button></div></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="empty-cell">لا توجد إعلانات.</td></tr>';
    document.querySelectorAll('[data-status-id]').forEach(select => select.addEventListener('change', () => updateListing(select.dataset.statusId, {status:select.value})));
    document.querySelectorAll('[data-feature-id]').forEach(button => button.addEventListener('click', () => updateListing(button.dataset.featureId, {featured:button.dataset.featured !== '1'})));
  }

  async function updateListing(id, changes) {
    try { await request('admin_update_listing.php', {method:'POST', body:JSON.stringify({id, ...changes})}); showToast('تم حفظ تعديل الإعلان'); await refreshAll(); }
    catch (error) { showToast(error.message, true); }
  }

  async function loadUsers() {
    if (requiredRole !== 'super_admin') return;
    const {users} = await request('admin_users.php');
    $('usersTable').innerHTML = users.length ? users.map(user => `<tr class="${user.is_active ? '' : 'user-inactive'}"><td><span class="listing-name">${escapeHtml(user.name)}</span><span class="listing-sub">${escapeHtml(user.id)}</span></td><td>${escapeHtml(user.email)}</td><td><select class="action-select" data-role-id="${escapeHtml(user.id)}">${Object.entries(roleLabels).map(([value,label]) => `<option value="${value}" ${user.role === value ? 'selected' : ''}>${label}</option>`).join('')}</select></td><td>${user.listings_count}</td><td>${user.is_active ? 'نشط' : 'معطل'}</td><td><button class="small-btn" data-active-id="${escapeHtml(user.id)}" data-active="${user.is_active ? '1' : '0'}">${user.is_active ? 'تعطيل' : 'تفعيل'}</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty-cell">لا يوجد مستخدمون.</td></tr>';
    document.querySelectorAll('[data-role-id]').forEach(select => select.addEventListener('change', () => updateUser(select.dataset.roleId, {role:select.value})));
    document.querySelectorAll('[data-active-id]').forEach(button => button.addEventListener('click', () => updateUser(button.dataset.activeId, {is_active:button.dataset.active !== '1'})));
  }

  async function updateUser(id, changes) {
    try { await request('admin_update_user.php', {method:'POST', body:JSON.stringify({id, ...changes})}); showToast('تم حفظ تعديل المستخدم'); await refreshAll(); }
    catch (error) { showToast(error.message, true); }
  }

  async function refreshAll() {
    try { await Promise.all([loadStats(), loadListings(), loadUsers()]); initIcons(); }
    catch (error) { showToast(error.message, true); }
  }

  $('refreshBtn').addEventListener('click', refreshAll);
  $('statusFilter').addEventListener('change', loadListings);
  $('logoutBtn').addEventListener('click', async () => { try { await request('logout.php', {method:'POST', body:'{}'}); } finally { window.location.href = 'login.html'; } });
  initIcons();
  checkAccess();
})();
