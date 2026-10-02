/* ==========================================
   لوحة التحكم - الإحصائيات المتقدمة (Chart.js)
   الإصدار: 1.0.0
   ✅ Chart.js من CDN
   ✅ لا تؤثر على المستخدمين العاديين
   ✅ 6 رسوم بيانية احترافية
   ========================================== */

(function() {
  'use strict';

  const API_BASE = '../api';
  let chartsLoaded = false;
  let charts = {};

  /* ==========================================
     🎨 الألوان
     ========================================== */
  const COLORS = {
    primary: '#3B82F6',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    accent: '#F59E0B',
    accentLight: 'rgba(245, 158, 11, 0.15)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    purple: '#A78BFA',
    cyan: '#22D3EE',
    pink: '#F472B6',
    palette: [
      '#3B82F6', '#10B981', '#F59E0B', '#A78BFA', '#EF4444',
      '#22D3EE', '#F472B6', '#84CC16', '#F97316', '#06B6D4'
    ]
  };

  /* ==========================================
     ⚙️ إعدادات Chart.js العامة
     ========================================== */
  function getChartDefaults() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          labels: {
            color: '#94A3B8',
            font: { family: 'Cairo, sans-serif', size: 12, weight: '600' },
            padding: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(11, 17, 32, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: 'Cairo, sans-serif', size: 13, weight: '700' },
          bodyFont: { family: 'Cairo, sans-serif', size: 12 }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)', drawBorder: false },
          ticks: { color: '#94A3B8', font: { family: 'Cairo, sans-serif', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.08)', drawBorder: false },
          ticks: { color: '#94A3B8', font: { family: 'Cairo, sans-serif', size: 11 } },
          beginAtZero: true
        }
      }
    };
  }

  /* ==========================================
     📊 تحويل أسماء المحافظات للعربية
     ========================================== */
  const CITY_NAMES = {
    damascus: 'دمشق', 'rif-dimashq': 'ريف دمشق', aleppo: 'حلب',
    homs: 'حمص', hama: 'حماة', latakia: 'اللاذقية',
    tartus: 'طرطوس', daraa: 'درعا', sweida: 'السويداء',
    quneitra: 'القنيطرة', 'deir-ezzor': 'دير الزور',
    raqqa: 'الرقة', hasakah: 'الحسكة', idlib: 'إدلب'
  };

  const STATUS_NAMES = {
    active: 'متاح', pending: 'قيد المراجعة', rejected: 'مرفوض',
    sold: 'مباع', rented: 'مؤجر', expired: 'منتهي'
  };

  const TYPE_NAMES = {
    property: 'عقارات', car: 'سيارات'
  };

  /* ==========================================
     🔄 إعادة تحميل البيانات
     ========================================== */
  async function loadData() {
    try {
      const res = await fetch(`${API_BASE}/admin_stats_charts.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('❌ [Charts] Fetch failed:', e);
      return null;
    }
  }

  /* ==========================================
     📈 رسم 1: الإعلانات المُضافة يومياً
     ========================================== */
  function renderDailyListings(data) {
    const canvas = document.getElementById('chartDailyListings');
    if (!canvas) return;

    if (charts.daily) charts.daily.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="inbox"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map(item => {
      const d = new Date(item.date);
      return d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    });
    const values = data.map(item => parseInt(item.count) || 0);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const config = getChartDefaults();
    config.scales.x.ticks.maxRotation = 45;
    config.scales.x.ticks.minRotation = 45;

    charts.daily = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'الإعلانات',
          data: values,
          borderColor: COLORS.primary,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5
        }]
      },
      options: config
    });
  }

  /* ==========================================
     🥧 رسم 2: توزيع العقارات vs السيارات
     ========================================== */
  function renderTypeDistribution(data) {
    const canvas = document.getElementById('chartTypeDistribution');
    if (!canvas) return;

    if (charts.type) charts.type.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="pie-chart"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map(item => TYPE_NAMES[item.type] || item.type);
    const values = data.map(item => parseInt(item.count) || 0);
    const colors = [COLORS.primary, COLORS.success];

    const config = getChartDefaults();
    delete config.scales;

    charts.type = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: 'rgba(11, 17, 32, 0.9)',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        ...config,
        cutout: '65%',
        plugins: {
          ...config.plugins,
          legend: {
            ...config.plugins.legend,
            position: 'bottom'
          }
        }
      }
    });
  }

  /* ==========================================
     📊 رسم 3: أكثر 10 محافظات
     ========================================== */
  function renderTopCities(data) {
    const canvas = document.getElementById('chartTopCities');
    if (!canvas) return;

    if (charts.cities) charts.cities.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="map-pin"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map(item => CITY_NAMES[item.city] || item.city);
    const values = data.map(item => parseInt(item.count) || 0);

    const config = getChartDefaults();
    config.plugins.legend.display = false;

    charts.cities = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'عدد الإعلانات',
          data: values,
          backgroundColor: COLORS.palette.slice(0, labels.length).map(c => c + 'CC'),
          borderColor: COLORS.palette.slice(0, labels.length),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: config
    });
  }

  /* ==========================================
     👁️ رسم 4: أكثر 10 إعلانات مشاهدة
     ========================================== */
  function renderTopViewed(data) {
    const canvas = document.getElementById('chartTopViewed');
    if (!canvas) return;

    if (charts.viewed) charts.viewed.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="eye"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map(item => {
      const t = item.title || 'بدون عنوان';
      return t.length > 30 ? t.substring(0, 30) + '...' : t;
    });
    const values = data.map(item => parseInt(item.views) || 0);

    const config = getChartDefaults();
    config.indexAxis = 'y';
    config.plugins.legend.display = false;

    charts.viewed = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'المشاهدات',
          data: values,
          backgroundColor: 'rgba(245, 158, 11, 0.75)',
          borderColor: COLORS.accent,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: config
    });
  }

  /* ==========================================
     👥 رسم 5: المستخدمون الجدد أسبوعياً
     ========================================== */
  function renderWeeklyUsers(data) {
    const canvas = document.getElementById('chartWeeklyUsers');
    if (!canvas) return;

    if (charts.users) charts.users.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="user-plus"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map((item, i) => `أسبوع ${i + 1}`);
    const values = data.map(item => parseInt(item.count) || 0);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.4)');
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');

    const config = getChartDefaults();
    config.plugins.legend.display = false;

    charts.users = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'المستخدمون',
          data: values,
          borderColor: COLORS.purple,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: COLORS.purple,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5
        }]
      },
      options: config
    });
  }

  /* ==========================================
     🔄 رسم 6: توزيع حالات الإعلانات
     ========================================== */
  function renderStatusDistribution(data) {
    const canvas = document.getElementById('chartStatusDistribution');
    if (!canvas) return;

    if (charts.status) charts.status.destroy();

    if (!data || !data.length) {
      canvas.parentNode.innerHTML = '<div class="analytics-empty"><i data-lucide="activity"></i><p>لا توجد بيانات</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const labels = data.map(item => STATUS_NAMES[item.status] || item.status);
    const values = data.map(item => parseInt(item.count) || 0);

    const statusColors = {
      active: COLORS.success,
      pending: COLORS.accent,
      sold: COLORS.primary,
      rented: COLORS.purple,
      rejected: COLORS.danger,
      expired: '#64748B'
    };
    const colors = data.map(item => statusColors[item.status] || '#64748B');

    const config = getChartDefaults();
    delete config.scales;

    charts.status = new Chart(canvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'DD'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        ...config,
        plugins: {
          ...config.plugins,
          legend: {
            ...config.plugins.legend,
            position: 'bottom'
          }
        }
      }
    });
  }

  /* ==========================================
     📊 رسم كل الرسوم
     ========================================== */
  function renderAllCharts(data) {
    renderDailyListings(data.daily_listings);
    renderTypeDistribution(data.type_distribution);
    renderTopCities(data.top_cities);
    renderTopViewed(data.top_viewed);
    renderWeeklyUsers(data.weekly_users);
    renderStatusDistribution(data.status_distribution);
  }

  /* ==========================================
     🧹 تدمير كل الرسوم
     ========================================== */
  function destroyAllCharts() {
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].destroy();
        charts[key] = null;
      }
    });
  }

  /* ==========================================
     🚀 التحميل الرئيسي
     ========================================== */
  async function loadCharts() {
    const grid = document.getElementById('analyticsGrid');
    if (!grid) return;

    // إظهار حالة التحميل
    grid.innerHTML = `
      <div class="analytics-loading" style="grid-column:1/-1;">
        <i data-lucide="loader-2" class="spin"></i>
        <span>جاري تحميل الإحصائيات...</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const data = await loadData();

    if (!data || !data.success) {
      grid.innerHTML = `
        <div class="analytics-empty" style="grid-column:1/-1;">
          <i data-lucide="alert-circle"></i>
          <p>فشل تحميل الإحصائيات. تأكد من وجود ملف admin_stats_charts.php</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // إعادة بناء المحتوى
    grid.innerHTML = `
      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="trending-up"></i> الإعلانات المُضافة</h3>
          <span class="analytics-card-badge">آخر 30 يوم</span>
        </div>
        <div class="chart-container"><canvas id="chartDailyListings"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="pie-chart"></i> توزيع الإعلانات</h3>
          <span class="analytics-card-badge">عقارات vs سيارات</span>
        </div>
        <div class="chart-container"><canvas id="chartTypeDistribution"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="map-pin"></i> أكثر المحافظات نشاطاً</h3>
          <span class="analytics-card-badge">Top 10</span>
        </div>
        <div class="chart-container"><canvas id="chartTopCities"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="eye"></i> أكثر الإعلانات مشاهدة</h3>
          <span class="analytics-card-badge">Top 10</span>
        </div>
        <div class="chart-container"><canvas id="chartTopViewed"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="user-plus"></i> المستخدمون الجدد</h3>
          <span class="analytics-card-badge">آخر 8 أسابيع</span>
        </div>
        <div class="chart-container"><canvas id="chartWeeklyUsers"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-header">
          <h3 class="analytics-card-title"><i data-lucide="activity"></i> حالات الإعلانات</h3>
          <span class="analytics-card-badge">توزيع عام</span>
        </div>
        <div class="chart-container"><canvas id="chartStatusDistribution"></canvas></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // ✅ انتظر لحظة حتى يكون canvas جاهز
    setTimeout(() => {
      renderAllCharts(data);
      chartsLoaded = true;
    }, 100);
  }

  /* ==========================================
     🎯 الاستماع لفتح التاب
     ========================================== */
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.admin-menu-btn[data-tab="analytics"]');
    if (btn) {
      setTimeout(() => {
        if (!chartsLoaded) {
          loadCharts();
        }
      }, 150);
    }
  }, true);

  /* ==========================================
     🌐 تصدير للاستخدام العام
     ========================================== */
  window.AdminCharts = {
    load: loadCharts,
    destroy: destroyAllCharts,
    reload: () => {
      chartsLoaded = false;
      destroyAllCharts();
      loadCharts();
    }
  };

  console.log('✅ [Charts] admin-charts.js loaded');

})();