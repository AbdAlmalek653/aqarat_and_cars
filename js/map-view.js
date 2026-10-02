/* ==========================================
   الخريطة التفاعلية - منطق العرض
   ========================================== */

(function() {
  'use strict';

  let map = null;
  let markersLayer = null;
  let currentListings = [];

  /* ==========================================
     🗺️ تهيئة الخريطة
     ========================================== */
  function initMap(containerId) {
    if (map) {
      map.remove();
      map = null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('⚠️ [Map] Container not found:', containerId);
      return null;
    }

    // تهيئة Leaflet
    map = L.map(containerId, {
      center: window.SYRIA_CENTER || [34.8021, 38.9968],
      zoom: window.SYRIA_ZOOM || 7,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    });

    // طبقات OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }).addTo(map);

    // طبقة العلامات
    markersLayer = L.layerGroup().addTo(map);

    console.log('✅ [Map] Initialized');
    return map;
  }

  /* ==========================================
     📍 إضافة العلامات
     ========================================== */
  function addMarkers(listings) {
    if (!markersLayer) {
      console.warn('⚠️ [Map] Not initialized');
      return;
    }

    currentListings = listings || [];
    markersLayer.clearLayers();

    if (!currentListings.length) return;

    // تجميع الإعلانات حسب المحافظة
    const grouped = {};
    currentListings.forEach(listing => {
      const cityKey = listing.city;
      if (!cityKey || !window.CITY_COORDS[cityKey]) return;
      if (!grouped[cityKey]) grouped[cityKey] = [];
      grouped[cityKey].push(listing);
    });

    // إضافة العلامات
    let totalMarkers = 0;
    Object.keys(grouped).forEach(cityKey => {
      const coords = window.CITY_COORDS[cityKey];
      const items = grouped[cityKey];

      items.forEach((listing, index) => {
        // توزيع العلامات حول مركز المحافظة
        const angle = (index / Math.max(items.length, 1)) * 2 * Math.PI;
        const radius = 0.02 + (Math.floor(index / 8) * 0.015);
        const lat = coords.lat + Math.cos(angle) * radius;
        const lng = coords.lng + Math.sin(angle) * radius;

        const marker = L.marker([lat, lng], {
          icon: createMarkerIcon(listing)
        });

        marker.bindPopup(createPopupHTML(listing), {
          maxWidth: 300,
          minWidth: 240,
          className: 'listing-popup',
          closeButton: true,
          autoPan: true
        });

        markersLayer.addLayer(marker);
        totalMarkers++;
      });
    });

    // ضبط الحدود لتشمل كل العلامات
    if (totalMarkers > 0) {
      try {
        const group = L.featureGroup(markersLayer.getLayers());
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 12 });
      } catch (e) {
        // إذا فشل، ابقَ على العرض الافتراضي
      }
    }

    console.log(`✅ [Map] ${totalMarkers} markers added`);
  }

  /* ==========================================
     🎨 تصميم العلامة
     ========================================== */
  function createMarkerIcon(listing) {
    const isProperty = listing.type === 'property';
    const isSale = listing.purpose === 'sale';
    
    // ألوان: أخضر للبيع، أزرق للإيجار
    const color = isSale ? '#10B981' : '#3B82F6';
    const emoji = isProperty ? '🏠' : '🚗';

    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin" style="background: linear-gradient(135deg, ${color}, ${color}DD);">
        <span class="marker-emoji">${emoji}</span>
      </div>`,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  }

  /* ==========================================
     📋 محتوى النافذة المنبثقة
     ========================================== */
  function createPopupHTML(listing) {
    const priceNum = Number(listing.price) || 0;
    const priceText = listing.purpose === 'sale'
      ? `${priceNum.toLocaleString('en-US')} ${listing.currency || 'USD'}`
      : `${priceNum} ${listing.currency || 'USD'} <small style="font-size:11px;color:#64748B;">/ شهر</small>`;
    
    const cityName = listing.city && window.CITY_COORDS[listing.city]
      ? window.CITY_COORDS[listing.city].name
      : (listing.city || '');
    
    const locationText = listing.area 
      ? `${cityName} - ${listing.area}` 
      : cityName;

    const imageUrl = window.getListingImageUrl
      ? window.getListingImageUrl(listing, 0, 'thumb')
      : null;

    const imageHTML = imageUrl
      ? `<img src="${imageUrl}" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:10px 10px 0 0;display:block;" loading="lazy" onerror="this.style.display='none'">`
      : '';

    const purposeText = listing.purpose === 'sale' ? 'للبيع' : 'للإيجار';
    const purposeColor = listing.purpose === 'sale' ? '#10B981' : '#3B82F6';

    const detailsUrl = `details.html?id=${encodeURIComponent(listing.id)}&type=${listing.type}`;

    return `
      <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; margin: -12px;">
        ${imageHTML}
        <div style="padding: 12px;">
          <div style="display: inline-flex; align-items: center; padding: 3px 10px; background: ${purposeColor}; color: white; border-radius: 20px; font-size: 10px; font-weight: 800; margin-bottom: 6px;">
            ${purposeText}
          </div>
          <h4 style="font-size: 13.5px; font-weight: 800; color: #0B1120; margin: 6px 0; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${escapeHtml(listing.title || '')}
          </h4>
          <p style="font-size: 11.5px; color: #64748B; margin: 0 0 8px 0; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(locationText)}
          </p>
          <p style="font-size: 16px; font-weight: 800; color: #F59E0B; margin: 0 0 10px 0;">
            ${priceText}
          </p>
          <a href="${detailsUrl}" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border-radius: 10px; font-size: 12px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);">
            عرض التفاصيل
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </a>
        </div>
      </div>
    `;
  }

  /* ==========================================
     🛡️ Escape HTML
     ========================================== */
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ==========================================
     🌐 API العام
     ========================================== */
  window.MapView = {
    init: initMap,
    addMarkers: addMarkers,
    destroy: function() {
      if (map) {
        map.remove();
        map = null;
        markersLayer = null;
      }
    },
    getMap: function() { return map; }
  };

  console.log('✅ [Map] map-view.js loaded');

})();