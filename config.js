/* ============================================================
   BTK Coffee — config.js
   SHARED CONFIGURATION LAYER (loaded by index.html AND admin.html)

   This is the single source of truth bridging the public website
   and the Superadmin dashboard. It owns:
     • theme colours   • site images   • contact details
     • menu categories + products (overrides for script.js defaults)
     • the admin credential record (prototype only — see SECURITY note)

   SECURITY NOTE (read this):
   There is no backend in this project. Everything below lives in the
   visitor's own browser (localStorage). A password checked in JavaScript
   is NOT a security boundary — anyone can read this file or edit storage
   via DevTools. This is a usable PROTOTYPE for a single operator on a
   trusted machine. See README.md §"Superadmin" for what a real backend
   must take over before this is production-secure.
   ============================================================ */
(function (global) {
  'use strict';

  const VERSION = 3;
  const KEYS = {
    config: 'btk_site_config_v3',
    session: 'btk_admin_session_v1',
    cred: 'btk_admin_cred_v1',
    attempts: 'btk_admin_attempts_v1'
  };

  /* ---------- storage helpers (never throw) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    sGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sSet(k, v) { try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; } },
    sDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- 1. THEME ----------
     Each entry maps a friendly label to the CSS custom properties in
     style.css that it drives. Changing one key updates every var listed. */
  const THEME_SCHEMA = [
    { key: 'primary',    label: 'Primary brand colour',  vars: ['--khaki'],                  def: '#A89F79' },
    { key: 'secondary',  label: 'Secondary brand colour',vars: ['--khaki-deep'],             def: '#817653' },
    { key: 'background', label: 'Page background',       vars: ['--cream'],                  def: '#F7F4EC' },
    { key: 'surface',    label: 'Card / surface',        vars: ['--white', '--ivory'],       def: '#FFFFFF' },
    { key: 'heading',    label: 'Heading text',          vars: ['--ink'],                    def: '#352F28' },
    { key: 'bodyText',   label: 'Body text',             vars: ['--body-text'],              def: '#352F28' },
    { key: 'muted',      label: 'Muted / secondary text',vars: ['--muted'],                  def: '#777064' },
    { key: 'btnBg',      label: 'Button background',     vars: ['--btn-bg'],                 def: '#817653' },
    { key: 'btnText',    label: 'Button text',           vars: ['--btn-text'],               def: '#FFFDF7' },
    { key: 'btnHover',   label: 'Button hover',          vars: ['--btn-hover'],              def: '#352F28' },
    { key: 'border',     label: 'Borders / dividers',    vars: ['--line'],                   def: '#E6E0D4' },
    { key: 'accent',     label: 'Accent / highlight',    vars: ['--beige'],                  def: '#E8DFC9' }
  ];

  const DEFAULT_THEME = THEME_SCHEMA.reduce((o, s) => { o[s.key] = s.def; return o; }, {});

  /* ---------- 2. SITE IMAGES ----------
     Slots are bound in index.html via data-img-slot="<key>".
     Product images live on the product records instead. */
  const px = (id, w, h) =>
    'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id +
    '.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=' + w + '&h=' + h;

  const DEFAULT_IMAGES = {
    heroMain:  { label: 'Hero — main photo',   url: px(4869289, 700, 900) },
    heroSmall: { label: 'Hero — inset photo',  url: px(37105717, 500, 500) },
    storyMain: { label: 'Our Story — main',    url: px(20342119, 700, 840) },
    storyInset:{ label: 'Our Story — inset',   url: px(7808403, 420, 420) },
    logo:      { label: 'Brand logo (optional)', url: '' }
  };

  /* ---------- 3. CONTACT / LOCATION ----------
     Only values the business actually supplied. Blank = not displayed. */
  const DEFAULT_CONTACT = {
    brand: 'BTK Coffee',
    tagline: 'Brewed to Brighten Your Day',
    messenger: 'https://m.me/btkcoffeeeee',
    facebook: '',
    maps: 'https://maps.app.goo.gl/x8PXrcovtmqqKweg9?g_st=ipc',
    heading: 'Your Next Coffee Moment Is Waiting',
    description: 'Send us a message or drop by — we\u2019d love to brew for you.',
    phone: '',
    email: '',
    address: '',
    instructions: 'Hours, delivery coverage and payment methods are confirmed on Messenger.',
    // delivery advisory (added in the previous feature)
    freeArea: 'Barangay 176-A and nearby barangays',
    pinLocation: 'BTK Coffee or Haidross',
    contactName: 'Resty or Jezzel',
    contactNumber: '09690431840'
  };

  /* ---------- 4. MENU ----------
     Defaults are injected by script.js on first load (registerMenuDefaults)
     so the catalogue stays authored in one place. --------------- */
  let MENU_DEFAULTS = { categories: [], products: [] };

  /* ---------- validation ---------- */
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const isHex = (v) => typeof v === 'string' && HEX.test(v.trim());

  function isSafeUrl(v) {
    if (typeof v !== 'string' || !v.trim()) return false;
    const s = v.trim();
    if (/^(https?:)?\/\//i.test(s)) return true;      // absolute
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return true; // inline upload
    if (/^(\.\/|\/)?assets\//i.test(s)) return true;  // local project asset
    return false;
  }

  function isHttpUrl(v) {
    if (typeof v !== 'string' || !v.trim()) return false;
    try { const u = new URL(v.trim()); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch (e) { return false; }
  }

  const slug = (s) => String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

  /** Deep-validate a menu payload. Returns {ok, value, errors}. */
  function validateMenu(menu) {
    const errors = [];
    if (!menu || typeof menu !== 'object') return { ok: false, errors: ['Menu data is missing.'] };

    const cats = Array.isArray(menu.categories) ? menu.categories : [];
    const prods = Array.isArray(menu.products) ? menu.products : [];
    if (!cats.length) errors.push('At least one category is required.');
    if (!prods.length) errors.push('At least one product is required.');

    const cleanCats = [];
    const seenCat = {};
    cats.forEach((c, i) => {
      const id = slug(c && (c.id || c.name));
      const name = String((c && c.name) || '').trim();
      if (!id || !name) { errors.push('Category #' + (i + 1) + ' needs a name.'); return; }
      if (seenCat[id]) { errors.push('Duplicate category: ' + name); return; }
      seenCat[id] = true;
      cleanCats.push({ id: id, name: name.slice(0, 40) });
    });

    const cleanProds = [];
    const seenProd = {};
    prods.forEach((p, i) => {
      const label = (p && p.name) ? p.name : 'Product #' + (i + 1);
      if (!p || typeof p !== 'object') { errors.push(label + ' is invalid.'); return; }
      const name = String(p.name || '').trim();
      if (!name) { errors.push('Product #' + (i + 1) + ' needs a name.'); return; }

      const id = slug(p.id || name);
      if (seenProd[id]) { errors.push('Duplicate product id for "' + name + '".'); return; }

      if (!seenCat[p.cat]) { errors.push('"' + name + '" uses a category that does not exist.'); return; }

      const sizes = Array.isArray(p.sizes) ? p.sizes : [];
      if (!sizes.length) { errors.push('"' + name + '" needs at least one size/serving option.'); return; }

      const cleanSizes = [];
      const seenSize = {};
      let sizeBad = false;
      sizes.forEach((s) => {
        const sl = String((s && s.label) || '').trim();
        const price = Math.round(Number(s && s.price));
        if (!sl) { errors.push('"' + name + '" has a size with no label.'); sizeBad = true; return; }
        if (seenSize[sl.toLowerCase()]) { errors.push('"' + name + '" repeats the size "' + sl + '".'); sizeBad = true; return; }
        if (!isFinite(price) || price < 0 || price > 10000000) {
          errors.push('"' + name + ' — ' + sl + '" has an invalid price.'); sizeBad = true; return;
        }
        seenSize[sl.toLowerCase()] = true;
        cleanSizes.push({ label: sl.slice(0, 24), price: price });
      });
      if (sizeBad || !cleanSizes.length) return;

      seenProd[id] = true;
      cleanProds.push({
        id: id,
        cat: p.cat,
        name: name.slice(0, 60),
        desc: String(p.desc || '').trim().slice(0, 220),
        img: isSafeUrl(p.img) ? String(p.img).trim() : '',
        sizes: cleanSizes,
        featured: !!p.featured,
        available: p.available !== false,
        boxRule: (p.boxRule === 'all' || Array.isArray(p.boxRule)) ? p.boxRule : null
      });
    });

    if (!cleanProds.length) errors.push('No valid products remain.');
    if (errors.length) return { ok: false, errors: errors };
    return { ok: true, value: { categories: cleanCats, products: cleanProds }, errors: [] };
  }

  function validateTheme(theme) {
    const out = {};
    const errors = [];
    THEME_SCHEMA.forEach((s) => {
      const v = theme && theme[s.key];
      if (isHex(v)) out[s.key] = v.trim().toUpperCase();
      else { out[s.key] = s.def; if (v !== undefined) errors.push('Invalid colour for ' + s.label + '.'); }
    });
    return { ok: errors.length === 0, value: out, errors: errors };
  }

  function validateContact(c) {
    const out = Object.assign({}, DEFAULT_CONTACT);
    const errors = [];
    if (!c || typeof c !== 'object') return { ok: false, value: out, errors: ['Contact data missing.'] };

    const text = ['brand', 'tagline', 'heading', 'description', 'phone', 'email', 'address',
                  'instructions', 'freeArea', 'pinLocation', 'contactName', 'contactNumber'];
    text.forEach((k) => { if (typeof c[k] === 'string') out[k] = c[k].trim().slice(0, 400); });

    if (!out.brand) { out.brand = DEFAULT_CONTACT.brand; errors.push('Business name cannot be empty.'); }

    ['messenger', 'maps', 'facebook'].forEach((k) => {
      const v = (c[k] == null ? '' : String(c[k])).trim();
      if (!v) { out[k] = (k === 'facebook') ? '' : DEFAULT_CONTACT[k]; return; }
      if (!isHttpUrl(v)) { errors.push('"' + k + '" must be a valid http(s) URL.'); out[k] = DEFAULT_CONTACT[k]; return; }
      out[k] = v;
    });

    if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) {
      errors.push('Email address looks invalid.'); out.email = '';
    }
    return { ok: errors.length === 0, value: out, errors: errors };
  }

  function validateImages(imgs) {
    const out = {};
    const errors = [];
    Object.keys(DEFAULT_IMAGES).forEach((k) => {
      const v = imgs && imgs[k];
      if (v === '' ) { out[k] = ''; return; }                 // intentionally cleared
      if (typeof v === 'string' && isSafeUrl(v)) { out[k] = v.trim(); return; }
      if (v !== undefined && v !== null) errors.push('Invalid image URL for ' + DEFAULT_IMAGES[k].label + '.');
      out[k] = DEFAULT_IMAGES[k].url;
    });
    return { ok: errors.length === 0, value: out, errors: errors };
  }

  /* ---------- defaults assembly ---------- */
  function defaults() {
    return {
      version: VERSION,
      theme: Object.assign({}, DEFAULT_THEME),
      images: Object.keys(DEFAULT_IMAGES).reduce((o, k) => { o[k] = DEFAULT_IMAGES[k].url; return o; }, {}),
      contact: Object.assign({}, DEFAULT_CONTACT),
      menu: {
        categories: MENU_DEFAULTS.categories.map((c) => Object.assign({}, c)),
        products: MENU_DEFAULTS.products.map((p) => Object.assign({}, p, { sizes: p.sizes.map((s) => Object.assign({}, s)) }))
      },
      savedAt: null
    };
  }

  /* ---------- load / save ---------- */
  let cache = null;
  let lastLoadError = '';

  function load(force) {
    if (cache && !force) return cache;
    const base = defaults();
    const raw = store.get(KEYS.config);
    lastLoadError = '';
    if (!raw) { cache = base; return cache; }

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      lastLoadError = 'Saved configuration was unreadable and has been ignored. Defaults are in use.';
      cache = base; return cache;
    }
    if (!parsed || typeof parsed !== 'object') { cache = base; return cache; }

    const t = validateTheme(parsed.theme);
    const i = validateImages(parsed.images);
    const c = validateContact(parsed.contact);
    base.theme = t.value;
    base.images = i.value;
    base.contact = c.value;

    if (parsed.menu) {
      const m = validateMenu(parsed.menu);
      if (m.ok) base.menu = m.value;
      else lastLoadError = 'Saved menu failed validation; the built-in menu is being used instead.';
    }
    base.savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : null;
    cache = base;
    return cache;
  }

  /** Persist a partial patch. Returns {ok, errors}. Never writes invalid data. */
  function save(patch) {
    const current = load();
    const next = {
      version: VERSION,
      theme: Object.assign({}, current.theme, patch && patch.theme),
      images: Object.assign({}, current.images, patch && patch.images),
      contact: Object.assign({}, current.contact, patch && patch.contact),
      menu: (patch && patch.menu) ? patch.menu : current.menu,
      savedAt: new Date().toISOString()
    };

    const t = validateTheme(next.theme);
    const i = validateImages(next.images);
    const c = validateContact(next.contact);
    const m = validateMenu(next.menu);
    const errors = [].concat(t.errors, i.errors, c.errors, m.errors);
    if (errors.length) return { ok: false, errors: errors };

    const payload = {
      version: VERSION, theme: t.value, images: i.value,
      contact: c.value, menu: m.value, savedAt: next.savedAt
    };
    const json = JSON.stringify(payload);
    if (json.length > 4600000) {
      return { ok: false, errors: ['Configuration is too large for browser storage (~5 MB cap). Use image URLs instead of large uploads.'] };
    }
    if (!store.set(KEYS.config, json)) {
      return { ok: false, errors: ['Could not write to browser storage. It may be full or blocked (private mode).'] };
    }
    cache = null; load(true);
    return { ok: true, errors: [] };
  }

  /** Reset one section (or everything) back to defaults. */
  function resetSection(section) {
    const d = defaults();
    if (!section || section === 'all') { store.del(KEYS.config); cache = null; return { ok: true, errors: [] }; }
    const patch = {};
    if (section === 'theme') patch.theme = d.theme;
    else if (section === 'images') patch.images = d.images;
    else if (section === 'contact') patch.contact = d.contact;
    else if (section === 'menu') patch.menu = d.menu;
    else return { ok: false, errors: ['Unknown section.'] };
    return save(patch);
  }

  /* ---------- theme application ---------- */
  function applyTheme(theme, target) {
    const t = validateTheme(theme || load().theme).value;
    const root = (target || document.documentElement);
    THEME_SCHEMA.forEach((s) => {
      s.vars.forEach((v) => root.style.setProperty(v, t[s.key]));
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && target === undefined) meta.setAttribute('content', t.primary);
  }

  /* ---------- contact binding on the public page ---------- */
  function applyContact(contact) {
    const c = contact || load().contact;
    document.querySelectorAll('[data-cfg-text]').forEach((el) => {
      const k = el.getAttribute('data-cfg-text');
      if (typeof c[k] === 'string' && c[k]) el.textContent = c[k];
    });
    document.querySelectorAll('[data-cfg-href]').forEach((el) => {
      const k = el.getAttribute('data-cfg-href');
      if (typeof c[k] === 'string' && c[k]) el.setAttribute('href', c[k]);
    });
    // optional blocks: shown only when a value exists
    document.querySelectorAll('[data-cfg-optional]').forEach((el) => {
      const k = el.getAttribute('data-cfg-optional');
      const has = typeof c[k] === 'string' && c[k].trim() !== '';
      el.hidden = !has;
      if (has) {
        const val = el.querySelector('[data-cfg-value]');
        if (val) {
          val.textContent = c[k];
          if (val.tagName === 'A') {
            if (k === 'phone') val.setAttribute('href', 'tel:' + c[k].replace(/[^\d+]/g, ''));
            else if (k === 'email') val.setAttribute('href', 'mailto:' + c[k]);
            else if (k === 'facebook') val.setAttribute('href', c[k]);
          }
        }
      }
    });
    if (c.brand) document.title = c.brand + ' | ' + (c.tagline || '');
  }

  /* ---------- image binding on the public page ---------- */
  function applyImages(images) {
    const imgs = images || load().images;
    document.querySelectorAll('[data-img-slot]').forEach((el) => {
      const k = el.getAttribute('data-img-slot');
      const url = imgs[k];
      if (typeof url === 'string' && url) el.setAttribute('src', url);
    });
    const logoHosts = document.querySelectorAll('[data-logo-host]');
    if (imgs.logo) {
      logoHosts.forEach((host) => {
        if (host.querySelector('img.cfg-logo')) return;
        const img = document.createElement('img');
        img.className = 'cfg-logo brand-img';
        img.src = imgs.logo;
        img.alt = (load().contact.brand || 'BTK Coffee') + ' logo';
        img.addEventListener('error', () => { img.remove(); host.querySelectorAll('svg').forEach((s) => { s.style.display = ''; }); });
        host.querySelectorAll('svg').forEach((s) => { s.style.display = 'none'; });
        host.appendChild(img);
      });
    }
  }

  /* ---------- 5. ADMIN CREDENTIALS (prototype) ----------
     Fixed username. Password stored as PBKDF2-SHA-256 hash + random salt.
     Hashing stops casual shoulder-surfing of the stored value; it does NOT
     make this secure, because the check happens in the browser. ---------- */
  const FIXED_USERNAME = 'superadmin';
  const DEFAULT_PASSWORD = 'BTKcoffee2026!';
  const PBKDF2_ITER = 150000;

  function bufToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function randomSaltHex() {
    const a = new Uint8Array(16);
    (global.crypto || {}).getRandomValues ? global.crypto.getRandomValues(a)
      : a.forEach((_, i) => { a[i] = Math.floor(Math.random() * 256); });
    return bufToHex(a.buffer);
  }

  async function hashPassword(password, saltHex) {
    const subtle = global.crypto && global.crypto.subtle;
    const enc = new TextEncoder();
    if (!subtle) {
      // Extremely weak fallback for insecure contexts (file:// in some browsers).
      let h = 0; const s = saltHex + password;
      for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
      return 'weak:' + (h >>> 0).toString(16);
    }
    const key = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(saltHex), iterations: PBKDF2_ITER, hash: 'SHA-256' },
      key, 256
    );
    return bufToHex(bits);
  }

  async function getCredential() {
    const raw = store.get(KEYS.cred);
    if (raw) {
      try {
        const c = JSON.parse(raw);
        if (c && c.salt && c.hash) return c;
      } catch (e) { /* fall through to re-seed */ }
    }
    const salt = randomSaltHex();
    const hash = await hashPassword(DEFAULT_PASSWORD, salt);
    const cred = { salt: salt, hash: hash, updatedAt: null, isDefault: true };
    store.set(KEYS.cred, JSON.stringify(cred));
    return cred;
  }

  async function verifyPassword(password) {
    const cred = await getCredential();
    const attempt = await hashPassword(String(password || ''), cred.salt);
    // constant-ish time compare
    if (attempt.length !== cred.hash.length) return false;
    let diff = 0;
    for (let i = 0; i < attempt.length; i++) diff |= attempt.charCodeAt(i) ^ cred.hash.charCodeAt(i);
    return diff === 0;
  }

  async function setPassword(newPassword) {
    const salt = randomSaltHex();
    const hash = await hashPassword(String(newPassword), salt);
    const ok = store.set(KEYS.cred, JSON.stringify({
      salt: salt, hash: hash, updatedAt: new Date().toISOString(), isDefault: false
    }));
    return ok ? { ok: true } : { ok: false, errors: ['Could not save the new password to browser storage.'] };
  }

  function passwordPolicy(pw) {
    const issues = [];
    const s = String(pw || '');
    if (s.length < 12) issues.push('at least 12 characters');
    if (!/[A-Za-z]/.test(s)) issues.push('at least one letter');
    if (!/\d/.test(s)) issues.push('at least one number');
    return { ok: issues.length === 0, issues: issues, strong: /[^A-Za-z0-9]/.test(s) && s.length >= 14 };
  }

  /* ---------- rate limiting (per browser) ---------- */
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 60000;

  function attemptState() {
    try {
      const a = JSON.parse(store.get(KEYS.attempts) || '{}');
      return { count: Number(a.count) || 0, until: Number(a.until) || 0 };
    } catch (e) { return { count: 0, until: 0 }; }
  }
  function lockRemaining() {
    const a = attemptState();
    return Math.max(0, a.until - Date.now());
  }
  function recordFail() {
    const a = attemptState();
    a.count += 1;
    if (a.count >= MAX_ATTEMPTS) { a.until = Date.now() + LOCK_MS; a.count = 0; }
    store.set(KEYS.attempts, JSON.stringify(a));
    return a;
  }
  function clearAttempts() { store.del(KEYS.attempts); }

  /* ---------- session (tab-scoped) ---------- */
  const SESSION_MS = 30 * 60 * 1000;

  function startSession() {
    store.sSet(KEYS.session, JSON.stringify({ user: FIXED_USERNAME, at: Date.now() }));
  }
  function sessionValid() {
    try {
      const s = JSON.parse(store.sGet(KEYS.session) || 'null');
      if (!s || s.user !== FIXED_USERNAME) return false;
      if (Date.now() - Number(s.at) > SESSION_MS) { endSession(); return false; }
      return true;
    } catch (e) { return false; }
  }
  function touchSession() { if (sessionValid()) startSession(); }
  function endSession() { store.sDel(KEYS.session); }

  /* ---------- public API ---------- */
  global.BTKConfig = {
    VERSION: VERSION,
    KEYS: KEYS,
    THEME_SCHEMA: THEME_SCHEMA,
    DEFAULT_IMAGES: DEFAULT_IMAGES,
    FIXED_USERNAME: FIXED_USERNAME,
    DEFAULT_PASSWORD: DEFAULT_PASSWORD,
    MAX_ATTEMPTS: MAX_ATTEMPTS,

    registerMenuDefaults(categories, products) {
      MENU_DEFAULTS = {
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
        products: products.map((p) => ({
          id: p.id, cat: p.cat, name: p.name, desc: p.desc, img: p.img,
          sizes: p.sizes.map((s) => ({ label: s.label, price: s.price })),
          featured: !!p.featured, available: p.available !== false,
          boxRule: p.boxRule || null
        }))
      };
      cache = null;
    },

    defaults: defaults,
    load: load,
    save: save,
    resetSection: resetSection,
    loadError: () => lastLoadError,
    hasSaved: () => !!store.get(KEYS.config),

    validateMenu: validateMenu,
    validateContact: validateContact,
    validateTheme: validateTheme,
    isHex: isHex,
    isHttpUrl: isHttpUrl,
    isSafeUrl: isSafeUrl,
    slug: slug,

    applyTheme: applyTheme,
    applyContact: applyContact,
    applyImages: applyImages,
    applyAll() { const c = load(); applyTheme(c.theme); applyImages(c.images); applyContact(c.contact); },

    getCredential: getCredential,
    verifyPassword: verifyPassword,
    setPassword: setPassword,
    passwordPolicy: passwordPolicy,
    lockRemaining: lockRemaining,
    recordFail: recordFail,
    clearAttempts: clearAttempts,
    startSession: startSession,
    sessionValid: sessionValid,
    touchSession: touchSession,
    endSession: endSession
  };

  /* Apply the theme as early as possible to avoid a colour flash. */
  try { applyTheme(load().theme); } catch (e) { /* defaults already in CSS */ }
})(window);
