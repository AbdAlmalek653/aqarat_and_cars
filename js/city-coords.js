/* ==========================================
   إحداثيات محافظات سوريا
   ========================================== */

window.CITY_COORDS = {
  damascus:       { name: 'دمشق',       lat: 33.5138, lng: 36.2765 },
  'rif-dimashq':  { name: 'ريف دمشق',   lat: 33.5167, lng: 36.4167 },
  aleppo:         { name: 'حلب',         lat: 36.2021, lng: 37.1343 },
  homs:           { name: 'حمص',         lat: 34.7324, lng: 36.7137 },
  hama:           { name: 'حماة',        lat: 35.1318, lng: 36.7578 },
  latakia:        { name: 'اللاذقية',    lat: 35.5138, lng: 35.7934 },
  tartus:         { name: 'طرطوس',       lat: 34.8894, lng: 35.8866 },
  daraa:          { name: 'درعا',        lat: 32.6189, lng: 36.1021 },
  sweida:         { name: 'السويداء',    lat: 32.7086, lng: 36.5663 },
  quneitra:       { name: 'القنيطرة',    lat: 33.1256, lng: 35.8244 },
  'deir-ezzor':   { name: 'دير الزور',   lat: 35.3359, lng: 40.1408 },
  raqqa:          { name: 'الرقة',       lat: 35.9594, lng: 39.0087 },
  hasakah:        { name: 'الحسكة',      lat: 36.5024, lng: 40.7477 },
  idlib:          { name: 'إدلب',        lat: 35.9306, lng: 36.6339 }
};

// مركز سوريا + مستوى التقريب
window.SYRIA_CENTER = [34.8021, 38.9968];
window.SYRIA_ZOOM = 7;

console.log('✅ [Map] City coordinates loaded');