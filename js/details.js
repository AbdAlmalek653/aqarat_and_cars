/* صفحة تفاصيل الإعلان */
const BROKER_PHONE = '963930932794';
let currentListing = null;
let currentImageIndex = 0;

const MOCK_LISTINGS = {
  '1001':{id:'1001',type:'property',purpose:'sale',title:'شقة فاخرة بتشطيب سوبر ديلوكس في المزة',location:'دمشق - المزة',price:185000,currency:'USD',featured:true,description:'شقة فاخرة بمساحة 180 متر مربع، تتكون من 3 غرف نوم، صالون واسع، مطبخ حديث، 2 حمام.\n\nتشطيب سوبر ديلوكس، طابق ثالث من أصل 5، عمر البناء 3 سنوات، مع مصعد وموقف سيارة خاص.',images:[],specs:[{icon:'building-2',label:'نوع العقار',value:'شقة'},{icon:'square',label:'المساحة',value:'180 م²'},{icon:'bed-double',label:'الغرف',value:'3 غرف'},{icon:'bath',label:'الحمامات',value:'2'},{icon:'layers',label:'الطابق',value:'الثالث'},{icon:'calendar',label:'عمر البناء',value:'3 سنوات'},{icon:'sofa',label:'الفرش',value:'مفروش'},{icon:'flame',label:'التدفئة',value:'مركزية'}]},
  '1002':{id:'1002',type:'property',purpose:'rent',title:'فيلا مستقلة مع مسبح وحديقة واسعة',location:'دمشق - قدسيا',price:950,currency:'USD',featured:true,description:'فيلا مستقلة بتصميم عصري، مساحة 350 متر مربع موزعة على طابقين، 5 غرف نوم، صالون كبير، مطبخ مجهز، 4 حمامات، حديقة خاصة 200م، مسبح، موقف سيارتين.',images:[],specs:[{icon:'home',label:'نوع العقار',value:'فيلا'},{icon:'square',label:'المساحة',value:'350 م²'},{icon:'bed-double',label:'الغرف',value:'5'},{icon:'bath',label:'الحمامات',value:'4'},{icon:'waves',label:'المسبح',value:'متوفر'},{icon:'trees',label:'الحديقة',value:'200 م²'},{icon:'car',label:'موقف',value:'متوفر'},{icon:'flame',label:'التدفئة',value:'مركزية'}]},
  '1003':{id:'1003',type:'property',purpose:'sale',title:'أرض سكنية 500م على شارعين',location:'ريف دمشق - جرمانا',price:75000,currency:'USD',featured:false,description:'أرض سكنية بمساحة 500 متر مربع، على شارعين (شرقي وغربي)، منظمة ضمن المخطط التنظيمي، جاهزة للبناء مباشرة.',images:[],specs:[{icon:'trees',label:'النوع',value:'أرض'},{icon:'square',label:'المساحة',value:'500 م²'},{icon:'route',label:'الواجهات',value:'شارعين'},{icon:'file-check',label:'الطابو',value:'منظم'}]},
  '1004':{id:'1004',type:'property',purpose:'rent',title:'مكتب تجاري مجهز بالكامل في أبو رمانة',location:'دمشق - أبو رمانة',price:600,currency:'USD',featured:false,description:'مكتب تجاري بمساحة 120 متر مربع في منطقة حيوية، مجهز بالكامل بالأثاث والمعدات المكتبية، مكيفات، حمام، مطبخ صغير.',images:[],specs:[{icon:'briefcase',label:'النوع',value:'مكتب'},{icon:'square',label:'المساحة',value:'120 م²'},{icon:'layers',label:'الطابق',value:'الثاني'},{icon:'snowflake',label:'التكييف',value:'متوفر'},{icon:'sofa',label:'الفرش',value:'مجهز'},{icon:'car',label:'موقف',value:'متوفر'}]},
  '2001':{id:'2001',type:'car',purpose:'sale',title:'تويوتا كامري 2022 - فل كامل',location:'دمشق - المزة',price:28500,currency:'USD',featured:true,description:'تويوتا كامري 2022 فل كامل، ماشية 35,000 كم فقط، بحالة الوكالة، صيانة دورية في الوكالة، بدون حوادث نهائياً.\n\nالمواصفات: فتحة سقف، جلد، شاشة، كاميرا خلفية، حساسات، مثبت سرعة، مقاعد كهربائية.',images:[],specs:[{icon:'car',label:'الماركة',value:'تويوتا'},{icon:'tag',label:'الموديل',value:'كامري'},{icon:'calendar',label:'السنة',value:'2022'},{icon:'gauge',label:'الكيلومترات',value:'35,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أبيض'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2002':{id:'2002',type:'car',purpose:'rent',title:'هيونداي إلنترا 2020 - نظيفة جداً',location:'حلب - العزيزية',price:45,currency:'USD',featured:true,description:'هيونداي إلنترا 2020 للإيجار اليومي، ماشية 85,000 كم، حالة ممتازة، مكيفة، أوتوماتيك، اقتصادية بالوقود.',images:[],specs:[{icon:'car',label:'الماركة',value:'هيونداي'},{icon:'tag',label:'الموديل',value:'إلنترا'},{icon:'calendar',label:'السنة',value:'2020'},{icon:'gauge',label:'الكيلومترات',value:'85,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'فضي'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2003':{id:'2003',type:'car',purpose:'sale',title:'كيا سبورتاج 2021 - بحالة الوكالة',location:'دمشق - قدسيا',price:32000,currency:'USD',featured:false,description:'كيا سبورتاج 2021، ماشية 45,000 كم، حالة ممتازة، صيانة دورية، بدون حوادث.',images:[],specs:[{icon:'car',label:'الماركة',value:'كيا'},{icon:'tag',label:'الموديل',value:'سبورتاج'},{icon:'calendar',label:'السنة',value:'2021'},{icon:'gauge',label:'الكيلومترات',value:'45,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أسود'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]},
  '2004':{id:'2004',type:'car',purpose:'rent',title:'مرسيدس E200 2019 - فخامة',location:'حمص - الوعر',price:70,currency:'USD',featured:false,description:'مرسيدس E200 2019 للإيجار اليومي، فخامة وأداء عالي، مكيفة، أوتوماتيك، بحالة ممتازة.',images:[],specs:[{icon:'car',label:'الماركة',value:'مرسيدس'},{icon:'tag',label:'الموديل',value:'E200'},{icon:'calendar',label:'السنة',value:'2019'},{icon:'gauge',label:'الكيلومترات',value:'70,000 كم'},{icon:'settings-2',label:'ناقل الحركة',value:'أوتوماتيك'},{icon:'fuel',label:'الوقود',value:'بنزين'},{icon:'palette',label:'اللون',value:'أسود'},{icon:'sparkles',label:'الحالة',value:'مستعمل'}]}
};

function initIcons(){if(window.lucide)window.lucide.createIcons();}
function getParams(){const p=new URLSearchParams(window.location.search);return{id:p.get('id'),type:p.get('type')||'property'};}

async function fetchListing(id){
  if(window.API){try{const s=await API.Listings.getById(id);if(s)return s;}catch(e){}}
  return MOCK_LISTINGS[id]||null;
}

function renderListing(l){
  currentListing=l;
  const parent=document.getElementById('breadcrumbParent');
  if(l.type==='property'){parent.textContent='العقارات';parent.href='properties.html';}
  else{parent.textContent='السيارات';parent.href='cars.html';}
  document.getElementById('breadcrumbTitle').textContent=l.title;
  document.title=l.title+' | سوق';
  document.getElementById('adTitle').textContent=l.title;

  const purposeText=l.purpose==='sale'?'للبيع':'للإيجار';
  const purposeClass=l.purpose==='sale'?'sale':'rent';
  const typeText=l.type==='property'?'عقار':'سيارة';
  let badges=`<span class="info-badge ${purposeClass}"><i data-lucide="tag"></i>${purposeText}</span>
    <span class="info-badge" style="background:var(--bg-secondary);color:var(--text-secondary);"><i data-lucide="${l.type==='property'?'building-2':'car'}"></i>${typeText}</span>`;
  if(l.featured)badges+=`<span class="info-badge featured"><i data-lucide="star"></i>مميز</span>`;
  document.getElementById('infoBadges').innerHTML=badges;

  document.getElementById('adPrice').innerHTML=l.purpose==='sale'
    ?`${l.price.toLocaleString('en-US')} ${l.currency}`
    :`${l.price} ${l.currency} <small>/ شهرياً</small>`;

  document.getElementById('adLocation').textContent=l.location||'—';
  document.getElementById('adSpecs').innerHTML=(l.specs||[]).map(s=>`
    <div class="spec-item"><div class="spec-icon"><i data-lucide="${s.icon}"></i></div>
    <div class="spec-content"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div></div>`).join('');
  document.getElementById('adDescription').textContent=l.description||'';
  document.getElementById('adId').textContent='#'+l.id;

  const msg=`مرحباً، انا مهتم بـ ${typeText} ورقم الإعلان هو: ${l.id}`;
  document.getElementById('whatsappBtn').href=`https://wa.me/${BROKER_PHONE}?text=${encodeURIComponent(msg)}`;

  renderGallery(l.images||[],l);
  setupFavorite(l.id);
  document.getElementById('loadingState').style.display='none';
  document.getElementById('detailsContent').style.display='grid';
  initIcons();
}

function renderGallery(imgs,l){
  const main=document.getElementById('galleryMain');
  const thumbs=document.getElementById('galleryThumbs');
  const fallback=l.type==='property'?'building-2':'car';

  if(!imgs.length){
    main.innerHTML=`<i data-lucide="${fallback}"></i>
      <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
      <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
      <div class="gallery-counter">1 / 1</div>`;
    thumbs.innerHTML=`<div class="gallery-thumb active"><i data-lucide="${fallback}" style="color:var(--text-muted);"></i></div>`;
    initIcons();return;
  }
  main.innerHTML=`<img src="${imgs[0]}" alt="${l.title}">
    <div class="gallery-nav prev" onclick="prevImage()"><i data-lucide="chevron-right"></i></div>
    <div class="gallery-nav next" onclick="nextImage()"><i data-lucide="chevron-left"></i></div>
    <div class="gallery-counter" id="galleryCounter">1 / ${imgs.length}</div>`;
  thumbs.innerHTML=imgs.map((img,i)=>`<div class="gallery-thumb ${i===0?'active':''}" onclick="goToImage(${i})"><img src="${img}" alt="صورة ${i+1}"></div>`).join('');
  currentImageIndex=0;initIcons();
}

window.prevImage=function(){if(!currentListing?.images?.length)return;const t=currentListing.images.length;currentImageIndex=(currentImageIndex-1+t)%t;updateGallery();};
window.nextImage=function(){if(!currentListing?.images?.length)return;const t=currentListing.images.length;currentImageIndex=(currentImageIndex+1)%t;updateGallery();};
window.goToImage=function(i){if(!currentListing?.images?.length)return;currentImageIndex=i;updateGallery();};

function updateGallery(){
  const imgs=currentListing.images;
  const main=document.getElementById('galleryMain');
  main.querySelector('img').src=imgs[currentImageIndex];
  document.getElementById('galleryCounter').textContent=`${currentImageIndex+1} / ${imgs.length}`;
  document.querySelectorAll('.gallery-thumb').forEach((t,i)=>t.classList.toggle('active',i===currentImageIndex));
}

async function setupFavorite(id){
  const btn=document.getElementById('favBtn');if(!btn)return;
  const isFav=await API.Favorites.isFavorite(id);
  if(isFav){btn.classList.add('active');btn.innerHTML=`<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`;}
  btn.addEventListener('click',async()=>{
    const r=await API.Favorites.toggle(id);
    if(!r.success){alert(r.error||'يجب تسجيل الدخول أولاً');return;}
    if(r.isFavorite){btn.classList.add('active');btn.innerHTML=`<i data-lucide="heart" fill="currentColor"></i><span>في المفضلة</span>`;}
    else{btn.classList.remove('active');btn.innerHTML=`<i data-lucide="heart"></i><span>مفضلة</span>`;}
    initIcons();
  });
}

function setupShare(){
  document.getElementById('shareBtn')?.addEventListener('click',async()=>{
    const data={title:currentListing.title,text:`${currentListing.title} - ${currentListing.price} ${currentListing.currency}`,url:window.location.href};
    if(navigator.share){try{await navigator.share(data);}catch(e){}}
    else{navigator.clipboard.writeText(window.location.href);alert('تم نسخ رابط الإعلان!');}
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  initIcons();setupShare();
  const{id}=getParams();
  if(!id){document.getElementById('loadingState').style.display='none';document.getElementById('notFoundState').style.display='block';initIcons();return;}
  const l=await fetchListing(id);
  if(!l){document.getElementById('loadingState').style.display='none';document.getElementById('notFoundState').style.display='block';initIcons();return;}
  renderListing(l);
});