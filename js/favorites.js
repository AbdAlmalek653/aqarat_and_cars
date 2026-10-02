/* ==========================================
   صفحة المفضلة - البيانات من API فقط
   الإصدار: 2.0 (محسّن للأداء + دعم أحجام متعددة)
   ========================================== */

function initIcons() { if (window.lucide) window.lucide.createIcons(); }

const FALLBACK_DATA = {
  '1001': { id: '1001', type: 'property', purpose: 'sale', title: 'شقة فاخرة بتشطيب سوبر ديلوكس في المزة', location: 'دمشق - المزة', price: 185000, currency: 'USD', icon: 'building-2' },
  '2001': { id: '2001', type: 'car', purpose: 'sale', title: 'تويوتا كامري 2022 - فل كامل', location: 'دمشق - المزة', price: 28500, currency: 'USD', icon: 'car' }
};

async function loadFavorites() {
  const user = API.Users.getCurrent();
  if (!user) {
    document.getElementById('notLoggedIn').style.display = 'block';
    initIcons();
    return;
  }

  document.getElementById('favoritesContent').style.display = 'block';

  const ids = await API.Favorites.getAll();
  const all = await API.Listings.getAll();

  const favs = ids.map(id => {
    const found = all.find(l => l.id === id);
    return found || FALLBACK_DATA[id];
  }).filter(Boolean);

  const grid = document.getElementById('favoritesGrid');

  if (!favs.length) {
    grid.innerHTML = `<div class="static-card" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <i data-lucide="heart-off" style="width:64px;height:64px;color:var(--text-muted);opacity:.4;margin-bottom:16px;"></i>
      <h3 style="margin-bottom:8px;">لا توجد إعلانات محفوظة</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px;">احفظ الإعلانات اللي تعجبك بالضغط على أيقونة القلب</p>
      <a href="properties.html" class="btn btn-primary"><i data-lucide="building-2"></i><span>تصفح العقارات</span></a>
    </div>`;
    initIcons();
    return;
  }

  grid.innerHTML = favs.map(l => {
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
    const location = l.location || l.area || l.city || '—';

    const imageContent = imgData.src
      ? `<img 
           src="${imgData.src}"
           ${imgData.srcset ? `srcset="${imgData.srcset}"` : ''}
           ${imgData.sizes ? `sizes="${imgData.sizes}"` : ''}
           alt="${safeTitle}"
           loading="lazy"
           decoding="async"
           width="800"
           height="600"
           onerror="this.onerror=null;this.style.display='none';this.parentNode.classList.add('image-failed');this.parentNode.innerHTML='<i data-lucide=\\'${icon}\\'></i>';if(window.lucide)window.lucide.createIcons();">`
      : `<i data-lucide="${icon}"></i>`;

    return `<div class="card" style="position:relative;">
      <a href="details.html?id=${l.id}&type=${l.type}">
      <div class="card-image">
        ${imageContent}
        <span class="card-badge ${purposeClass}">${purposeText}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${l.title}</h3>
        <p class="card-location"><i data-lucide="map-pin"></i>${location}</p>
        <p class="card-price">${priceText}</p>
      </div></a>
      <button class="icon-action danger" style="position:absolute;top:12px;left:12px;background:rgba(239,68,68,.9);border:none;color:#fff;" onclick="removeFav('${l.id}')" title="إزالة">
        <i data-lucide="x"></i></button>
    </div>`;
  }).join('');

  initIcons();
}

window.removeFav = async function(id) {
  const r = await API.Favorites.toggle(id);
  if (r.success) await loadFavorites();
};

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  loadFavorites();
});