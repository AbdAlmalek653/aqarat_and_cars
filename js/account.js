/* ==========================================
   صفحة الحساب - البيانات من API فقط
   الإصدار: 2.0 (محسّن للأداء + دعم أحجام متعددة)
   ========================================== */

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ==========================================
   التبويبات
   ========================================== */
function setupTabs() {
  document.querySelectorAll('.account-menu-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-menu-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.account-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      initIcons();
    });
  });
}

/* ==========================================
   تحميل بيانات المستخدم
   ========================================== */
async function loadUser() {
  const user = API.Users.getCurrent();
  if (!user) {
    document.getElementById('notLoggedIn').style.display = 'block';
    initIcons();
    return null;
  }

  document.getElementById('accountContent').style.display = 'grid';
  document.getElementById('userName').textContent = user.name || '';
  document.getElementById('userEmail').textContent = user.email || '';
  document.getElementById('userAvatar').textContent = (user.name || 'م').charAt(0);
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editPhone').value = user.phone || '';

  return user;
}

/* ==========================================
   تحميل الإحصائيات
   ========================================== */
async function loadStats(user) {
  if (!user) return;

  try {
    const all = await API.Listings.getAll();
    const mine = all.filter(l => l.userId === user.id);

    const statTotal = document.getElementById('statTotal');
    const statActive = document.getElementById('statActive');
    const statViews = document.getElementById('statViews');
    const statFavs = document.getElementById('statFavs');
    const listingsBadge = document.getElementById('listingsBadge');

    if (statTotal) statTotal.textContent = mine.length;
    if (statActive) statActive.textContent = mine.filter(l => l.status === 'active').length;
    if (statViews) statViews.textContent = mine.reduce((s, l) => s + (l.views || 0), 0);

    const favs = await API.Favorites.getAll();
    if (statFavs) statFavs.textContent = favs.length;
    if (listingsBadge) listingsBadge.textContent = mine.length;

    renderMyListings(mine);
  } catch (e) {
    console.error('خطأ في تحميل الإحصائيات:', e);
  }
}

/* ==========================================
   ✅ عرض إعلاناتي مع الصور المحسّنة (srcset)
   ========================================== */
function renderMyListings(listings) {
  const c = document.getElementById('myListings');
  if (!c) return;

  if (!listings.length) {
    c.innerHTML = `<div class="static-card" style="text-align:center;padding:60px 20px;">
      <i data-lucide="file-x" style="width:56px;height:56px;color:var(--text-muted);opacity:.4;margin-bottom:16px;"></i>
      <h3 style="margin-bottom:8px;">لا توجد إعلانات</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px;">لم تنشر أي إعلان بعد</p>
      <a href="add-listing.html" class="btn btn-primary"><i data-lucide="plus"></i><span>أضف إعلانك الأول</span></a>
    </div>`;
    initIcons();
    return;
  }

  c.innerHTML = listings.map(l => {
    const purposeText = l.purpose === 'sale' ? 'للبيع' : 'للإيجار';
    const purposeClass = l.purpose === 'sale' ? 'sale' : 'rent';
    const icon = l.type === 'property' ? 'building-2' : 'car';

    // ✅ معالجة السعر بأمان
    const priceNum = Number(l.price) || 0;
    const priceText = l.purpose === 'sale'
      ? `${priceNum.toLocaleString('en-US')} ${l.currency || 'USD'}`
      : `${priceNum} ${l.currency || 'USD'}/شهر`;

    // ✅ استخدام srcset + sizes للأداء الفائق
    const imgData = window.getListingImageSrcset
      ? window.getListingImageSrcset(l, 0)
      : { src: null, srcset: '', sizes: '' };

    const safeTitle = (l.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const location = l.area || l.city || '—';

    const imageContent = imgData.src
      ? `<img 
           src="${imgData.src}"
           ${imgData.srcset ? `srcset="${imgData.srcset}"` : ''}
           ${imgData.sizes ? `sizes="${imgData.sizes}"` : ''}
           alt="${safeTitle}"
           loading="lazy"
           decoding="async"
           width="100"
           height="100"
           onerror="this.onerror=null;this.style.display='none';this.parentNode.innerHTML='<i data-lucide=\\'${icon}\\'></i>';if(window.lucide)window.lucide.createIcons();">`
      : `<i data-lucide="${icon}"></i>`;

    return `<div class="my-listing">
      <div class="my-listing-image">${imageContent}</div>
      <div class="my-listing-body">
        <div class="my-listing-title">${safeTitle}</div>
        <div class="my-listing-meta">
          <span class="${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span>
          <span><i data-lucide="map-pin"></i>${location}</span>
          <span><i data-lucide="eye"></i>${l.views || 0}</span>
        </div>
        <div class="my-listing-price">${priceText}</div>
      </div>
      <div class="my-listing-actions">
        <a href="details.html?id=${l.id}&type=${l.type}" class="icon-action" title="عرض"><i data-lucide="eye"></i></a>
        <button class="icon-action danger" onclick="deleteListing('${l.id}')" title="حذف"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`;
  }).join('');

  initIcons();
}

/* ==========================================
   حذف إعلان
   ========================================== */
window.deleteListing = async function(id) {
  if (!confirm('هل أنت متأكد من حذف الإعلان؟')) return;

  try {
    const r = await API.Listings.delete(id);
    if (r.success) {
      const user = API.Users.getCurrent();
      await loadStats(user);
    } else {
      alert(r.error || 'فشل الحذف');
    }
  } catch (e) {
    console.error('خطأ في الحذف:', e);
    alert('حدث خطأ أثناء الحذف');
  }
};

/* ==========================================
   تسجيل الخروج
   ========================================== */
function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    Promise.resolve(API.Users.logout()).finally(() => {
      window.location.href = '../index.html';
    });
  });
}

/* ==========================================
   حفظ الملف الشخصي
   ========================================== */
function setupProfile() {
  document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    if (!name) {
      alert('الرجاء إدخال الاسم');
      return;
    }

    const user = API.Users.getCurrent();
    if (!user) return;

    try {
      const users = JSON.parse(localStorage.getItem('souq_users') || '[]');
      const idx = users.findIndex(u => u.id === user.id);

      if (idx > -1) {
        users[idx].name = name;
        users[idx].phone = phone;
        localStorage.setItem('souq_users', JSON.stringify(users));
      }

      user.name = name;
      user.phone = phone;
      localStorage.setItem('souq_current_user', JSON.stringify(user));

      document.getElementById('userName').textContent = name;
      document.getElementById('userAvatar').textContent = name.charAt(0);

      alert('تم حفظ التغييرات بنجاح!');
    } catch (e) {
      console.error('خطأ في حفظ الملف:', e);
      alert('حدث خطأ أثناء الحفظ');
    }
  });
}

/* ==========================================
   تشغيل
   ========================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  setupTabs();
  setupLogout();
  setupProfile();

  const user = await loadUser();
  if (user) await loadStats(user);

  initIcons();
});