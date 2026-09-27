/* ==========================================
   لوحة التحكم - Admin Dashboard (النسخة الكاملة النهائية)
   ========================================== */

let currentAdmin = null;
let allListings = [];
let allUsers = [];
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
      throw new Error(`الخادم أرجع استجابة غير صالحة (${response.status}). تأكد من وجود ملف ${path}`);
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
   الدوال المفقودة (تمت إضافتها لحل المشكلة)
   ========================================== */

async function updateAdminListing(id, changes) {
  try {
    await adminRequest('admin_update_listing.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    
    // تحديث البيانات محلياً لتجنب إعادة تحميل الصفحة بالكامل
    const index = allListings.findIndex(l => l.id === id);
    if (index > -1) {
      Object.assign(allListings[index], changes);
    }
    
    renderOverview();
    renderListingsTable();
    alert('✅ تم حفظ التعديل بنجاح');
  } catch (error) {
    alert('❌ فشل التعديل: ' + error.message);
  }
}

window.editAdminListing = async function(id, currentTitle, currentPrice) {
  const newTitle = prompt('عنوان الإعلان:', currentTitle || '');
  if (newTitle === null) return;
  
  const newPrice = prompt('السعر:', currentPrice || '0');
  if (newPrice === null) return;

  await updateAdminListing(id, { 
    title: newTitle.trim(), 
    price: newPrice.trim() 
  });
};

async function updateAdminUser(id, changes) {
  try {
    await adminRequest('admin_update_user.php', {
      method: 'POST',
      body: JSON.stringify({ id, ...changes })
    });
    alert('✅ تم حفظ تعديل المستخدم');
    await loadData();
  } catch (error) {
    alert(error.message);
  }
}

/* ==========================================
   التحقق من الصلاحيات (النسخة المحسّنة)
   ========================================== */
async function checkAccess() {
  const dashboardEl = document.getElementById('adminDashboard');
  const noAccessEl = document.getElementById('noAccess');
  
  if (!dashboardEl || !noAccessEl) return false;

  try {
    // 1️⃣ قراءة سريعة من localStorage (لعرض الواجهة فوراً)
    const localUser = API.Users.getCurrent();
    if (!localUser || !API.Users.isAdmin()) {
      noAccessEl.style.display = 'block';
      dashboardEl.style.display = 'none';
      initIcons();
      return false;
    }

    // 2️⃣ عرض الواجهة مؤقتاً (عشان المستخدم ما ينتظر)
    dashboardEl.style.display = 'grid';
    document.getElementById('adminName').textContent = localUser.name || 'أدمن';
    document.getElementById('adminAvatar').textContent = (localUser.name || 'م').charAt(0);

    const roleEl = document.getElementById('adminRole');
    if (roleEl) {
      if (localUser.role === 'super_admin') {
        roleEl.textContent = 'أدمن عام';
        roleEl.classList.add('super');
      } else {
        roleEl.textContent = 'أدمن';
      }
    }

    const usersTab = document.getElementById('usersTabBtn');
    if (localUser.role !== 'super_admin' && usersTab) {
      usersTab.style.display = 'none';
    }

    // 3️⃣ ✅ التحقق الحقيقي من الجلسة مع السيرفر
    const serverUser = await API.Users.validateSession();
    
    if (!serverUser) {
      // الجلسة انتهت فعلاً → طرد المستخدم لصفحة الدخول
      console.warn('⚠️ الجلسة منتهية، إعادة التوجيه لتسجيل الدخول...');
      alert('انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.');
      window.location.href = 'login.html';
      return false;
    }

    // 4️⃣ تحديث البيانات من السيرفر (لضمان أن الدور صحيح)
    currentAdmin = serverUser;
    document.getElementById('adminName').textContent = serverUser.name || 'أدمن';
    document.getElementById('adminAvatar').textContent = (serverUser.name || 'م').charAt(0);

    return true;

  } catch (e) {
    console.error('❌ خطأ في دالة checkAccess:', e);
    return false;
  }
}

/* ==========================================
   تحميل البيانات
   ========================================== */
async function loadData() {
  try {
    console.log('⏳ جاري جلب البيانات...');
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
    console.log(`✅ تم جلب ${allListings.length} إعلان و ${allUsers.length} مستخدم`);

    renderOverview();
    renderListingsTable();
    if (currentAdmin.role === 'super_admin') renderUsersTable();
    renderReports();

  } catch (e) {
    console.error('❌ خطأ أثناء تحميل البيانات:', e);
  }
}

/* ==========================================
   Overview
   ========================================== */
function renderOverview() {
  const props = allListings.filter(l => l.type === 'property');
  const cars = allListings.filter(l => l.type === 'car');
  const totalViews = allListings.reduce((sum, l) => sum + (l.views || 0), 0);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('statTotalProps', props.length);
  setEl('statTotalCars', cars.length);
  setEl('statTotalUsers', allUsers.length);
  setEl('statTotalViews', totalViews.toLocaleString('en-US'));
  setEl('badgeListings', allListings.length);
  setEl('badgeUsers', allUsers.length);

  const recent = [...allListings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentEl = document.getElementById('recentListings');
  
  if (recentEl) {
    if (!recent.length) {
      recentEl.innerHTML = `<div class="admin-empty"><i data-lucide="inbox"></i><p>لا توجد إعلانات</p></div>`;
    } else {
      recentEl.innerHTML = recent.map(l => {
        const icon = l.type === 'property' ? 'building-2' : 'car';
        return `<div class="admin-recent-item">
          <div class="admin-recent-icon"><i data-lucide="${icon}"></i></div>
          <div class="admin-recent-info">
            <div class="admin-recent-title">${l.title}</div>
            <div class="admin-recent-sub">${l.city || '—'}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  const recentUsersEl = document.getElementById('recentUsers');
  if (recentUsersEl && currentAdmin && currentAdmin.role === 'super_admin') {
    const recentU = [...allUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
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
        </div>`).join('');
    }
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
  if (!tbody) return;

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
        : `<span style="color:var(--text-muted);font-size:12px;">—</span>`}
      </td>
      <td>
        <div class="admin-actions">
          <a href="details.html?id=${encodeURIComponent(l.id)}&type=${encodeURIComponent(l.type)}" class="admin-icon-btn" title="عرض"><i data-lucide="eye"></i></a>
          <select class="admin-select admin-action-select" data-status-id="${listingId}" title="تغيير الحالة">
            ${Object.entries(listingStatusLabels).map(([value, label]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button class="admin-icon-btn ${isFeatured ? 'featured' : ''}" data-feature-id="${listingId}" data-featured="${isFeatured ? '1' : '0'}" title="${isFeatured ? 'إلغاء التمييز' : 'تمييز'}"><i data-lucide="star"></i></button>
          
          <!-- ✅ زر التعديل (تم إصلاحه ليعمل مباشرة) -->
          <button class="admin-icon-btn" onclick="editAdminListing('${listingId}', '${escapeHtml(l.title)}', '${escapeHtml(l.price)}')" title="تعديل"><i data-lucide="pencil"></i></button>
          
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
  if (!currentAdmin || currentAdmin.role !== 'super_admin') return;

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
  if (!tbody) return;

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
            
            <button class="admin-icon-btn danger" onclick="adminDeleteUser('${userId}')" title="حذف الحساب"><i data-lucide="trash-2"></i></button>
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

window.adminDeleteUser = async function (id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;

  if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return;
  if (!confirm('🔴 سيتم حذف الحساب نهائياً ولا يمكن استرجاعه.')) return;

  try {
    const result = await adminRequest('admin_delete_user.php', {
        method: 'POST',
        body: JSON.stringify({ id })
    });

    if (result.success) {
        allUsers = allUsers.filter(u => u.id !== id);
        renderOverview();
        renderUsersTable();
        alert('✅ تم حذف المستخدم بنجاح');
    } else {
        alert(result.error || 'فشل حذف المستخدم');
    }
  } catch (error) {
    console.error('❌ خطأ أثناء حذف المستخدم:', error);
    alert('حدث خطأ في الخادم أثناء محاولة الحذف. تأكد من وجود ملف admin_delete_user.php');
  }
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
  console.log('🚀 بدء تشغيل لوحة التحكم...');
  initIcons();

  if (typeof API === 'undefined') {
      console.error('❌ خطأ قاتل: ملف api.js لم يتم تحميله بشكل صحيح!');
      return;
  }

  // ✅ await هنا مهمة جداً لأن checkAccess صارت async
  const hasAccess = await checkAccess();
  if (!hasAccess) return;

  setupTabs();
  setupFilters();
  await loadData();

  initIcons();
  console.log('✅ اكتمل تشغيل لوحة التحكم بنجاح');

  // 🔄 فحص الجلسة كل 5 دقائق (اختياري لكن مُستحسن)
  setInterval(async () => {
    const user = await API.Users.validateSession();
    if (!user) {
      alert('انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.');
      window.location.href = 'login.html';
    }
  }, 5 * 60 * 1000);
});