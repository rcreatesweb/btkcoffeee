/* ============================================================
   BTK Coffee — script.js
   Vanilla JS. No frameworks, no build step, no backend.
   Money is handled in CENTAVOS (integers) to avoid float errors.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     0. CONFIGURATION
     Update these values when the business confirms them.
     --------------------------------------------------------- */
  const CONFIG = {
    brand: 'BTK Coffee',
    tagline: 'Brewed to Brighten Your Day',
    messenger: 'https://m.me/btkcoffeeeee',
    maps: 'https://maps.app.goo.gl/x8PXrcovtmqqKweg9?g_st=ipc',
    // Fees are NOT configured. Keep at null so nothing is invented.
    serviceFeeCentavos: 0,      // 0 = no service fee charged on this site
    deliveryFeeCentavos: null,  // null = unknown, confirmed on Messenger
    maxQtyPerLine: 30,
    storage: {
      cart: 'btk_cart_v1',
      recent: 'btk_recent_v1',
      lastOrder: 'btk_last_order_v1'
    }
  };

  /* ---------------------------------------------------------
     1. IMAGE HELPERS
     Swap these for local files in /assets/products/ anytime.
     --------------------------------------------------------- */
  const px = (id, w, h) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

  const IMG = {
    americano:   px(31424521, 600, 450),
    latte:       px(38275924, 600, 450),
    caramel:     px(34543111, 600, 450),
    spanish:     px(4869289, 600, 450),
    vanilla:     px(37603073, 600, 450),
    dirtyMatcha: px(37105717, 600, 450),
    hershey:     px(18189024, 600, 450),
    tresLeches:  px(32088360, 600, 450),
    whiteMocha:  px(7808403, 600, 450),
    biscoff:     px(34543111, 600, 450),
    frappe:      px(6413383, 600, 450),
    berry:       px(37603073, 600, 450),
    matcha:      px(37105717, 600, 450),
    cafe:        px(36484101, 600, 450),
    waffleChoc:  px(34390602, 600, 450),
    waffleIce:   px(23913677, 600, 450),
    waffleDessert: px(34965014, 600, 450),
    ramenA:      px(31393431, 600, 450),
    ramenB:      px(26510357, 600, 450),
    ramenC:      px(4224210, 600, 450),
    ramenD:      px(8108042, 600, 450),
    ramenE:      px(6092873, 600, 450),
    fries:       px(6789880, 600, 450),
    friesB:      px(39799203, 600, 450)
  };

  /* ---------------------------------------------------------
     2. CENTRALIZED MENU DATA  (single source of truth)
     Prices are stored in centavos: ₱89 => 8900
     --------------------------------------------------------- */
  const CATEGORIES = [
    { id: 'coffee',  name: 'Coffee' },
    { id: 'frappe',  name: 'Frappe' },
    { id: 'noncoffee', name: 'Non-Coffee' },
    { id: 'waffle',  name: 'Waffle' },
    { id: 'ramyeon', name: 'Ramyeon & Fries' }
  ];

  const P = (php) => Math.round(php * 100);

  const MENU = [
    /* ---- COFFEE ---- */
    { id: 'cof-americano', cat: 'coffee', name: 'Americano', img: IMG.americano,
      desc: 'Clean, bold espresso over ice — the straightforward wake-up cup.',
      sizes: [{ label: '12 oz', price: P(79) }, { label: '16 oz', price: P(89) }] },
    { id: 'cof-latte', cat: 'coffee', name: 'Latte', img: IMG.latte,
      desc: 'Espresso and milk in smooth, easy balance.',
      sizes: [{ label: '12 oz', price: P(79) }, { label: '16 oz', price: P(89) }] },
    { id: 'cof-caramel-macchiato', cat: 'coffee', name: 'Caramel Macchiato', img: IMG.caramel, featured: true,
      desc: 'Milky espresso finished with a ribbon of caramel.',
      sizes: [{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] },
    { id: 'cof-spanish-latte', cat: 'coffee', name: 'Spanish Latte', img: IMG.spanish, featured: true,
      desc: 'Sweet, creamy and rich — a BTK house favorite.',
      sizes: [{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] },
    { id: 'cof-french-vanilla', cat: 'coffee', name: 'French Vanilla', img: IMG.vanilla,
      desc: 'Soft vanilla sweetness folded into espresso and milk.',
      sizes: [{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] },
    { id: 'cof-dirty-matcha', cat: 'coffee', name: 'Dirty Matcha', img: IMG.dirtyMatcha,
      desc: 'Matcha and espresso layered together in one glass.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'cof-hershey-coffee', cat: 'coffee', name: 'Hershey Coffee', img: IMG.hershey,
      desc: 'Chocolatey and cold — coffee with a Hershey twist.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'cof-tres-leches', cat: 'coffee', name: 'Tres Leches', img: IMG.tresLeches,
      desc: 'Dessert-inspired milky coffee, sweet and comforting.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'cof-white-choco-mocha', cat: 'coffee', name: 'White Chocolate Mocha', img: IMG.whiteMocha,
      desc: 'Espresso with mellow white chocolate sweetness.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'cof-biscoff-latte', cat: 'coffee', name: 'Biscoff Latte', img: IMG.biscoff, featured: true,
      desc: 'Spiced cookie-butter flavour stirred through a cold latte.',
      sizes: [{ label: '16 oz', price: P(99) }] },

    /* ---- FRAPPE (16 oz) ---- */
    { id: 'fra-java-chip', cat: 'frappe', name: 'Java Chip', img: IMG.frappe, featured: true,
      desc: 'Blended coffee with chocolate chips — thick and frosty.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-hershey-coffee', cat: 'frappe', name: 'Hershey Coffee Frappe', img: IMG.hershey,
      desc: 'Blended coffee with a deep Hershey chocolate finish.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-dirty-matcha', cat: 'frappe', name: 'Dirty Matcha Frappe', img: IMG.dirtyMatcha,
      desc: 'Matcha and espresso, blended ice-cold.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-white-choco-mocha', cat: 'frappe', name: 'White Chocolate Mocha Frappe', img: IMG.whiteMocha,
      desc: 'Creamy white chocolate blended with coffee.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-biscoff', cat: 'frappe', name: 'Biscoff Frappe', img: IMG.biscoff,
      desc: 'Cookie-butter flavour blended into a frosty cup.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-strawberry', cat: 'frappe', name: 'Strawberry Frappe', img: IMG.berry,
      desc: 'Bright, fruity and ice-blended.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-blueberry', cat: 'frappe', name: 'Blueberry Frappe', img: IMG.berry,
      desc: 'Berry-sweet and refreshingly cold.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-hershey-choco', cat: 'frappe', name: 'Hershey Choco Frappe', img: IMG.waffleDessert,
      desc: 'Full-on chocolate, blended — no coffee needed.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-matcha', cat: 'frappe', name: 'Matcha Frappe', img: IMG.matcha,
      desc: 'Smooth green tea flavour, blended with ice.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-cookies-cream', cat: 'frappe', name: 'Cookies and Cream Frappe', img: IMG.frappe,
      desc: 'Cookies blended into a creamy, frosty cup.',
      sizes: [{ label: '16 oz', price: P(109) }] },
    { id: 'fra-ube', cat: 'frappe', name: 'Ube Frappe', img: IMG.cafe,
      desc: 'Filipino ube flavour, blended ice-cold.',
      sizes: [{ label: '16 oz', price: P(109) }] },

    /* ---- NON-COFFEE ---- */
    { id: 'nc-strawberry', cat: 'noncoffee', name: 'Strawberry', img: IMG.berry,
      desc: 'Fruity and refreshing — a caffeine-free pick.',
      sizes: [{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] },
    { id: 'nc-blueberry', cat: 'noncoffee', name: 'Blueberry', img: IMG.berry,
      desc: 'Sweet berry flavour over plenty of ice.',
      sizes: [{ label: '12 oz', price: P(89) }, { label: '16 oz', price: P(99) }] },
    { id: 'nc-hershey-choco', cat: 'noncoffee', name: 'Hershey Choco', img: IMG.waffleDessert,
      desc: 'Iced chocolate made with Hershey.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'nc-matcha-latte', cat: 'noncoffee', name: 'Matcha Latte', img: IMG.matcha, featured: true,
      desc: 'Green tea and milk — smooth, grassy and calm.',
      sizes: [{ label: '16 oz', price: P(99) }] },
    { id: 'nc-ube-latte', cat: 'noncoffee', name: 'Ube Latte', img: IMG.cafe,
      desc: 'Creamy ube with milk, served cold.',
      sizes: [{ label: '16 oz', price: P(99) }] },

    /* ---- WAFFLE ---- */
    { id: 'waf-chocolate', cat: 'waffle', name: 'Chocolate Waffle', img: IMG.waffleChoc, featured: true,
      desc: 'Warm waffle with chocolate — the classic pair for iced coffee.',
      sizes: [{ label: 'Single', price: P(39) }, { label: 'Double', price: P(49) }] },
    { id: 'waf-caramel', cat: 'waffle', name: 'Caramel Waffle', img: IMG.waffleIce,
      desc: 'Golden waffle drizzled with caramel.',
      sizes: [{ label: 'Single', price: P(39) }, { label: 'Double', price: P(49) }] },
    { id: 'waf-cookies-cream', cat: 'waffle', name: 'Cookies and Cream Waffle', img: IMG.waffleDessert,
      desc: 'Crisp waffle with a cookies-and-cream finish.',
      sizes: [{ label: 'Single', price: P(49) }, { label: 'Double', price: P(59) }] },
    { id: 'waf-strawberry', cat: 'waffle', name: 'Strawberry Waffle', img: IMG.waffleIce,
      desc: 'Waffle with sweet strawberry topping.',
      sizes: [{ label: 'Single', price: P(49) }, { label: 'Double', price: P(59) }] },
    { id: 'waf-blueberry', cat: 'waffle', name: 'Blueberry Waffle', img: IMG.waffleChoc,
      desc: 'Waffle with a blueberry topping.',
      sizes: [{ label: 'Single', price: P(49) }, { label: 'Double', price: P(59) }] },

    /* ---- RAMYEON AND FRIES ---- */
    { id: 'ram-samyang-overload', cat: 'ramyeon', name: 'Samyang Overload', img: IMG.ramenA,
      desc: 'Loaded Samyang — our biggest noodle plate.',
      sizes: [{ label: 'Regular', price: P(159) }] },
    { id: 'ram-cheesy-samyang', cat: 'ramyeon', name: 'Cheesy Samyang', img: IMG.ramenB,
      desc: 'Spicy Samyang noodles with cheese.',
      sizes: [{ label: 'Regular', price: P(129) }] },
    { id: 'ram-jin-overload', cat: 'ramyeon', name: 'Jin Ramen Overload', img: IMG.ramenC,
      desc: 'Jin Ramen served loaded up.',
      sizes: [{ label: 'Regular', price: P(109) }] },
    { id: 'ram-samyang-ala', cat: 'ramyeon', name: 'Samyang Ala-carte', img: IMG.ramenD,
      desc: 'Samyang noodles on their own.',
      sizes: [{ label: 'Regular', price: P(119) }] },
    { id: 'ram-jin-ala', cat: 'ramyeon', name: 'Jin Ramen Ala-carte', img: IMG.ramenE,
      desc: 'Jin Ramen served ala-carte.',
      sizes: [{ label: 'Regular', price: P(89) }] },
    { id: 'ram-cheesy-fries', cat: 'ramyeon', name: 'Cheesy Fries', img: IMG.fries,
      desc: 'Crispy fries topped with cheese.',
      sizes: [{ label: 'Regular', price: P(69) }] }
  ];

  const FEATURED_ORDER = [
    'cof-spanish-latte', 'cof-caramel-macchiato', 'cof-biscoff-latte',
    'fra-java-chip', 'nc-matcha-latte', 'waf-chocolate'
  ];

  const byId = (id) => MENU.find((p) => p.id === id) || null;
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;

  /* ---------------------------------------------------------
     3. UTILITIES
     --------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function peso(centavos) {
    const n = Math.round(Number(centavos) || 0);
    const whole = Math.floor(n / 100);
    const cents = n % 100;
    const grouped = whole.toLocaleString('en-PH');
    return cents === 0 ? '₱' + grouped : '₱' + grouped + '.' + String(cents).padStart(2, '0');
  }

  function priceRange(product) {
    const prices = product.sizes.map((s) => s.price);
    const min = Math.min.apply(null, prices);
    const max = Math.max.apply(null, prices);
    return min === max ? peso(min) : peso(min) + ' / ' + peso(max);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const safeStore = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, val) {
      try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  /* ---------------------------------------------------------
     4. TOASTS
     --------------------------------------------------------- */
  const toastHost = $('#toasts');
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>';
  const INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>';

  function toast(msg, kind) {
    if (!toastHost) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = (kind === 'warn' ? INFO : CHECK) + '<span>' + escapeHtml(msg) + '</span>';
    toastHost.appendChild(el);
    window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  /* ---------------------------------------------------------
     5. CART MODEL
     Line key = productId + '::' + sizeLabel  (distinct selections)
     --------------------------------------------------------- */
  let cart = [];
  let cartRestored = false;

  function lineKey(productId, sizeLabel) { return productId + '::' + sizeLabel; }

  function validateStoredCart(raw) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(parsed)) return [];
    const clean = [];
    parsed.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const product = byId(item.id);
      if (!product) return;
      const size = product.sizes.find((s) => s.label === item.size);
      if (!size) return;
      let qty = parseInt(item.qty, 10);
      if (!isFinite(qty) || qty < 1) return;
      qty = Math.min(qty, CONFIG.maxQtyPerLine);
      if (clean.some((c) => c.key === lineKey(product.id, size.label))) return;
      clean.push({
        key: lineKey(product.id, size.label),
        id: product.id,
        name: product.name,
        size: size.label,
        price: size.price, // always re-read price from the menu (never trust storage)
        qty: qty,
        img: product.img,
        cat: product.cat
      });
    });
    return clean;
  }

  function loadCart() {
    const raw = safeStore.get(CONFIG.storage.cart);
    if (!raw) { cart = []; return; }
    cart = validateStoredCart(raw);
    cartRestored = cart.length > 0;
  }

  function saveCart() {
    safeStore.set(CONFIG.storage.cart, JSON.stringify(
      cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty }))
    ));
  }

  const cartCount = () => cart.reduce((n, i) => n + i.qty, 0);
  const subtotalCentavos = () => cart.reduce((n, i) => n + i.price * i.qty, 0);
  function serviceFee() { return Math.max(0, CONFIG.serviceFeeCentavos || 0); }
  function grandTotal() { return subtotalCentavos() + serviceFee() + (CONFIG.deliveryFeeCentavos || 0); }

  function addToCart(productId, sizeLabel, qty) {
    const product = byId(productId);
    if (!product) { toast('Sorry, that item is unavailable.', 'warn'); return false; }
    const size = product.sizes.find((s) => s.label === sizeLabel);
    if (!size) { toast('Please choose a size first.', 'warn'); return false; }
    let q = parseInt(qty, 10);
    if (!isFinite(q) || q < 1) q = 1;

    const key = lineKey(product.id, size.label);
    const existing = cart.find((i) => i.key === key);
    if (existing) {
      existing.qty = Math.min(CONFIG.maxQtyPerLine, existing.qty + q);
    } else {
      cart.push({
        key: key, id: product.id, name: product.name, size: size.label,
        price: size.price, qty: Math.min(CONFIG.maxQtyPerLine, q),
        img: product.img, cat: product.cat
      });
    }
    persistAndRender();
    toast(product.name + ' (' + size.label + ') added to your order', 'ok');
    return true;
  }

  function changeQty(key, delta) {
    const item = cart.find((i) => i.key === key);
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1) { removeLine(key); return; }
    item.qty = Math.min(CONFIG.maxQtyPerLine, next);
    persistAndRender();
  }

  function removeLine(key) {
    const item = cart.find((i) => i.key === key);
    cart = cart.filter((i) => i.key !== key);
    persistAndRender();
    if (item) toast(item.name + ' removed', 'warn');
  }

  function clearCart(silent) {
    cart = [];
    persistAndRender();
    if (!silent) toast('Cart cleared', 'warn');
  }

  function persistAndRender() {
    saveCart();
    renderCart();
    renderCartBadge();
  }

  /* ---------------------------------------------------------
     6. PRODUCT CARD RENDERING
     --------------------------------------------------------- */
  function cardHtml(product, isFeatured) {
    const sizePills = product.sizes
      .map((s) => '<span class="size-pill">' + escapeHtml(s.label) + ' · ' + peso(s.price) + '</span>')
      .join('');
    const tag = isFeatured
      ? '<span class="card-tag pop">Popular Pick</span>'
      : '<span class="card-tag">' + escapeHtml(catName(product.cat)) + '</span>';
    const priceLabel = product.sizes.length > 1 ? '<small>From</small>' + peso(Math.min.apply(null, product.sizes.map(s => s.price))) : peso(product.sizes[0].price);

    return '' +
      '<article class="card" data-card="' + escapeHtml(product.id) + '">' +
        '<div class="card-media">' +
          '<img src="' + product.img + '" alt="' + escapeHtml(product.name) + ' from BTK Coffee" width="600" height="450" loading="lazy" decoding="async">' +
          tag +
        '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + escapeHtml(catName(product.cat)) + '</p>' +
          '<h3 class="card-name">' + escapeHtml(product.name) + '</h3>' +
          '<p class="card-desc">' + escapeHtml(product.desc) + '</p>' +
          '<div class="card-sizes">' + sizePills + '</div>' +
          '<div class="card-foot">' +
            '<p class="price">' + priceLabel + '</p>' +
            '<button type="button" class="add-btn" data-add="' + escapeHtml(product.id) + '" ' +
              'aria-label="Add ' + escapeHtml(product.name) + ' to your order">Add to Order</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderFeatured() {
    const host = $('#featuredGrid');
    if (!host) return;
    const items = FEATURED_ORDER.map(byId).filter(Boolean);
    host.innerHTML = items.map((p) => cardHtml(p, true)).join('');
  }

  /* ---------------------------------------------------------
     7. MENU: TABS, SEARCH, FILTER
     --------------------------------------------------------- */
  let activeCat = 'all';
  let searchTerm = '';

  function renderTabs() {
    const host = $('#categoryTabs');
    if (!host) return;
    const tabs = [{ id: 'all', name: 'All Items' }].concat(CATEGORIES);
    host.innerHTML = tabs.map((c) => {
      const count = c.id === 'all' ? MENU.length : MENU.filter((p) => p.cat === c.id).length;
      return '<button type="button" class="tab" role="tab" data-cat="' + c.id + '" ' +
        'aria-selected="' + (c.id === activeCat) + '">' + escapeHtml(c.name) +
        ' <span class="count">' + count + '</span></button>';
    }).join('');
  }

  function filteredMenu() {
    const term = searchTerm.trim().toLowerCase();
    return MENU.filter((p) => {
      const catOk = activeCat === 'all' || p.cat === activeCat;
      if (!catOk) return false;
      if (!term) return true;
      return p.name.toLowerCase().indexOf(term) !== -1 ||
             catName(p.cat).toLowerCase().indexOf(term) !== -1;
    });
  }

  function renderMenu() {
    const grid = $('#menuGrid');
    const empty = $('#emptyResults');
    const line = $('#resultsLine');
    if (!grid) return;

    const items = filteredMenu();
    grid.innerHTML = items.map((p) => cardHtml(p, !!p.featured)).join('');

    const hasItems = items.length > 0;
    grid.hidden = !hasItems;
    if (empty) empty.hidden = hasItems;

    if (line) {
      if (!hasItems) {
        line.textContent = '';
      } else {
        const where = activeCat === 'all' ? 'the full menu' : catName(activeCat);
        line.textContent = 'Showing ' + items.length + ' item' + (items.length === 1 ? '' : 's') +
          ' from ' + where + (searchTerm.trim() ? ' matching “' + searchTerm.trim() + '”' : '') + '.';
      }
    }

    $$('.tab', $('#categoryTabs')).forEach((t) => {
      t.setAttribute('aria-selected', String(t.dataset.cat === activeCat));
    });
  }

  /* ---------------------------------------------------------
     8. RECENTLY VIEWED
     --------------------------------------------------------- */
  function getRecent() {
    const raw = safeStore.get(CONFIG.storage.recent);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((id) => !!byId(id)).slice(0, 8) : [];
    } catch (e) { return []; }
  }

  function pushRecent(id) {
    if (!byId(id)) return;
    let list = getRecent().filter((x) => x !== id);
    list.unshift(id);
    list = list.slice(0, 8);
    safeStore.set(CONFIG.storage.recent, JSON.stringify(list));
    renderRecent();
  }

  function renderRecent() {
    const section = $('#recentSection');
    const row = $('#recentRow');
    if (!section || !row) return;
    const list = getRecent().map(byId).filter(Boolean);
    if (!list.length) { section.hidden = true; return; }
    section.hidden = false;
    row.innerHTML = list.map((p) =>
      '<button type="button" class="recent-item" data-add="' + escapeHtml(p.id) + '">' +
        '<img src="' + p.img + '" alt="" loading="lazy" decoding="async" width="42" height="42">' +
        '<span>' + escapeHtml(p.name) + '<small>' + priceRange(p) + '</small></span>' +
      '</button>'
    ).join('');
  }

  /* ---------------------------------------------------------
     9. FOCUS MANAGEMENT
     --------------------------------------------------------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  function trapFocus(container, e) {
    const nodes = $$(FOCUSABLE, container).filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function lockScroll(lock) {
    document.body.classList.toggle('no-scroll', !!lock);
  }

  /* ---------------------------------------------------------
     10. OPTION PICKER MODAL
     --------------------------------------------------------- */
  const optScrim = $('#optionScrim');
  const optModal = $('#optionModal');
  let optProduct = null;
  let optQty = 1;

  function openOptions(productId) {
    const p = byId(productId);
    if (!p || !optScrim) return;
    optProduct = p;
    optQty = 1;
    lastFocused = document.activeElement;

    $('#optImg').src = p.img;
    $('#optImg').alt = p.name + ' from BTK Coffee';
    $('#optCat').textContent = catName(p.cat);
    $('#optTitle').textContent = p.name;
    $('#optDesc').textContent = p.desc;
    $('#optSizeError').textContent = '';
    $('#optQty').value = '1';
    $('#optReq').hidden = p.sizes.length === 1;

    const single = p.sizes.length === 1;
    $('#optSizes').innerHTML = p.sizes.map((s, i) =>
      '<label class="size-opt">' +
        '<input type="radio" name="optSize" value="' + escapeHtml(s.label) + '"' + (single || i === -1 ? ' checked' : '') + '>' +
        '<span><strong>' + escapeHtml(s.label) + '</strong><small>' + peso(s.price) + '</small></span>' +
      '</label>'
    ).join('');

    updateOptTotal();
    optScrim.hidden = false;
    lockScroll(true);
    pushRecent(p.id);

    const firstRadio = $('input[name="optSize"]', optScrim);
    window.setTimeout(() => { (firstRadio || $('#optClose')).focus(); }, 40);
  }

  function selectedSize() {
    const checked = optScrim ? $('input[name="optSize"]:checked', optScrim) : null;
    if (!checked || !optProduct) return null;
    return optProduct.sizes.find((s) => s.label === checked.value) || null;
  }

  function updateOptTotal() {
    const size = selectedSize();
    const el = $('#optTotal');
    if (!el) return;
    el.textContent = size ? peso(size.price * optQty) : 'Select size';
  }

  function closeOptions() {
    if (!optScrim) return;
    optScrim.hidden = true;
    optProduct = null;
    lockScroll(isDrawerOpen() || isCheckoutOpen());
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---------------------------------------------------------
     11. CART DRAWER
     --------------------------------------------------------- */
  const drawer = $('#cartDrawer');
  const cartScrim = $('#cartScrim');
  const isDrawerOpen = () => !!drawer && drawer.classList.contains('open');

  function openCart() {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    cartScrim.hidden = false;
    $('#cartBtn').setAttribute('aria-expanded', 'true');
    lockScroll(true);
    window.setTimeout(() => $('#cartClose').focus(), 60);
    if (cartRestored) {
      $('#cartRestored').hidden = false;
      cartRestored = false;
      window.setTimeout(() => { const n = $('#cartRestored'); if (n) n.hidden = true; }, 7000);
    }
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    cartScrim.hidden = true;
    $('#cartBtn').setAttribute('aria-expanded', 'false');
    lockScroll(isCheckoutOpen() || (optScrim && !optScrim.hidden));
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function renderCartBadge() {
    const n = cartCount();
    const badge = $('#cartBadge');
    if (badge) {
      badge.textContent = String(n);
      badge.setAttribute('data-empty', String(n === 0));
      badge.classList.add('bump');
      window.setTimeout(() => badge.classList.remove('bump'), 220);
    }
    const sr = $('#cartCountSr');
    if (sr) sr.textContent = n + (n === 1 ? ' item in cart' : ' items in cart');

    document.body.classList.toggle('has-items', n > 0);
    const bar = $('#mobileCartBar');
    if (bar) {
      bar.hidden = n === 0;
      $('#mcbCount').textContent = n + (n === 1 ? ' item' : ' items');
      $('#mcbTotal').textContent = peso(subtotalCentavos());
    }
  }

  function renderCart() {
    const list = $('#cartList');
    const empty = $('#cartEmpty');
    const foot = $('#cartFoot');
    if (!list) return;

    if (!cart.length) {
      list.innerHTML = '';
      list.hidden = true;
      if (empty) empty.hidden = false;
      if (foot) foot.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    list.hidden = false;
    if (foot) foot.hidden = false;

    list.innerHTML = cart.map((i) =>
      '<li class="cart-item" data-key="' + escapeHtml(i.key) + '">' +
        '<img src="' + i.img + '" alt="" loading="lazy" decoding="async" width="62" height="62">' +
        '<div class="ci-main">' +
          '<div class="ci-top">' +
            '<div>' +
              '<h3 class="ci-name">' + escapeHtml(i.name) + '</h3>' +
              '<span class="ci-size">' + escapeHtml(i.size) + '</span>' +
            '</div>' +
            '<button type="button" class="ci-remove" data-remove="' + escapeHtml(i.key) + '" ' +
              'aria-label="Remove ' + escapeHtml(i.name + ' ' + i.size) + ' from cart">&times;</button>' +
          '</div>' +
          '<div class="ci-bottom">' +
            '<div class="qty sm" role="group" aria-label="Quantity for ' + escapeHtml(i.name) + '">' +
              '<button type="button" class="qty-btn" data-dec="' + escapeHtml(i.key) + '" aria-label="Decrease quantity">&minus;</button>' +
              '<input type="text" value="' + i.qty + '" readonly aria-label="Quantity" tabindex="-1">' +
              '<button type="button" class="qty-btn" data-inc="' + escapeHtml(i.key) + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<span class="ci-unit">' + peso(i.price) + ' each</span><br>' +
              '<span class="ci-total">' + peso(i.price * i.qty) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</li>'
    ).join('');

    $('#sumSubtotal').textContent = peso(subtotalCentavos());
    const svc = $('#sumService');
    svc.textContent = serviceFee() === 0 ? 'None' : peso(serviceFee());
    svc.className = serviceFee() === 0 ? 'muted' : '';
    const del = $('#sumDelivery');
    if (CONFIG.deliveryFeeCentavos === null) {
      del.textContent = 'To be confirmed';
      del.className = 'muted';
    } else {
      del.textContent = peso(CONFIG.deliveryFeeCentavos);
      del.className = '';
    }
    $('#sumTotal').textContent = peso(grandTotal());
  }

  /* ---------------------------------------------------------
     12. CHECKOUT
     --------------------------------------------------------- */
  const checkoutScrim = $('#checkoutScrim');
  const isCheckoutOpen = () => !!checkoutScrim && !checkoutScrim.hidden;
  let currentStep = 1;
  let orderDraft = null;

  function openCheckout() {
    if (!cart.length) { toast('Your cart is empty — add something first.', 'warn'); return; }
    lastFocused = document.activeElement;
    checkoutScrim.hidden = false;
    lockScroll(true);
    gotoStep(1);
    window.setTimeout(() => $('#custName').focus(), 60);
  }

  function closeCheckout() {
    checkoutScrim.hidden = true;
    lockScroll(isDrawerOpen());
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function gotoStep(n) {
    currentStep = n;
    [1, 2, 3].forEach((i) => { $('#step' + i).hidden = i !== n; });
    $$('#stepper li').forEach((li) => {
      const s = parseInt(li.dataset.step, 10);
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n);
    });
    const body = $('.checkout-body');
    if (body) body.scrollTop = 0;
  }

  function isDelivery() {
    const el = $('input[name="orderType"]:checked');
    return !!el && el.value === 'Delivery';
  }

  function syncOrderType() {
    const delivery = isDelivery();
    $('#addressField').hidden = !delivery;
    $('#timeLabel').innerHTML = (delivery ? 'Requested delivery time' : 'Preferred pickup time') +
      ' <span class="optional">(optional)</span>';
    if (!delivery) { setError('custAddress', 'errAddress', ''); }
  }

  function setError(inputId, errId, msg) {
    const input = $('#' + inputId);
    const err = $('#' + errId);
    if (input) input.classList.toggle('invalid', !!msg);
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    if (err) err.textContent = msg || '';
  }

  function normalizePhone(raw) {
    return String(raw || '').replace(/[\s\-().]/g, '');
  }

  function isValidPHMobile(raw) {
    return /^(?:\+?63|0)9\d{9}$/.test(normalizePhone(raw));
  }

  function prettyPhone(raw) {
    const p = normalizePhone(raw);
    const local = p.replace(/^(?:\+?63)/, '0');
    return local.length === 11 ? local.slice(0, 4) + ' ' + local.slice(4, 7) + ' ' + local.slice(7) : local;
  }

  function validateCheckout() {
    let ok = true;
    let firstBad = null;
    const formError = $('#formError');
    formError.hidden = true;
    formError.textContent = '';

    const name = $('#custName').value.trim();
    if (name.length < 2) {
      setError('custName', 'errName', 'Please enter your full name.');
      ok = false; firstBad = firstBad || $('#custName');
    } else { setError('custName', 'errName', ''); }

    const phone = $('#custPhone').value.trim();
    if (!phone) {
      setError('custPhone', 'errPhone', 'Please enter your mobile number.');
      ok = false; firstBad = firstBad || $('#custPhone');
    } else if (!isValidPHMobile(phone)) {
      setError('custPhone', 'errPhone', 'Use a valid PH mobile number: 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX.');
      ok = false; firstBad = firstBad || $('#custPhone');
    } else { setError('custPhone', 'errPhone', ''); }

    if (isDelivery()) {
      const addr = $('#custAddress').value.trim();
      if (addr.length < 8) {
        setError('custAddress', 'errAddress', 'Please enter a complete delivery address.');
        ok = false; firstBad = firstBad || $('#custAddress');
      } else { setError('custAddress', 'errAddress', ''); }
    } else {
      setError('custAddress', 'errAddress', '');
    }

    if (!cart.length) {
      formError.textContent = 'Your cart is empty. Add at least one item before checking out.';
      formError.hidden = false;
      ok = false;
    } else {
      // Re-validate every line against the live menu data.
      const bad = cart.filter((i) => {
        const p = byId(i.id);
        if (!p) return true;
        const s = p.sizes.find((x) => x.label === i.size);
        return !s || s.price !== i.price || !(i.qty >= 1 && i.qty <= CONFIG.maxQtyPerLine);
      });
      if (bad.length) {
        cart = validateStoredCart(JSON.stringify(cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty }))));
        persistAndRender();
        formError.textContent = 'Some cart items were out of date and have been refreshed. Please review your cart.';
        formError.hidden = false;
        ok = false;
      }
    }

    if (!ok && firstBad) firstBad.focus();
    else if (!ok) formError.scrollIntoView({ block: 'nearest' });
    return ok;
  }

  function collectDraft() {
    return {
      name: $('#custName').value.trim(),
      phone: prettyPhone($('#custPhone').value.trim()),
      rawPhone: normalizePhone($('#custPhone').value.trim()),
      type: isDelivery() ? 'Delivery' : 'Pickup',
      address: isDelivery() ? $('#custAddress').value.trim() : '',
      time: $('#custTime').value.trim(),
      notes: $('#custNotes').value.trim(),
      items: cart.map((i) => ({ name: i.name, size: i.size, qty: i.qty, price: i.price, total: i.price * i.qty, cat: i.cat })),
      subtotal: subtotalCentavos(),
      service: serviceFee(),
      delivery: CONFIG.deliveryFeeCentavos,
      total: grandTotal()
    };
  }

  function renderReview() {
    const d = orderDraft;
    const box = $('#reviewBox');
    if (!d || !box) return;

    const rows = d.items.map((i) =>
      '<tr>' +
        '<td>' + escapeHtml(i.name) + '<span class="rv-size">' + escapeHtml(i.size) + ' · ' + escapeHtml(catName(i.cat)) + '</span></td>' +
        '<td>' + i.qty + '</td>' +
        '<td>' + peso(i.price) + '</td>' +
        '<td>' + peso(i.total) + '</td>' +
      '</tr>'
    ).join('');

    const feeRows =
      '<div><span class="k">Subtotal</span><span class="v">' + peso(d.subtotal) + '</span></div>' +
      '<div><span class="k">Service fee</span><span class="v">' + (d.service === 0 ? 'None' : peso(d.service)) + '</span></div>' +
      '<div><span class="k">Delivery fee</span><span class="v">' + (d.delivery === null ? 'To be confirmed' : peso(d.delivery)) + '</span></div>';

    box.innerHTML =
      '<div class="review-block">' +
        '<h3>Items</h3>' +
        '<table class="review-table"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
      '</div>' +
      '<div class="review-block">' +
        '<h3>Totals</h3>' +
        '<div class="review-kv">' + feeRows + '</div>' +
        '<div class="rv-total"><span class="k">Estimated total</span><span class="v">' + peso(d.total) + '</span></div>' +
      '</div>' +
      '<div class="review-block">' +
        '<h3>Your details</h3>' +
        '<div class="review-kv">' +
          '<div><span class="k">Name</span><span class="v">' + escapeHtml(d.name) + '</span></div>' +
          '<div><span class="k">Mobile</span><span class="v">' + escapeHtml(d.phone) + '</span></div>' +
          '<div><span class="k">Order type</span><span class="v">' + escapeHtml(d.type) + '</span></div>' +
          (d.type === 'Delivery' ? '<div><span class="k">Address</span><span class="v">' + escapeHtml(d.address) + '</span></div>' : '') +
          (d.time ? '<div><span class="k">' + (d.type === 'Delivery' ? 'Requested delivery time' : 'Preferred pickup time') + '</span><span class="v">' + escapeHtml(d.time) + '</span></div>' : '') +
          (d.notes ? '<div><span class="k">Notes</span><span class="v">' + escapeHtml(d.notes) + '</span></div>' : '') +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------
     13. ORDER REFERENCE + SUMMARY
     --------------------------------------------------------- */
  function generateOrderRef() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tail = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(4);
      window.crypto.getRandomValues(buf);
      for (let i = 0; i < 4; i++) tail += chars[buf[i] % chars.length];
    } else {
      for (let i = 0; i < 4; i++) tail += chars[Math.floor(Math.random() * chars.length)];
    }
    return 'BTK-' + y + m + day + '-' + tail;
  }

  function buildSummary(ref, d) {
    const L = [];
    const when = new Date().toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });

    L.push('BTK COFFEE — ORDER REQUEST');
    L.push('Brewed to Brighten Your Day');
    L.push('--------------------------------');
    L.push('Order Ref : ' + ref);
    L.push('Prepared  : ' + when);
    L.push('');
    L.push('CUSTOMER');
    L.push('Name      : ' + d.name);
    L.push('Mobile    : ' + d.phone);
    L.push('Order type: ' + d.type);
    if (d.type === 'Delivery') L.push('Address   : ' + d.address);
    if (d.time) L.push((d.type === 'Delivery' ? 'Requested delivery: ' : 'Preferred pickup  : ') + d.time);
    L.push('');
    L.push('ITEMS');
    d.items.forEach((i, idx) => {
      L.push((idx + 1) + '. ' + i.name + ' (' + i.size + ')');
      L.push('   ' + i.qty + ' x ' + peso(i.price) + ' = ' + peso(i.total));
    });
    L.push('');
    L.push('Subtotal   : ' + peso(d.subtotal));
    L.push('Service fee: ' + (d.service === 0 ? 'None' : peso(d.service)));
    L.push('Delivery   : ' + (d.delivery === null ? 'To be confirmed' : peso(d.delivery)));
    L.push('ESTIMATED TOTAL: ' + peso(d.total));
    L.push('');
    if (d.notes) { L.push('NOTES'); L.push(d.notes); L.push(''); }
    L.push('--------------------------------');
    L.push('This is an ORDER REQUEST prepared on the BTK Coffee website.');
    L.push('It is NOT confirmed until BTK Coffee replies to acknowledge it,');
    L.push('including item availability, the final total, fees and schedule.');
    return L.join('\n');
  }

  function saveLocalOrder(ref, summary, d) {
    safeStore.set(CONFIG.storage.lastOrder, JSON.stringify({
      ref: ref, summary: summary, status: 'pending-confirmation',
      createdAt: new Date().toISOString(), total: d.total
    }));
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    }
    try {
      const ta = $('#summaryText');
      ta.removeAttribute('readonly');
      ta.focus();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand && document.execCommand('copy');
      ta.setAttribute('readonly', 'readonly');
      return !!ok;
    } catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     14. NAVIGATION / MISC UI
     --------------------------------------------------------- */
  function initNav() {
    const burger = $('#hamburger');
    const links = $('#navLinks');
    const scrim = $('#navScrim');

    function setMenu(open) {
      links.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      scrim.hidden = !open;
      lockScroll(open);
    }

    burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
    scrim.addEventListener('click', () => setMenu(false));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

    // Scroll state + active link + back to top
    const header = $('#siteHeader');
    const sections = ['home', 'menu', 'story', 'findus'].map((id) => document.getElementById(id)).filter(Boolean);
    const topBtn = $('#backToTop');

    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      header.classList.toggle('scrolled', y > 8);
      if (topBtn) topBtn.hidden = y < 500;
      let active = '';
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= 140) active = s.id; });
      $$('.nav-link').forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + active);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function scrollToSel(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 86;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }

  function initFooter() {
    const host = $('#footerCats');
    if (host) {
      host.innerHTML = CATEGORIES.map((c) =>
        '<li><a href="#menu" data-footer-cat="' + c.id + '">' + escapeHtml(c.name) + '</a></li>'
      ).join('');
    }
    const y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------
     15. EVENT WIRING
     --------------------------------------------------------- */
  function initEvents() {
    // Delegated: Add to order buttons (featured, menu, recent)
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) { openOptions(addBtn.getAttribute('data-add')); return; }

      const gotoBtn = e.target.closest('[data-goto]');
      if (gotoBtn) { scrollToSel(gotoBtn.getAttribute('data-goto')); return; }

      const tab = e.target.closest('.tab');
      if (tab) { activeCat = tab.dataset.cat; renderMenu(); return; }

      const fcat = e.target.closest('[data-footer-cat]');
      if (fcat) {
        e.preventDefault();
        activeCat = fcat.getAttribute('data-footer-cat');
        searchTerm = ''; $('#menuSearch').value = ''; $('#searchClear').hidden = true;
        renderMenu(); scrollToSel('#menu');
        return;
      }

      const smooth = e.target.closest('a[data-scroll]');
      if (smooth) {
        const href = smooth.getAttribute('href');
        if (href && href.charAt(0) === '#' && document.querySelector(href)) {
          e.preventDefault(); scrollToSel(href);
        }
      }
    });

    // Search
    const search = $('#menuSearch');
    const clearBtn = $('#searchClear');
    search.addEventListener('input', () => {
      searchTerm = search.value;
      clearBtn.hidden = !searchTerm;
      renderMenu();
    });
    clearBtn.addEventListener('click', () => {
      search.value = ''; searchTerm = ''; clearBtn.hidden = true; renderMenu(); search.focus();
    });
    $('#resetFilters').addEventListener('click', () => {
      search.value = ''; searchTerm = ''; clearBtn.hidden = true; activeCat = 'all';
      renderTabs(); renderMenu(); search.focus();
    });

    // Option modal
    $('#optClose').addEventListener('click', closeOptions);
    optScrim.addEventListener('click', (e) => { if (e.target === optScrim) closeOptions(); });
    optScrim.addEventListener('change', (e) => {
      if (e.target.name === 'optSize') { $('#optSizeError').textContent = ''; updateOptTotal(); }
    });
    $('#optMinus').addEventListener('click', () => {
      optQty = Math.max(1, optQty - 1); $('#optQty').value = optQty; updateOptTotal();
    });
    $('#optPlus').addEventListener('click', () => {
      optQty = Math.min(CONFIG.maxQtyPerLine, optQty + 1); $('#optQty').value = optQty; updateOptTotal();
    });
    $('#optAdd').addEventListener('click', () => {
      if (!optProduct) return;
      const size = selectedSize();
      if (!size) {
        $('#optSizeError').textContent = 'Please choose a size before adding this item.';
        const first = $('input[name="optSize"]', optScrim);
        if (first) first.focus();
        return;
      }
      if (addToCart(optProduct.id, size.label, optQty)) { closeOptions(); openCart(); }
    });

    // Cart drawer
    $('#cartBtn').addEventListener('click', openCart);
    $('#cartClose').addEventListener('click', closeCart);
    cartScrim.addEventListener('click', closeCart);
    $('#continueShopping').addEventListener('click', () => { closeCart(); scrollToSel('#menu'); });
    $('#emptyBrowse').addEventListener('click', () => { closeCart(); scrollToSel('#menu'); });
    $('#mobileCartBar').addEventListener('click', openCart);
    $('#clearCart').addEventListener('click', () => {
      if (!cart.length) return;
      if (window.confirm('Remove all items from your cart? This cannot be undone.')) clearCart();
    });
    $('#toCheckout').addEventListener('click', () => { closeCart(); openCheckout(); });

    $('#cartList').addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]');
      if (inc) { changeQty(inc.getAttribute('data-inc'), 1); return; }
      const dec = e.target.closest('[data-dec]');
      if (dec) { changeQty(dec.getAttribute('data-dec'), -1); return; }
      const rm = e.target.closest('[data-remove]');
      if (rm) { removeLine(rm.getAttribute('data-remove')); }
    });

    // Checkout
    $('#checkoutClose').addEventListener('click', closeCheckout);
    checkoutScrim.addEventListener('click', (e) => { if (e.target === checkoutScrim) closeCheckout(); });
    $('#backToCart').addEventListener('click', () => { closeCheckout(); openCart(); });
    $('#editCartFromReview').addEventListener('click', () => { closeCheckout(); openCart(); });
    $('#backToDetails').addEventListener('click', () => gotoStep(1));

    $$('input[name="orderType"]').forEach((r) => r.addEventListener('change', syncOrderType));

    $('#checkoutForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateCheckout()) return;
      orderDraft = collectDraft();
      renderReview();
      gotoStep(2);
    });

    // Live-clear errors while typing (never wipes entries)
    $('#custName').addEventListener('input', () => { if ($('#custName').value.trim().length >= 2) setError('custName', 'errName', ''); });
    $('#custPhone').addEventListener('input', () => { if (isValidPHMobile($('#custPhone').value)) setError('custPhone', 'errPhone', ''); });
    $('#custAddress').addEventListener('input', () => { if ($('#custAddress').value.trim().length >= 8) setError('custAddress', 'errAddress', ''); });

    $('#placeOrder').addEventListener('click', () => {
      if (!validateCheckout()) { gotoStep(1); return; }
      orderDraft = collectDraft();
      const ref = generateOrderRef();
      const summary = buildSummary(ref, orderDraft);
      $('#orderRef').textContent = ref;
      $('#summaryText').value = summary;
      $('#toMessenger').href = CONFIG.messenger;
      $('#copyStatus').textContent = '';
      saveLocalOrder(ref, summary, orderDraft);
      gotoStep(3);
      toast('Order prepared — copy it and send on Messenger', 'ok');
    });

    $('#copySummary').addEventListener('click', async () => {
      const ok = await copyText($('#summaryText').value);
      const status = $('#copyStatus');
      if (ok) {
        status.textContent = '✓ Copied. Now tap “Continue to Messenger” and paste it into the chat.';
        toast('Order summary copied', 'ok');
      } else {
        status.textContent = 'Copying was blocked by your browser. The text above is selected — press Ctrl+C (or ⌘+C) to copy it manually.';
        const ta = $('#summaryText');
        ta.focus(); ta.setSelectionRange(0, ta.value.length);
        toast('Copy blocked — select the text and copy manually', 'warn');
      }
    });

    $('#toMessenger').addEventListener('click', () => {
      $('#copyStatus').textContent = 'Messenger opened in a new tab. Paste your order summary there and send it.';
    });

    $('#printSummary').addEventListener('click', () => window.print());

    $('#doneShopping').addEventListener('click', () => {
      closeCheckout();
      scrollToSel('#menu');
      toast('Your order reference is saved in this browser.', 'ok');
    });

    // Keyboard: ESC + focus trap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (optScrim && !optScrim.hidden) { closeOptions(); return; }
        if (isCheckoutOpen()) { closeCheckout(); return; }
        if (isDrawerOpen()) { closeCart(); return; }
        const links = $('#navLinks');
        if (links.classList.contains('open')) { $('#hamburger').click(); }
        return;
      }
      if (e.key === 'Tab') {
        if (optScrim && !optScrim.hidden) trapFocus(optModal, e);
        else if (isCheckoutOpen()) trapFocus($('#checkoutModal'), e);
        else if (isDrawerOpen()) trapFocus(drawer, e);
      }
    });

    // Keep cart in sync across tabs of the same browser
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.storage.cart) { loadCart(); renderCart(); renderCartBadge(); }
    });
  }

  /* ---------------------------------------------------------
     16. INIT
     --------------------------------------------------------- */
  function init() {
    renderFeatured();
    renderTabs();
    renderMenu();
    renderRecent();
    initFooter();
    initNav();
    initEvents();
    syncOrderType();

    loadCart();
    renderCart();
    renderCartBadge();
    if (cartRestored) {
      window.setTimeout(() => toast('We restored your saved cart (' + cartCount() + ' items).', 'ok'), 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
