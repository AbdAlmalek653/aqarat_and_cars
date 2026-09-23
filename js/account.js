function initIcons(){if(window.lucide)window.lucide.createIcons();}

function setupTabs(){
  document.querySelectorAll('.account-menu-item[data-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.account-menu-item').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab=btn.dataset.tab;
      document.querySelectorAll('.account-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
      initIcons();
    });
  });
}

async function loadUser(){
  const user=API.Users.getCurrent();
  if(!user){document.getElementById('notLoggedIn').style.display='block';initIcons();return null;}
  document.getElementById('accountContent').style.display='grid';
  document.getElementById('userName').textContent=user.name;
  document.getElementById('userEmail').textContent=user.email;
  document.getElementById('userAvatar').textContent=(user.name||'م').charAt(0);
  document.getElementById('editName').value=user.name;
  document.getElementById('editEmail').value=user.email;
  document.getElementById('editPhone').value=user.phone||'';
  return user;
}

async function loadStats(user){
  const all=await API.Listings.getAll();
  const mine=all.filter(l=>l.userId===user.id);
  document.getElementById('statTotal').textContent=mine.length;
  document.getElementById('statActive').textContent=mine.filter(l=>l.status==='active').length;
  document.getElementById('statViews').textContent=mine.reduce((s,l)=>s+(l.views||0),0);
  const favs=await API.Favorites.getAll();
  document.getElementById('statFavs').textContent=favs.length;
  document.getElementById('listingsBadge').textContent=mine.length;
  renderMyListings(mine);
}

function renderMyListings(listings){
  const c=document.getElementById('myListings');
  if(!listings.length){
    c.innerHTML=`<div class="static-card" style="text-align:center;padding:60px 20px;">
      <i data-lucide="file-x" style="width:56px;height:56px;color:var(--text-muted);opacity:.4;margin-bottom:16px;"></i>
      <h3 style="margin-bottom:8px;">لا توجد إعلانات</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px;">لم تنشر أي إعلان بعد</p>
      <a href="add-listing.html" class="btn btn-primary"><i data-lucide="plus"></i><span>أضف إعلانك الأول</span></a>
    </div>`;
    initIcons();return;
  }
  c.innerHTML=listings.map(l=>{
    const purposeText=l.purpose==='sale'?'للبيع':'للإيجار';
    const icon=l.type==='property'?'building-2':'car';
    const priceText=l.purpose==='sale'?`${l.price.toLocaleString('en-US')} ${l.currency}`:`${l.price} ${l.currency}/شهر`;
    return `<div class="my-listing">
      <div class="my-listing-image">${l.images?.[0]?`<img src="${l.images[0]}" alt="">`:`<i data-lucide="${icon}"></i>`}</div>
      <div class="my-listing-body">
        <div class="my-listing-title">${l.title}</div>
        <div class="my-listing-meta">
          <span><i data-lucide="tag"></i>${purposeText}</span>
          <span><i data-lucide="map-pin"></i>${l.area||l.city||'—'}</span>
          <span><i data-lucide="eye"></i>${l.views||0}</span>
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

window.deleteListing=async function(id){
  if(!confirm('هل أنت متأكد من حذف الإعلان؟'))return;
  const r=await API.Listings.delete(id);
  if(r.success){
    const user=API.Users.getCurrent();
    await loadStats(user);
  }else{alert(r.error);}
};

function setupLogout(){
  document.getElementById('logoutBtn')?.addEventListener('click',()=>{
    if(!confirm('هل تريد تسجيل الخروج؟'))return;
    Promise.resolve(API.Users.logout()).finally(() => {
      window.location.href='../index.html';
    });
  });
}

function setupProfile(){
  document.getElementById('saveProfileBtn')?.addEventListener('click',()=>{
    const name=document.getElementById('editName').value.trim();
    const phone=document.getElementById('editPhone').value.trim();
    if(!name){alert('الرجاء إدخال الاسم');return;}
    const user=API.Users.getCurrent();
    const users=JSON.parse(localStorage.getItem('souq_users')||'[]');
    const idx=users.findIndex(u=>u.id===user.id);
    if(idx>-1){users[idx].name=name;users[idx].phone=phone;localStorage.setItem('souq_users',JSON.stringify(users));}
    user.name=name;user.phone=phone;
    localStorage.setItem('souq_current_user',JSON.stringify(user));
    document.getElementById('userName').textContent=name;
    document.getElementById('userAvatar').textContent=name.charAt(0);
    alert('تم حفظ التغييرات بنجاح!');
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  initIcons();setupTabs();setupLogout();setupProfile();
  const user=await loadUser();
  if(user)await loadStats(user);
  initIcons();
});