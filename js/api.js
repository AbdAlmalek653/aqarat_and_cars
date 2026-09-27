/* ==========================================
  طبقة البيانات الموحدة
  ========================================== */

const API = (function () {

  let MODE = 'server';
  const API_BASE = (function () {
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
    return fetch(API_BASE + url, { credentials: 'include' }).then(function (r) { return r.json(); });
  }

  function httpPost(url, data) {
    return fetch(API_BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }

  function normalizeListing(listing) {
    if (!listing) return listing;
    const details = listing.details || {};
    return Object.assign({}, listing, {
      userId: listing.userId || listing.user_id,
      city: listing.city || listing.city_slug,
      cityName: listing.cityName || listing.city_name,
      subType: listing.subType || details.subType,
      createdAt: listing.createdAt || listing.created_at,
      updatedAt: listing.updatedAt || listing.updated_at,
      featured: listing.featured !== undefined
        ? listing.featured
        : Boolean(listing.is_featured)
    });
  }

  /* ==========================================
     المستخدمين
     ========================================== */
  const Users = {
    getAll: function () {
      if (MODE === 'server') {
        return httpGet('/admin_users.php').then(function (result) {
          return result.users || [];
        });
      }
      return Promise.resolve(read(KEYS.USERS, []));
    },

    getById: function (id) {
      if (MODE === 'server') return httpGet('/user.php?id=' + id);
      return Promise.resolve(read(KEYS.USERS, []).find(function (u) { return u.id === id; }));
    },

    getByEmail: function (email) {
      if (MODE === 'server') return httpGet('/user.php?email=' + email);
      return Promise.resolve(read(KEYS.USERS, []).find(function (u) { return u.email === email; }));
    },

    create: function (userData) {
      if (MODE === 'server') return httpPost('/register.php', userData);

      const users = read(KEYS.USERS, []);
      if (users.find(function (u) { return u.email === userData.email; })) {
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
  if (MODE === 'server') {
    return httpPost('/login.php', {
      email: email,
      password: password
    } ).then(function(result) {
      if (result.success && result.user) {
        write(KEYS.CURRENT_USER, result.user);
      }

      return result;
    });
  }

  const user = read(KEYS.USERS, []).find(function(u) {
    return u.email === email;
  });

  if (!user) {
    return Promise.resolve({
      success: false,
      error: 'لا يوجد حساب بهذا البريد'
    });
  }

  if (user.password !== password) {
    return Promise.resolve({
      success: false,
      error: 'كلمة المرور غير صحيحة'
    });
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role || 'user'
  };

  write(KEYS.CURRENT_USER, sessionUser);

  return Promise.resolve({
    success: true,
    user: sessionUser
  });
}
,

    logout: function () {
      if (MODE === 'server') {
        return httpPost('/logout.php', {}).then(function (result) {
          localStorage.removeItem(KEYS.CURRENT_USER);
          return result;
        });
      }
      localStorage.removeItem(KEYS.CURRENT_USER);
    },

    getCurrent: function () {
      try {
        const raw = localStorage.getItem(KEYS.CURRENT_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    validateSession: function () {
      if (MODE !== 'server') return Promise.resolve(this.getCurrent());
      return httpGet('/me.php').then(function (result) {
        if (result.success && result.user) {
          write(KEYS.CURRENT_USER, result.user);
          return result.user;
        }
        localStorage.removeItem(KEYS.CURRENT_USER);
        return null;
      }).catch(function () {
        return null;
      });
    },

    isLoggedIn: function () {
      return this.getCurrent() !== null;
    },

    isSuperAdmin: function () {
      const u = this.getCurrent();
      return u && u.role === 'super_admin';
    },

    isAdmin: function () {
      const u = this.getCurrent();
      return u && (u.role === 'admin' || u.role === 'super_admin');
    },

    isRegularUser: function () {
      const u = this.getCurrent();
      return u && u.role === 'user';
    },

    seedAdmins: function () {
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

      admins.forEach(function (admin) {
        if (!users.find(function (u) { return u.email === admin.email; })) {
          users.push(admin);
        }
      });

      write(KEYS.USERS, users);
      localStorage.setItem('souq_admins_seeded', '1');
      console.log('✅ تم إنشاء حسابات الأدمن بنجاح');
    }
  };

  const Stats = {
    get: function () {
      if (MODE === 'server') {
        return httpGet('/stats.php').then(function (result) {
          return result.stats || {};
        });
      }
      return Promise.resolve({
        users: read(KEYS.USERS, []).length,
        listings: read(KEYS.LISTINGS, []).length,
        properties: read(KEYS.LISTINGS, []).filter(function (listing) { return listing.type === 'property'; }).length,
        cars: read(KEYS.LISTINGS, []).filter(function (listing) { return listing.type === 'car'; }).length
      });
    }
  };

  /* ==========================================
     الإعلانات
     ========================================== */
  const Listings = {
    getAll: function (filters) {
      if (MODE === 'server') {
        const q = filters ? new URLSearchParams(filters).toString() : '';
        return httpGet('/listings.php' + (q ? '?' + q : '')).then(function (result) {
          return (result.listings || []).map(normalizeListing);
        });
      }
      return Promise.resolve(read(KEYS.LISTINGS, []));
    },

    getById: function (id) {
      if (MODE === 'server') {
        return httpGet('/listing.php?id=' + encodeURIComponent(id)).then(function (result) {
          return normalizeListing(result.listing);
        });
      }
      return Promise.resolve(read(KEYS.LISTINGS, []).find(function (l) { return l.id === id; }));
    },

    getByType: function (type) {
      if (MODE === 'server') {
        return httpGet('/listings.php?type=' + encodeURIComponent(type)).then(function (result) {
          return (result.listings || []).map(normalizeListing);
        });
      }
      return Promise.resolve(read(KEYS.LISTINGS, []).filter(function (l) { return l.type === type; }));
    },

    getByUser: function (userId) {
      if (MODE === 'server') {
        return httpGet('/my_listings.php').then(function (result) {
          return (result.listings || []).map(normalizeListing);
        });
      }
      return Promise.resolve(read(KEYS.LISTINGS, []).filter(function (l) { return l.userId === userId; }));
    },

    getFeatured: function (type, limit) {
      limit = limit || 4;
      if (MODE === 'server') {
        return httpGet('/listings.php?type=' + encodeURIComponent(type) + '&featured=1&limit=' + limit)
          .then(function (result) { return (result.listings || []).map(normalizeListing); });
      }
      return Promise.resolve(read(KEYS.LISTINGS, [])
        .filter(function (l) { return l.type === type && l.featured; })
        .slice(0, limit));
    },

    getLatest: function (type, limit) {
      limit = limit || 4;
      if (MODE === 'server') {
        return httpGet('/listings.php?type=' + encodeURIComponent(type) + '&limit=' + limit)
          .then(function (result) { return (result.listings || []).map(normalizeListing); });
      }
      return Promise.resolve(read(KEYS.LISTINGS, [])
        .filter(function (l) { return l.type === type; })
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
        .slice(0, limit));
    },

    create: function (listingData) {
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
        negotiable: listingData.negotiable || '',
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

    update: function (id, updates) {
      if (MODE === 'server') return httpPost('/update_listing.php', Object.assign({ id: id }, updates));

      const listings = read(KEYS.LISTINGS, []);
      const index = listings.findIndex(function (l) { return l.id === id; });
      if (index === -1) return Promise.resolve({ success: false, error: 'الإعلان غير موجود' });

      listings[index] = Object.assign({}, listings[index], updates, { updatedAt: new Date().toISOString() });
      write(KEYS.LISTINGS, listings);
      return Promise.resolve({ success: true, listing: listings[index] });
    },

    updateStatus: function (id, status) {
      if (MODE === 'server') return httpPost('/update_listing.php', { id: id, status: status });

      const listings = read(KEYS.LISTINGS, []);
      const index = listings.findIndex(function (l) { return l.id === id; });
      if (index === -1) return Promise.resolve({ success: false, error: 'الإعلان غير موجود' });

      listings[index].status = status;
      listings[index].updatedAt = new Date().toISOString();
      write(KEYS.LISTINGS, listings);
      return Promise.resolve({ success: true, listing: listings[index] });
    },

    delete: function (id) {
      if (MODE === 'server') return httpPost('/delete_listing.php', { id: id });

      const listings = read(KEYS.LISTINGS, []);
      const filtered = listings.filter(function (l) { return l.id !== id; });
      if (filtered.length === listings.length) return Promise.resolve({ success: false, error: 'الإعلان غير موجود' });

      write(KEYS.LISTINGS, filtered);
      return Promise.resolve({ success: true });
    }
  };

  /* ==========================================
     المفضلة
     ========================================== */
  const Favorites = {
    getAll: function () {
      if (MODE === 'server') {
        return httpGet('/favorites.php').then(function (result) {
          return Array.isArray(result.favorites) ? result.favorites : [];
        });
      }
      const user = Users.getCurrent();
      if (!user) return Promise.resolve([]);
      const all = read(KEYS.FAVORITES, {});
      return Promise.resolve(all[user.id] || []);
    },

    isFavorite: function (listingId) {
      return this.getAll().then(function (favs) {
        return favs.indexOf(listingId) !== -1;
      });
    },

    toggle: function (listingId) {
      if (MODE === 'server') return httpPost('/toggle_favorite.php', { listing_id: listingId });

      const user = Users.getCurrent();
      if (!user) return Promise.resolve({ success: false, error: 'يجب تسجيل الدخول' });

      const all = read(KEYS.FAVORITES, {});
      const userFavs = all[user.id] || [];

      if (userFavs.indexOf(listingId) !== -1) {
        all[user.id] = userFavs.filter(function (id) { return id !== listingId; });
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
    isLoggedIn: function () {
      return Users.getCurrent() !== null;
    },

    isAdmin: function () {
      return Users.isAdmin();
    },

    isSuperAdmin: function () {
      return Users.isSuperAdmin();
    }
  };

  /* ==========================================
     الواجهة العامة
     ========================================== */
  return {
    Users: Users,
    Stats: Stats,
    Listings: Listings,
    Favorites: Favorites,
    Auth: Auth,
    generateId: generateId,
    setMode: function (mode) {
      if (mode === 'local' || mode === 'server') {
        MODE = mode;
      }
    },
    getMode: function () { return MODE; },
    clearAll: function () {
      Object.keys(KEYS).forEach(function (key) {
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
document.addEventListener('DOMContentLoaded', function () {
  if (window.API && API.Users && API.Users.seedAdmins) {
    API.Users.seedAdmins();
  }
});