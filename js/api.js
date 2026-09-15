/* ==========================================
   طبقة البيانات الموحدة
   ========================================== */

const API = (function() {

let MODE = 'local';
const API_BASE = (function() {
  return window.location.pathname.includes('/pages/') ? '../api' : 'api';
})();
  const KEYS = {
    USERS: 'souq_users',
    LISTINGS: 'souq_listings',
    CURRENT_USER: 'souq_current_user',
    FAVORITES: 'souq_favorites'
  };

  function read(key, defaultValue) {
    defaultValue = defaultValue || [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('خطأ في القراءة:', e);
      return defaultValue;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('خطأ في الكتابة:', e);
      return false;
    }
  }

  function generateId(prefix) {
    prefix = prefix || '';
    return prefix + Date.now() + Math.floor(Math.random() * 1000);
  }

  function httpGet(url) {
    return fetch(API_BASE + url, { credentials: 'include' }).then(function(r) { return r.json(); });
  }

  function httpPost(url, data) {
    return fetch(API_BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(function(r) { return r.json(); });
  }

  /* ==========================================
     المستخدمين
     ========================================== */
  const Users = {
    getAll: function() {
      if (MODE === 'server') return httpGet('/users.php');
      return Promise.resolve(read(KEYS.USERS, []));
    },

    getById: function(id) {
      if (MODE === 'server') return httpGet('/user.php?id=' + id);
      return Promise.resolve(read(KEYS.USERS, []).find(function(u) { return u.id === id; }));
    },

    getByEmail: function(email) {
      if (MODE === 'server') return httpGet('/user.php?email=' + email);
      return Promise.resolve(read(KEYS.USERS, []).find(function(u) { return u.email === email; }));
    },

    create: function(userData) {
      if (MODE === 'server') return httpPost('/register.php', userData);

      const users = read(KEYS.USERS, []);
      if (users.find(function(u) { return u.email === userData.email; })) {
        return Promise.resolve({ success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' });
      }

      const newUser = {
        id: generateId('U'),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      write(KEYS.USERS, users);
      return Promise.resolve({ success: true, user: newUser });
    },

    login: function(email, password) {
      if (MODE === 'server') return httpPost('/login.php', { email: email, password: password });

      const user = read(KEYS.USERS, []).find(function(u) { return u.email === email; });
      if (!user) return Promise.resolve({ success: false, error: 'لا يوجد حساب بهذا البريد' });
      if (user.password !== password) return Promise.resolve({ success: false, error: 'كلمة المرور غير صحيحة' });

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user'
      };
      write(KEYS.CURRENT_USER, sessionUser);
      return Promise.resolve({ success: true, user: sessionUser });
    },

    logout: function() {
      if (MODE === 'server') return httpPost('/logout.php', {});
      localStorage.removeItem(KEYS.CURRENT_USER);
    },

    getCurrent: function() {
      try {
        const raw = localStorage.getItem(KEYS.CURRENT_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    isLoggedIn: function() {
      return this.getCurrent() !== null;
    },

    isSuperAdmin: function() {
      const u = this.getCurrent();
      return u && u.role === 'super_admin';
    },

    isAdmin: function() {
      const u = this.getCurrent();
      return u && (u.role === 'admin' || u.role === 'super_admin');
    },

    isRegularUser: function() {
      const u = this.getCurrent();
      return u && u.role === 'user';
    },

    /* ==========================================
       إنشاء حسابات الأدمن الافتراضية
       (تعمل مرة واحدة فقط)
       ========================================== */
    seedAdmins: function() {
      const seeded = localStorage.getItem('souq_admins_seeded');
      if (seeded === '1') return;

      const users = read(KEYS.USERS, []);

      const admins = [
        {
          id: 'ADMIN_SUPER_001',
          name: 'أبو أيمن',
          email: 'ahmadkhleef9900@gmail.com',
          phone: '',
          password: 'Ahmad112111',
          role: 'super_admin',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ADMIN_002',
          name: 'أبو برهو',
          email: 'ahmadGh9900@gmail.com',
          phone: '',
          password: 'AhmadGh112111',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ADMIN_003',
          name: 'أبو فاروق',
          email: 'abdmlk9900@gmail.com',
          phone: '',
          password: 'Abdmlk112111',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];

      admins.forEach(function(admin) {
        if (!users.find(function(u) { return u.email === admin.email; })) {
          users.push(admin);
        }
      });

      write(KEYS.USERS, users);
      localStorage.setItem('souq_admins_seeded', '1');
      console.log('✅ تم إنشاء حسابات الأدمن بنجاح');
    }
  };

  /* ==========================================
     الإعلانات
     ========================================== */
  const Listings = {
    getAll: function(filters) {
      if (MODE === 'server') {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return httpGet('/listings.php' + (q ? '?' + q : ''));
      }
      return Promise.resolve(read(KEYS.LISTINGS, []));
    },

    getById: function(id) {
      if (MODE === 'server') return httpGet('/listing.php?id=' + id);
      return Promise.resolve(read(KEYS.LISTINGS, []).find(function(l) { return l.id === id; }));
    },

    getByType: function(type) {
      if (MODE === 'server') return httpGet('/listings.php?type=' + type);
      return Promise.resolve(read(KEYS.LISTINGS, []).filter(function(l) { return l.type === type; }));
    },

    getByUser: function(userId) {
      if (MODE === 'server') return httpGet('/my_listings.php');
      return Promise.resolve(read(KEYS.LISTINGS, []).filter(function(l) { return l.userId === userId; }));
    },

    getFeatured: function(type, limit) {
      limit = limit || 4;
      if (MODE === 'server') return httpGet('/listings.php?type=' + type + '&featured=1&limit=' + limit);
      return Promise.resolve(read(KEYS.LISTINGS, [])
        .filter(function(l) { return l.type === type && l.featured; })
        .slice(0, limit));
    },

    getLatest: function(type, limit) {
      limit = limit || 4;
      if (MODE === 'server') return httpGet('/listings.php?type=' + type + '&limit=' + limit);
      return Promise.resolve(read(KEYS.LISTINGS, [])
        .filter(function(l) { return l.type === type; })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
        .slice(0, limit));
    },

    create: function(listingData) {
      if (MODE === 'server') return httpPost('/add_listing.php', listingData);

      const user = Users.getCurrent();
      if (!user) return Promise.resolve({ success: false, error: 'يجب تسجيل الدخول أولاً' });

      const listings = read(KEYS.LISTINGS, []);
      const newListing = {
        id: generateId('L'),
        userId: user.id,
        type: listingData.type,
        purpose: listingData.purpose,
        subType: listingData.subType || null,
        title: listingData.title,
        description: listingData.description || '',
        price: Number(listingData.price) || 0,
        currency: listingData.currency || 'USD',
        city: listingData.city || '',
        area: listingData.area || '',
        address: listingData.address || '',
        whatsapp: listingData.whatsapp || '',
        images: listingData.images || [],
        details: listingData.details || {},
        status: 'active',
        featured: false,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      listings.push(newListing);
      write(KEYS.LISTINGS, listings);
      return Promise.resolve({ success: true, listing: newListing });
    },

    update: function(id, updates) {
      if (MODE === 'server') return httpPost('/update_listing.php', Object.assign({ id: id }, updates));

      const listings = read(KEYS.LISTINGS, []);
      const index = listings.findIndex(function(l) { return l.id === id; });
      if (index === -1) return Promise.resolve({ success: false, error: 'الإعلان غير موجود' });

      listings[index] = Object.assign({}, listings[index], updates, { updatedAt: new Date().toISOString() });
      write(KEYS.LISTINGS, listings);
      return Promise.resolve({ success: true, listing: listings[index] });
    },

    delete: function(id) {
      if (MODE === 'server') return httpPost('/delete_listing.php', { id: id });

      const listings = read(KEYS.LISTINGS, []);
      const filtered = listings.filter(function(l) { return l.id !== id; });
      if (filtered.length === listings.length) return Promise.resolve({ success: false, error: 'الإعلان غير موجود' });

      write(KEYS.LISTINGS, filtered);
      return Promise.resolve({ success: true });
    }
  };

  /* ==========================================
     المفضلة
     ========================================== */
  const Favorites = {
    getAll: function() {
      if (MODE === 'server') return httpGet('/favorites.php');
      const user = Users.getCurrent();
      if (!user) return Promise.resolve([]);
      const all = read(KEYS.FAVORITES, {});
      return Promise.resolve(all[user.id] || []);
    },

    isFavorite: function(listingId) {
      return this.getAll().then(function(favs) {
        return favs.indexOf(listingId) !== -1;
      });
    },

    toggle: function(listingId) {
      if (MODE === 'server') return httpPost('/toggle_favorite.php', { listing_id: listingId });

      const user = Users.getCurrent();
      if (!user) return Promise.resolve({ success: false, error: 'يجب تسجيل الدخول' });

      const all = read(KEYS.FAVORITES, {});
      const userFavs = all[user.id] || [];

      if (userFavs.indexOf(listingId) !== -1) {
        all[user.id] = userFavs.filter(function(id) { return id !== listingId; });
      } else {
        userFavs.push(listingId);
        all[user.id] = userFavs;
      }

      write(KEYS.FAVORITES, all);
      return Promise.resolve({
        success: true,
        isFavorite: all[user.id].indexOf(listingId) !== -1
      });
    }
  };

  /* ==========================================
     حماية الصفحات
     ========================================== */
  const Auth = {
    isLoggedIn: function() {
      return Users.getCurrent() !== null;
    },

    isAdmin: function() {
      return Users.isAdmin();
    },

    isSuperAdmin: function() {
      return Users.isSuperAdmin();
    }
  };

  /* ==========================================
     الواجهة العامة
     ========================================== */
  return {
    Users: Users,
    Listings: Listings,
    Favorites: Favorites,
    Auth: Auth,
    generateId: generateId,
    setMode: function(mode) {
      if (mode === 'local' || mode === 'server') {
        MODE = mode;
      }
    },
    getMode: function() { return MODE; },
    clearAll: function() {
      Object.keys(KEYS).forEach(function(key) {
        localStorage.removeItem(KEYS[key]);
      });
      localStorage.removeItem('souq_admins_seeded');
    }
  };

})();

window.API = API;

/* ==========================================
   تشغيل تلقائي عند فتح أي صفحة
   ========================================== */
document.addEventListener('DOMContentLoaded', function() {
  if (window.API && API.Users && API.Users.seedAdmins) {
    API.Users.seedAdmins();
  }
});