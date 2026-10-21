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
  /* Site images are repo files too, so the Image Manager can replace them
     the same way as product photos. index.html carries a remote fallback
     on each <img> so the page still looks right before you add the files. */
  const DEFAULT_IMAGES = {
    heroMain:  { label: 'Hero — main photo',     url: './assets/hero-main.jpg' },
    heroSmall: { label: 'Hero — inset photo',    url: './assets/hero-inset.jpg' },
    storyMain: { label: 'Our Story — main',      url: './assets/story-main.jpg' },
    storyInset:{ label: 'Our Story — inset',     url: './assets/story-inset.jpg' },
    logo:      { label: 'Brand logo (optional)', url: './assets/logo.png' }
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
    contactNumber: '09690431840',

    /* ----- Site copy: every remaining piece of editable text ----- */
    announcement: 'Your favorite coffee moments start here \u2615  \u00b7  Orders are sent and confirmed through Messenger',

    heroEyebrow: 'BTK Coffee \u00b7 Philippines',
    heroLine1: 'Good Coffee.',
    heroLine2: 'Better Moments.',
    heroLede: 'Crafted with passion, inspired by late-night caf\u00e9 adventures, and made to brighten your day.',
    heroBtnPrimary: 'Order Your Favorites',
    heroBtnSecondary: 'Discover Our Story',

    storyHeading: 'From Late-Night Caf\u00e9 Adventures to Your Favorite Cup',
    storyQuote: '\u201cEvery cup tells a story of curiosity, creativity, and a shared love for coffee. What started as two people chasing their perfect brew became BTK Coffee \u2014 and we\u2019re excited to share that passion with you.\u201d',
    storyPara1: 'BTK Coffee was born out of a shared passion for coffee between two people who simply loved exploring different caf\u00e9s every night. What began as a nightly adventure to discover new flavors soon turned into a dream of crafting our own unique blend.',
    storyPara2: 'With countless cups and late-night experiments, we finally created an iced coffee recipe that perfectly matched our palate. After sharing it with friends and receiving overwhelmingly positive feedback, BTK Coffee was officially established.',
    storyBtn: 'Taste What We Built',

    footerBlurb: 'A Filipino coffee shop built from a shared passion for exploring caf\u00e9s and developing the perfect iced coffee.',
    footerExploreHeading: 'Explore',
    footerMenuHeading: 'Menu',
    footerReachHeading: 'Reach Us',
    footerMessengerLabel: 'Facebook Messenger',
    footerMapsLabel: 'Google Maps',
    footerSmall: 'Orders placed through this site are requests. They are confirmed by BTK Coffee on Messenger.',
    footerRights: 'All rights reserved.',

    /* ----- Store open/closed indicator (controlled from the dashboard) ----- */
    storeStatusEnabled: true,
    storeOpen: true,
    storeOpenLabel: 'Open today',
    storeClosedLabel: 'Closed today',
    storeOpenNote: 'Accepting orders',
    storeClosedNote: 'Orders reopen soon'
  };

  /* Keys that are free text (validated as trimmed strings, blank allowed
     only where the public page tolerates it). Used by validateContact(). */
  const CONTENT_KEYS = [
    'announcement', 'heroEyebrow', 'heroLine1', 'heroLine2', 'heroLede',
    'heroBtnPrimary', 'heroBtnSecondary', 'storyHeading', 'storyQuote',
    'storyPara1', 'storyPara2', 'storyBtn', 'footerBlurb',
    'footerExploreHeading', 'footerMenuHeading', 'footerReachHeading',
    'footerMessengerLabel', 'footerMapsLabel', 'footerSmall', 'footerRights',
    'storeOpenLabel', 'storeClosedLabel', 'storeOpenNote', 'storeClosedNote'
  ];

  /* Boolean settings carried in the contact/config record. */
  const FLAG_KEYS = ['storeStatusEnabled', 'storeOpen'];

  /* ---------- 4. MENU ----------
     Defaults are injected by script.js on first load (registerMenuDefaults)
     so the catalogue stays authored in one place. --------------- */
  let MENU_DEFAULTS = { categories: [], products: [], addons: [] };

  /* ---------- validation ---------- */
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const isHex = (v) => typeof v === 'string' && HEX.test(v.trim());

  function isSafeUrl(v) {
    if (typeof v !== 'string' || !v.trim()) return false;
    const s = v.trim();
    if (/^(https?:)?\/\//i.test(s)) return true;      // absolute
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return true; // inline upload
    if (/^(\.\/|\/)?assets\//i.test(s)) return true;  // local project asset (assets/…)
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

    // ----- add-ons (optional priced extras, offered per category) -----
    const addons = Array.isArray(menu.addons) ? menu.addons : [];
    const cleanAddons = [];
    const seenAddon = {};
    addons.forEach((a, i) => {
      if (!a || typeof a !== 'object') return;
      const name = String(a.name || '').trim();
      if (!name) { errors.push('Add-on #' + (i + 1) + ' needs a name.'); return; }
      const id = slug(a.id || name);
      if (!id) { errors.push('Add-on "' + name + '" has an unusable name.'); return; }
      if (seenAddon[id]) { errors.push('Duplicate add-on: ' + name); return; }
      const price = Math.round(Number(a.price));
      if (!isFinite(price) || price < 0 || price > 10000000) {
        errors.push('Add-on "' + name + '" has an invalid price.'); return;
      }
      const cats = Array.isArray(a.appliesTo)
        ? a.appliesTo.filter((cid) => !!seenCat[cid]) : [];
      if (!cats.length) { errors.push('Add-on "' + name + '" must apply to at least one existing category.'); return; }
      seenAddon[id] = true;
      cleanAddons.push({
        id: id, name: name.slice(0, 60), price: price,
        note: String(a.note || '').trim().slice(0, 60),
        appliesTo: cats
      });
    });

    if (!cleanProds.length) errors.push('No valid products remain.');
    if (errors.length) return { ok: false, errors: errors };
    return { ok: true, value: { categories: cleanCats, products: cleanProds, addons: cleanAddons }, errors: [] };
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
                  'instructions', 'freeArea', 'pinLocation', 'contactName', 'contactNumber']
                  .concat(CONTENT_KEYS);
    text.forEach((k) => {
      if (typeof c[k] !== 'string') return;
      const v = c[k].trim().slice(0, 1200);
      // Blank site copy would leave a visibly empty element — keep the default.
      if (!v && CONTENT_KEYS.indexOf(k) !== -1) return;
      out[k] = v;
    });

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
    FLAG_KEYS.forEach((k) => {
      if (typeof c[k] === 'boolean') out[k] = c[k];
      else if (c[k] === 'true' || c[k] === 'false') out[k] = (c[k] === 'true');
    });
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
        products: MENU_DEFAULTS.products.map((p) => Object.assign({}, p, { sizes: p.sizes.map((s) => Object.assign({}, s)) })),
        addons: (MENU_DEFAULTS.addons || []).map((a) => Object.assign({}, a, { appliesTo: a.appliesTo.slice() }))
      },
      savedAt: null
    };
  }

  /* ---------- PUBLISHED CONFIG (the repo file) ----------
     data/site-config.json in the GitHub repo is the SOURCE OF TRUTH that
     every visitor sees. localStorage now holds only an admin DRAFT, which
     is never shown to customers unless preview mode is explicitly on.

     Layering, lowest priority first:
       1. built-in defaults (script.js catalogue)
       2. published config fetched from data/site-config.json
       3. local draft  (admin page always; public page only in preview mode)
     --------------------------------------------------------- */
  const REMOTE_PATH = 'data/site-config.json';
  const PREVIEW_KEY = 'btk_preview_draft';

  let published = null;        // validated payload from the repo
  let publishedSha = null;     // blob sha, used for safe overwrite
  let remoteState = 'idle';    // idle | ok | missing | error
  let remoteMessage = '';

  const isAdminPage = () => !!window.BTK_ADMIN;
  const previewOn = () => store.sGet(PREVIEW_KEY) === '1';
  function setPreview(on) { on ? store.sSet(PREVIEW_KEY, '1') : store.sDel(PREVIEW_KEY); }
  /** Should the local draft be layered on top of the published config? */
  // Drafts are only ever layered on the admin page. The public site always
  // renders exactly what is published (preview mode was removed).
  const draftActive = () => isAdminPage();

  function applyParsedInto(base, parsed, label) {
    if (!parsed || typeof parsed !== 'object') return '';
    let note = '';
    const t = validateTheme(parsed.theme);
    const i = validateImages(parsed.images);
    const c = validateContact(parsed.contact);
    if (parsed.theme) base.theme = t.value;
    if (parsed.images) base.images = i.value;
    if (parsed.contact) base.contact = c.value;
    if (parsed.menu) {
      const m = validateMenu(parsed.menu);
      if (m.ok) base.menu = m.value;
      else note = label + ' menu failed validation; the previous menu is being used instead.';
    }
    if (typeof parsed.savedAt === 'string') base.savedAt = parsed.savedAt;
    return note;
  }

  /** Fetch the published config from the repo. Safe to call repeatedly. */
  async function fetchPublished() {
    const url = REMOTE_PATH + '?t=' + Date.now();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.status === 404) {
        remoteState = 'missing';
        remoteMessage = 'No published configuration yet — the site is running on built-in defaults.';
        published = null; cache = null;
        return { ok: true, state: remoteState };
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const parsed = await res.json();
      published = parsed;
      remoteState = 'ok';
      remoteMessage = '';
      cache = null;
      return { ok: true, state: remoteState };
    } catch (e) {
      remoteState = 'error';
      remoteMessage = 'Could not load the published configuration (' + e.message + '). Using defaults.';
      published = null; cache = null;
      return { ok: false, state: remoteState, error: e.message };
    }
  }

  /* ---------- load / save ---------- */
  let cache = null;
  let lastLoadError = '';

  function load(force) {
    if (cache && !force) return cache;
    const base = defaults();
    lastLoadError = '';

    // Layer 2 — published repo config (what customers see).
    if (published) {
      const note = applyParsedInto(base, published, 'Published');
      if (note) lastLoadError = note;
    } else if (remoteState === 'error') {
      lastLoadError = remoteMessage;
    }

    // Layer 3 — local draft (admin page, or public page in preview mode).
    if (draftActive()) {
      const raw = store.get(KEYS.config);
      if (raw) {
        let parsed = null;
        try { parsed = JSON.parse(raw); }
        catch (e) { lastLoadError = 'Your local draft was unreadable and has been ignored.'; }
        if (parsed) {
          const note = applyParsedInto(base, parsed, 'Draft');
          if (note) lastLoadError = note;
        }
      }
    }

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

  /* ---------- PUBLISH: validate, then commit to GitHub ---------- */

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    return btoa(bin);
  }

  /** Full validation of a complete configuration payload. */
  function validateAll(cfg) {
    const t = validateTheme(cfg.theme);
    const i = validateImages(cfg.images);
    const c = validateContact(cfg.contact);
    const m = validateMenu(cfg.menu);
    const errors = [].concat(t.errors, i.errors, c.errors, m.errors);
    return {
      ok: errors.length === 0,
      errors: errors,
      value: {
        version: VERSION,
        theme: t.value, images: i.value, contact: c.value, menu: m.value,
        // savedAt is what load()/the dashboard read; publishedAt documents
        // the commit for anyone reading the JSON file directly.
        savedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Validate the current (draft-merged) configuration and commit it to
   * data/site-config.json in the repo. Nothing is sent unless validation
   * passes completely — an invalid config can never reach the live site.
   *
   * opts.expectSha: if provided and the remote file has moved on, the
   * publish is refused so a second editor's work is not silently clobbered.
   */
  async function publish(opts) {
    const o = opts || {};
    const current = load(true);
    const check = validateAll({
      theme: current.theme, images: current.images,
      contact: current.contact, menu: current.menu
    });
    if (!check.ok) {
      return { ok: false, stage: 'validation', errors: check.errors };
    }

    const s = getRepoSettings();
    if (!s.owner || !s.repo) {
      return { ok: false, stage: 'config', errors: ['Set the repository owner and name in the Image Manager first.'] };
    }
    if (!ghToken.has()) {
      return { ok: false, stage: 'auth', errors: ['No GitHub token is active for this tab. Add one in the Image Manager.'] };
    }

    // Concurrency guard: refuse if someone else published since we loaded.
    try {
      const liveSha = await ghGetSha(REMOTE_PATH);
      if (o.expectSha !== undefined && liveSha && o.expectSha && liveSha !== o.expectSha && !o.force) {
        return {
          ok: false, stage: 'conflict', sha: liveSha,
          errors: ['The published configuration changed in GitHub since you loaded this page. Reload to pull the latest, or publish again to overwrite it.']
        };
      }
    } catch (e) {
      return { ok: false, stage: 'network', errors: ['Could not reach GitHub: ' + e.message] };
    }

    const json = JSON.stringify(check.value, null, 2) + '\n';
    try {
      const res = await ghPutFile(REMOTE_PATH, utf8ToBase64(json),
        o.message || 'Update site configuration via BTK Superadmin');
      published = check.value;
      publishedSha = await ghGetSha(REMOTE_PATH).catch(() => null);
      cache = null;
      return {
        ok: true, replaced: res.replaced, commitUrl: res.commitUrl,
        path: REMOTE_PATH, sha: publishedSha, errors: []
      };
    } catch (e) {
      return { ok: false, stage: 'commit', errors: [e.message] };
    }
  }

  /** Does the local draft differ from what is published? */
  function draftDiffers() {
    const raw = store.get(KEYS.config);
    if (!raw) return false;
    let d; try { d = JSON.parse(raw); } catch (e) { return false; }
    const base = defaults();
    if (published) applyParsedInto(base, published, 'Published');
    const pub = JSON.stringify({ theme: base.theme, images: base.images, contact: base.contact, menu: base.menu });
    const merged = defaults();
    if (published) applyParsedInto(merged, published, 'Published');
    applyParsedInto(merged, d, 'Draft');
    const drafted = JSON.stringify({ theme: merged.theme, images: merged.images, contact: merged.contact, menu: merged.menu });
    return pub !== drafted;
  }

  function discardDraft() { store.del(KEYS.config); cache = null; }

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
      if (typeof c[k] !== 'string' || !c[k]) return;
      // Newlines typed in the dashboard become real line breaks. Text is set
      // via textContent per segment, so no markup can be injected.
      if (c[k].indexOf('\n') === -1) { el.textContent = c[k]; return; }
      el.textContent = '';
      c[k].split('\n').forEach((part, i) => {
        if (i) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(part));
      });
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
    if (c.brand) document.title = c.brand + ' | ' + (c.tagline || '').replace(/\n/g, ' ');
    applyStoreStatus(c);
  }

  /** Header open/closed badge. Hidden entirely when disabled. */
  function applyStoreStatus(contact) {
    const c = contact || load().contact;
    const host = document.querySelector('[data-store-status]');
    if (!host) return;
    if (c.storeStatusEnabled === false) { host.hidden = true; return; }
    host.hidden = false;
    const open = c.storeOpen !== false;
    host.classList.toggle('is-open', open);
    host.classList.toggle('is-closed', !open);
    const label = host.querySelector('[data-store-label]');
    const note = host.querySelector('[data-store-note]');
    if (label) label.textContent = open ? (c.storeOpenLabel || 'Open') : (c.storeClosedLabel || 'Closed');
    if (note) {
      const n = open ? c.storeOpenNote : c.storeClosedNote;
      note.textContent = n || '';
      note.hidden = !n;
    }
    host.setAttribute('aria-label',
      (open ? 'Store status: open. ' : 'Store status: closed. ') +
      (open ? (c.storeOpenNote || '') : (c.storeClosedNote || '')));
  }

  /* ---------- image binding on the public page ---------- */
  function applyImages(images) {
    const imgs = images || load().images;
    document.querySelectorAll('[data-img-slot]').forEach((el) => {
      const k = el.getAttribute('data-img-slot');
      const url = imgs[k];
      // Swap to the remote fallback if the repo file is missing / not pushed yet.
      if (!el.dataset.fbBound) {
        el.dataset.fbBound = '1';
        el.addEventListener('error', function () {
          const fb = el.getAttribute('data-fallback');
          if (fb && el.getAttribute('src') !== fb) el.setAttribute('src', fb);
          else el.style.visibility = 'hidden';
        });
      }
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

  /* ---------- 4b. GITHUB REPO IMAGE STORAGE ----------
     Images live as real files in the repository (./assets/products/…),
     NOT as base64 blobs in localStorage. The dashboard offers two ways to
     replace a file, both of which end with the actual repo file changing:

       (A) Download for commit  — no token, zero risk. The dashboard
           renames/compresses the image to the exact target filename and
           downloads it; you drop it into assets/products/ and push.

       (B) Commit to GitHub     — optional. Uses the GitHub REST Contents
           API with a fine-grained Personal Access Token to PUT the file
           straight into the repo. This is a genuine commit.

     HONESTY: (B) puts a write-capable token in your browser. It is kept in
     sessionStorage (cleared when the tab closes) and never written to
     localStorage, but any script on this origin could still read it.
     Use a fine-grained token limited to ONE repo with ONLY
     "Contents: Read and write", and revoke it when you are done.
     --------------------------------------------------------- */
  const REPO_KEYS = { settings: 'btk_repo_settings_v1', token: 'btk_gh_token_v1' };
  const DEFAULT_REPO = { owner: '', repo: '', branch: 'main', dir: 'assets' };

  function getRepoSettings() {
    try {
      const s = JSON.parse(store.get(REPO_KEYS.settings) || 'null');
      if (!s || typeof s !== 'object') return Object.assign({}, DEFAULT_REPO);
      return {
        owner: String(s.owner || '').trim(),
        repo: String(s.repo || '').trim(),
        branch: String(s.branch || 'main').trim() || 'main',
        dir: String(s.dir || DEFAULT_REPO.dir).trim().replace(/^\/+|\/+$/g, '') || DEFAULT_REPO.dir
      };
    } catch (e) { return Object.assign({}, DEFAULT_REPO); }
  }
  function saveRepoSettings(s) {
    const clean = {
      owner: String(s.owner || '').trim().replace(/[^\w.-]/g, ''),
      repo: String(s.repo || '').trim().replace(/[^\w.-]/g, ''),
      branch: String(s.branch || 'main').trim().replace(/[^\w./-]/g, '') || 'main',
      dir: String(s.dir || DEFAULT_REPO.dir).trim().replace(/^\/+|\/+$/g, '').replace(/[^\w./-]/g, '')
    };
    if (!clean.owner || !clean.repo) return { ok: false, errors: ['Repository owner and name are required.'] };
    return store.set(REPO_KEYS.settings, JSON.stringify(clean))
      ? { ok: true, value: clean, errors: [] }
      : { ok: false, errors: ['Could not save repository settings.'] };
  }

  /* Token: sessionStorage ONLY — never localStorage. */
  const ghToken = {
    get() { return store.sGet(REPO_KEYS.token) || ''; },
    set(t) { return store.sSet(REPO_KEYS.token, String(t || '').trim()); },
    clear() { store.sDel(REPO_KEYS.token); },
    has() { return !!(store.sGet(REPO_KEYS.token) || '').trim(); }
  };

  /** "./assets/products/x.jpg" -> "assets/products/x.jpg" */
  function repoPath(url) {
    return String(url || '').replace(/^\.?\//, '').split('?')[0].split('#')[0];
  }
  /** Is this reference a file inside the repo (vs. an external URL)? */
  function isRepoFile(url) {
    const u = String(url || '');
    return !!u && !/^(https?:)?\/\//i.test(u) && !/^data:/i.test(u);
  }
  function fileNameOf(url) {
    const p = repoPath(url);
    return p.substring(p.lastIndexOf('/') + 1);
  }
  function dataUrlToBase64(d) {
    const i = String(d).indexOf(',');
    return i === -1 ? '' : String(d).slice(i + 1);
  }

  async function ghRequest(path, options) {
    const token = ghToken.get();
    if (!token) throw new Error('No GitHub token is set for this session.');
    const res = await fetch('https://api.github.com' + path, Object.assign({
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }, options || {}));
    if (res.status === 401) throw new Error('Token rejected (401). Check the token is valid and not expired.');
    if (res.status === 403) throw new Error('Forbidden (403). The token likely lacks "Contents: Read and write" on this repo.');
    if (res.status === 404) throw new Error('Not found (404). Check the owner, repository name, and branch.');
    if (res.status === 409) throw new Error('Conflict (409). The branch moved — reload the dashboard and try again.');
    if (res.status === 422) throw new Error('Rejected (422). The file path or branch is invalid.');
    return res;
  }

  /** Verify the token can see the repo. Returns {ok, message}. */
  async function ghTestConnection() {
    const s = getRepoSettings();
    if (!s.owner || !s.repo) return { ok: false, message: 'Set the repository owner and name first.' };
    try {
      const res = await ghRequest('/repos/' + s.owner + '/' + s.repo, { method: 'GET' });
      if (!res.ok) return { ok: false, message: 'GitHub returned ' + res.status + '.' };
      const data = await res.json();
      if (data.permissions && data.permissions.push === false) {
        return { ok: false, message: 'Connected, but this token cannot write to ' + data.full_name + '.' };
      }
      return { ok: true, message: 'Connected to ' + data.full_name + ' (branch: ' + s.branch + ').' };
    } catch (e) { return { ok: false, message: e.message }; }
  }

  /** Current blob SHA for a file, or null if it does not exist yet. */
  async function ghGetSha(path) {
    const s = getRepoSettings();
    const url = '/repos/' + s.owner + '/' + s.repo + '/contents/' +
      path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(s.branch);
    try {
      const res = await ghRequest(url, { method: 'GET' });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.sha ? data.sha : null;
    } catch (e) {
      if (/404/.test(e.message)) return null;
      throw e;
    }
  }

  /**
   * Create or REPLACE a file in the repo. Supplying the existing sha makes
   * GitHub overwrite it, which is exactly "replace what is saved in GitHub".
   */
  async function ghPutFile(path, base64, message) {
    const s = getRepoSettings();
    if (!s.owner || !s.repo) throw new Error('Repository owner and name are not set.');
    const sha = await ghGetSha(path);
    const body = {
      message: message || ('Update ' + path + ' via BTK Superadmin'),
      content: base64,
      branch: s.branch
    };
    if (sha) body.sha = sha;

    const res = await ghRequest(
      '/repos/' + s.owner + '/' + s.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/'),
      { method: 'PUT', body: JSON.stringify(body) }
    );
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = j.message ? ' — ' + j.message : ''; } catch (e) {}
      throw new Error('GitHub returned ' + res.status + detail);
    }
    const out = await res.json();
    return {
      replaced: !!sha,
      commitUrl: out.commit && out.commit.html_url ? out.commit.html_url : '',
      path: path
    };
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

    registerMenuDefaults(categories, products, addons) {
      MENU_DEFAULTS = {
        addons: (addons || []).map((a) => ({
          id: a.id, name: a.name, price: a.price,
          note: a.note || '', appliesTo: (a.appliesTo || []).slice()
        })),
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
    save: save,                 // saves a LOCAL DRAFT only
    saveDraft: save,
    resetSection: resetSection,
    loadError: () => lastLoadError,
    hasSaved: () => !!store.get(KEYS.config),

    // published-config lifecycle
    REMOTE_PATH: REMOTE_PATH,
    fetchPublished: fetchPublished,
    publish: publish,
    validateAll: validateAll,
    draftDiffers: draftDiffers,
    discardDraft: discardDraft,
    hasDraft: () => !!store.get(KEYS.config),
    remoteState: () => remoteState,
    remoteMessage: () => remoteMessage,
    publishedSha: () => publishedSha,
    setPublishedSha: (s) => { publishedSha = s; },
    setPreview: setPreview,
    previewOn: previewOn,
    isAdminPage: isAdminPage,

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

    // GitHub repo image storage
    getRepoSettings: getRepoSettings,
    saveRepoSettings: saveRepoSettings,
    ghToken: ghToken,
    ghTestConnection: ghTestConnection,
    ghGetSha: ghGetSha,
    ghPutFile: ghPutFile,
    repoPath: repoPath,
    isRepoFile: isRepoFile,
    fileNameOf: fileNameOf,
    dataUrlToBase64: dataUrlToBase64,

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
