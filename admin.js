/* ============================================================
   BTK Coffee — admin.js
   Superadmin login + dashboard controller.
   Reads/writes the shared configuration in config.js, which the
   public site (script.js) consumes on load.

   HONEST SECURITY SCOPE: the credential check below runs entirely in
   the browser. It deters casual access on a shared machine; it is NOT
   an authorisation boundary. See README.md "Superadmin".
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.BTKConfig;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  if (!CFG) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">' +
      'config.js failed to load. The dashboard cannot start.</p>';
    return;
  }

  /* ---------- money helpers (centavos) ---------- */
  const peso = (c) => {
    const n = Math.round(Number(c) || 0);
    const w = Math.floor(n / 100), r = n % 100;
    return '₱' + w.toLocaleString('en-PH') + (r ? '.' + String(r).padStart(2, '0') : '');
  };
  const toCentavos = (php) => Math.round(Number(php) * 100);
  const toPhp = (c) => (Number(c) || 0) / 100;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- toasts ---------- */
  function toast(msg, kind, list) {
    const host = $('#aToasts');
    const el = document.createElement('div');
    el.className = 'a-toast' + (kind ? ' ' + kind : '');
    el.innerHTML = '<div><span>' + esc(msg) + '</span>' +
      (list && list.length ? '<ul>' + list.slice(0, 6).map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '') +
      '</div>';
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, list && list.length ? 7000 : 3200);
  }

  /* ---------- confirm dialog ---------- */
  let confirmCb = null;
  function confirmAsk(title, msg, cb) {
    $('#confirmTitle').textContent = title;
    $('#confirmMsg').textContent = msg;
    $('#confirmScrim').hidden = false;
    confirmCb = cb;
    setTimeout(() => $('#confirmNo').focus(), 40);
  }
  function confirmClose() { $('#confirmScrim').hidden = true; confirmCb = null; }
  $('#confirmNo').addEventListener('click', confirmClose);
  $('#confirmYes').addEventListener('click', () => { const c = confirmCb; confirmClose(); if (c) c(); });

  /* ---------- password visibility toggles ---------- */
  $$('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = $('#' + btn.getAttribute('data-pw-for'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  /* =========================================================
     LOGIN
     ========================================================= */
  const loginView = $('#loginView');
  const dashView = $('#dashView');

  (async function showDefaultHint() {
    const cred = await CFG.getCredential();
    if (cred.isDefault) {
      $('#defaultHint').textContent =
        'First run: the starting password is "' + CFG.DEFAULT_PASSWORD +
        '". Change it in Account Security immediately.';
    }
  })();

  function showLogin() {
    loginView.hidden = false;
    dashView.hidden = true;
    $('#loginPass').value = '';
    setTimeout(() => $('#loginPass').focus(), 60);
  }

  async function showDash() {
    loginView.hidden = true;
    dashView.hidden = false;
    CFG.touchSession();
    pbSet('busy', 'Loading published configuration…');
    await CFG.fetchPublished();
    hydrateAll();
    refreshPublishBar();
    // Auto-verify if a token survived from earlier in this tab's session.
    if (CFG.ghToken.has()) {
      await verifyConnection(true);
      try { CFG.setPublishedSha(await CFG.ghGetSha(CFG.REMOTE_PATH)); } catch (e) { /* none yet */ }
      refreshPublishBar();
    }
  }

  function loginAlert(msg, ok) {
    const el = $('#loginAlert');
    el.hidden = !msg;
    el.textContent = msg || '';
    el.classList.toggle('ok', !!ok);
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = $('#loginUser').value.trim();
    const pass = $('#loginPass').value;
    const btn = $('#loginSubmit');

    const lock = CFG.lockRemaining();
    if (lock > 0) {
      loginAlert('Too many attempts. Try again in ' + Math.ceil(lock / 1000) + ' seconds.');
      return;
    }
    if (!pass) { loginAlert('Please enter your password.'); return; }

    btn.disabled = true; btn.textContent = 'Checking…';
    // Generic failure message — never hints at which field was wrong.
    const ok = (user === CFG.FIXED_USERNAME) && await CFG.verifyPassword(pass);
    btn.disabled = false; btn.textContent = 'Sign In';

    if (!ok) {
      CFG.recordFail();
      const left = CFG.lockRemaining();
      loginAlert(left > 0
        ? 'Invalid credentials. Locked for ' + Math.ceil(left / 1000) + ' seconds.'
        : 'Invalid username or password.');
      $('#loginPass').value = '';
      return;
    }
    CFG.clearAttempts();
    CFG.startSession();
    loginAlert('');
    showDash();
    toast('Signed in as superadmin', 'ok');
  });

  $('#logoutBtn').addEventListener('click', () => {
    const go = () => { CFG.endSession(); clearDirty(); showLogin(); toast('Signed out', 'ok'); };
    if (isDirty()) {
      confirmAsk('Unsaved changes', 'You have unsaved changes that will be lost. Log out anyway?', go);
    } else { go(); }
  });

  /* =========================================================
     DIRTY TRACKING
     ========================================================= */
  const dirty = { theme: false, images: false, menu: false, contact: false };
  const isDirty = () => Object.keys(dirty).some((k) => dirty[k]);
  function setDirty(k, v) { dirty[k] = v; $('#dirtyPill').hidden = !isDirty(); }
  function clearDirty() { Object.keys(dirty).forEach((k) => { dirty[k] = false; }); $('#dirtyPill').hidden = true; }

  window.addEventListener('beforeunload', (e) => {
    if (!dashView.hidden && (isDirty() || (CFG.hasDraft() && CFG.draftDiffers()))) {
      e.preventDefault(); e.returnValue = '';
    }
  });

  /* =========================================================
     WORKING COPIES (edits live here until saved)
     ========================================================= */
  let draft = null;
  function freshDraft() {
    const c = CFG.load(true);
    return JSON.parse(JSON.stringify({ theme: c.theme, images: c.images, contact: c.contact, menu: c.menu }));
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */
  function gotoView(name) {
    $$('.a-view').forEach((v) => { v.hidden = v.getAttribute('data-view') !== name; });
    $$('.a-nav[data-view]').forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-view') === name));
    $('#aMain').scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeSide();
    if (name === 'overview') renderOverview();
    if (name === 'github') renderRepoSettings();
    renderConnection();
  }
  $$('.a-nav[data-view]').forEach((b) => b.addEventListener('click', () => gotoView(b.getAttribute('data-view'))));
  // Delegated so dynamically rendered [data-goto] controls work too.
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g && !g.closest('.a-nav')) gotoView(g.getAttribute('data-goto'));
  });

  function openSide() { $('#aSide').classList.add('open'); $('#aScrim').hidden = false; $('#navToggle').setAttribute('aria-expanded', 'true'); }
  function closeSide() { $('#aSide').classList.remove('open'); $('#aScrim').hidden = true; $('#navToggle').setAttribute('aria-expanded', 'false'); }
  $('#navToggle').addEventListener('click', () => {
    $('#aSide').classList.contains('open') ? closeSide() : openSide();
  });
  $('#aScrim').addEventListener('click', closeSide);

  /* =========================================================
     1. OVERVIEW
     ========================================================= */
  function renderOverview() {
    const c = CFG.load();
    const prods = c.menu.products;
    const live = prods.filter((p) => p.available !== false);
    const saved = c.savedAt ? new Date(c.savedAt).toLocaleString('en-PH',
      { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

    const stats = [
      { k: 'Menu items', v: prods.length, s: live.length + ' available · ' + (prods.length - live.length) + ' hidden' },
      { k: 'Categories', v: c.menu.categories.length, s: c.menu.categories.map((x) => x.name).join(', ') },
      { k: 'Featured items', v: prods.filter((p) => p.featured && p.available !== false).length, s: 'Shown in Featured Favorites' },
      { k: 'Price range', v: priceSpan(prods), s: 'Across all sizes' },
      { k: 'Live status', sm: true,
        v: CFG.remoteState() === 'ok' ? 'Published' : (CFG.remoteState() === 'missing' ? 'Defaults' : 'Unknown'),
        s: CFG.remoteState() === 'ok' ? 'Served from ' + CFG.REMOTE_PATH : 'Nothing published yet' },
      { k: 'Draft', v: (CFG.hasDraft() && CFG.draftDiffers()) ? 'Pending' : 'In sync', sm: true,
        s: (CFG.hasDraft() && CFG.draftDiffers()) ? 'Unpublished edits in this browser' : 'Matches the live version' },
      { k: 'Last published', v: saved || 'Never', s: saved ? 'Commit timestamp' : 'Using built-in defaults', sm: true }
    ];
    $('#statGrid').innerHTML = stats.map((s) =>
      '<div class="stat"><p class="stat-k">' + esc(s.k) + '</p>' +
      '<p class="stat-v' + (s.sm ? ' sm' : '') + '">' + esc(String(s.v)) + '</p>' +
      '<p class="stat-s">' + esc(s.s) + '</p></div>'
    ).join('');

    $('#palettePreview').innerHTML = CFG.THEME_SCHEMA.map((s) =>
      '<span class="swatch"><span class="sw-dot" style="background:' + esc(c.theme[s.key]) + '"></span>' +
      esc(s.label) + ' <code>' + esc(c.theme[s.key]) + '</code></span>'
    ).join('');
  }

  function priceSpan(prods) {
    const all = [];
    prods.forEach((p) => p.sizes.forEach((s) => all.push(s.price)));
    if (!all.length) return '—';
    return peso(Math.min.apply(null, all)) + '–' + peso(Math.max.apply(null, all));
  }

  /* =========================================================
     2. APPEARANCE
     ========================================================= */
  function renderColors() {
    $('#colorList').innerHTML = CFG.THEME_SCHEMA.map((s) =>
      '<div class="color-row">' +
        '<input type="color" value="' + esc(draft.theme[s.key]) + '" data-ck="' + s.key + '" aria-label="' + esc(s.label) + ' colour picker">' +
        '<span class="cr-label">' + esc(s.label) + '<span class="cr-vars">' + esc(s.vars.join(' ')) + '</span></span>' +
        '<input type="text" value="' + esc(draft.theme[s.key]) + '" data-ht="' + s.key + '" maxlength="7" spellcheck="false" aria-label="' + esc(s.label) + ' hex value">' +
      '</div>'
    ).join('');
    paintPreview();
  }

  $('#colorList').addEventListener('input', (e) => {
    const ck = e.target.getAttribute('data-ck');
    const ht = e.target.getAttribute('data-ht');
    if (ck) {
      draft.theme[ck] = e.target.value.toUpperCase();
      const txt = $('[data-ht="' + ck + '"]');
      if (txt) { txt.value = draft.theme[ck]; txt.classList.remove('invalid'); }
      setDirty('theme', true); paintPreview();
    } else if (ht) {
      let v = e.target.value.trim();
      if (v && v[0] !== '#') { v = '#' + v; }
      const valid = CFG.isHex(v);
      e.target.classList.toggle('invalid', !valid && e.target.value !== '');
      if (valid) {
        draft.theme[ht] = v.toUpperCase();
        const pick = $('[data-ck="' + ht + '"]');
        if (pick) pick.value = draft.theme[ht];
        setDirty('theme', true); paintPreview();
      }
    }
  });

  function paintPreview() {
    const t = draft.theme;
    const p = $('#themePreview');
    p.style.background = t.background;
    p.style.borderColor = t.border;
    $('.tp-bar', p).style.background = t.surface;
    $('.tp-bar', p).style.borderBottomColor = t.border;
    $('.tp-brand', p).style.color = t.heading;
    $('.tp-cart', p).style.color = t.secondary;
    $('.tp-eyebrow', p).style.color = t.primary;
    $('.tp-h', p).style.color = t.heading;
    $('.tp-p', p).style.color = t.bodyText;
    const card = $('.tp-card', p);
    card.style.background = t.surface; card.style.borderColor = t.border;
    $('.tp-name', p).style.color = t.heading;
    $('.tp-muted', p).style.color = t.muted;
    $('.tp-price', p).style.color = t.heading;
    const btn = $('.tp-btn', p);
    btn.style.background = t.btnBg; btn.style.color = t.btnText;

    const pairs = [
      ['Button text on button background', t.btnText, t.btnBg],
      ['Body text on page background', t.bodyText, t.background],
      ['Heading on card surface', t.heading, t.surface]
    ];
    const weak = pairs.filter((pr) => contrast(pr[1], pr[2]) < 4.5).map((pr) => pr[0]);
    $('#contrastNote').textContent = weak.length
      ? '⚠ Low contrast: ' + weak.join('; ') + '. Aim for a ratio of 4.5:1 or higher for readability.'
      : '✓ Contrast looks readable (4.5:1 or better on key text pairs).';
  }

  function lum(hex) {
    const v = hex.replace('#', '');
    const rgb = [0, 2, 4].map((i) => {
      let c = parseInt(v.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) {
    if (!CFG.isHex(a) || !CFG.isHex(b)) return 21;
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  $('#saveTheme').addEventListener('click', () => {
    const r = CFG.save({ theme: draft.theme });
    if (!r.ok) { toast('Could not save the palette.', 'err', r.errors); return; }
    setDirty('theme', false);
    toast('Palette saved to your draft. Press "Validate & Publish to GitHub" to make it live.', 'ok');
    renderOverview(); refreshPublishBar();
  });
  $('#revertTheme').addEventListener('click', () => {
    draft.theme = JSON.parse(JSON.stringify(CFG.load(true).theme));
    renderColors(); setDirty('theme', false); toast('Reverted to the last saved palette.');
  });
  $('#defaultTheme').addEventListener('click', () => {
    confirmAsk('Restore default palette?',
      'This replaces your colours with the original BTK khaki-and-ivory palette. Images, menu, and contact details are not affected.',
      () => {
        const r = CFG.resetSection('theme');
        if (!r.ok) { toast('Reset failed.', 'err', r.errors); return; }
        draft.theme = JSON.parse(JSON.stringify(CFG.load(true).theme));
        renderColors(); setDirty('theme', false);
        toast('Default palette restored.', 'ok'); renderOverview();
      });
  });

  /* =========================================================
     3. IMAGE MANAGER
     ========================================================= */
  const MAX_UPLOAD = 900 * 1024;

  /* Pending (chosen but not yet written to the repo) images, keyed by slot. */
  const pending = {};

  function imgMode() {
    const el = $('input[name="imgMode"]:checked');
    return el ? el.value : 'download';
  }

  /* ---- connection state, shown in the header on every screen ---- */
  let connVerified = false;

  function connState() {
    const s = CFG.getRepoSettings();
    const hasRepo = !!(s.owner && s.repo);
    const hasToken = CFG.ghToken.has();
    if (hasRepo && hasToken) return connVerified ? 'ok' : 'partial';
    if (hasRepo || hasToken) return 'partial';
    return 'none';
  }

  function renderConnection() {
    const s = CFG.getRepoSettings();
    const state = connState();
    const chip = $('#ghChip');
    const repoLabel = (s.owner && s.repo) ? s.owner + '/' + s.repo : '';

    let cls = '', chipText = 'Not connected', title = 'Not connected', detail = '';
    if (state === 'ok') {
      cls = 'ok'; chipText = repoLabel; title = 'Connected';
      detail = repoLabel + ' · branch ' + s.branch + ' · images in ' + s.dir + '/';
    } else if (state === 'partial') {
      cls = 'partial';
      if (!s.owner || !s.repo) { chipText = 'Repo needed'; title = 'Repository not set'; detail = 'Add the owner and repository name below.'; }
      else if (!CFG.ghToken.has()) { chipText = 'Token needed'; title = 'Token not set'; detail = repoLabel + ' is set. Add a token to enable publishing.'; }
      else { chipText = 'Unverified'; title = 'Not verified yet'; detail = repoLabel + ' — press "Test Connection" to confirm access.'; }
    } else {
      detail = 'Add your repository details and a token to enable publishing.';
    }

    chip.className = 'gh-chip' + (cls ? ' ' + cls : '');
    $('#ghChipText').textContent = chipText;
    chip.setAttribute('title', detail || title);

    const banner = $('#connBanner');
    if (banner) {
      banner.className = 'conn-banner' + (cls ? ' ' + cls : '');
      $('#connTitle').textContent = title;
      $('#connDetail').textContent = detail;
    }
    const echo = $('#ghDirEcho');
    if (echo) echo.textContent = s.dir;

    // Image Manager hints
    const needs = $('#imgNeedsRepo');
    if (needs) needs.hidden = state === 'ok' || imgMode() !== 'api';
    const hint = $('#imgModeHint');
    if (hint) {
      hint.textContent = imgMode() === 'api'
        ? (state === 'ok'
            ? 'Commits go to ' + repoLabel + ' (' + s.dir + '/). '
            : 'GitHub is not fully connected — open GitHub Setup to finish.')
        : 'No token needed. Files download named correctly for ' + s.dir + '/.';
    }
    const pub = $('#pbPublish');
    if (pub) pub.title = state === 'ok' ? 'Publish to ' + repoLabel : 'Connect GitHub first';
  }

  function renderRepoSettings() {
    const s = CFG.getRepoSettings();
    $('#ghOwner').value = s.owner;
    $('#ghRepo').value = s.repo;
    $('#ghBranch').value = s.branch;
    $('#ghDir').value = s.dir;
    if (CFG.ghToken.has() && !$('#ghStatus').textContent) {
      $('#ghStatus').textContent = 'A token is active for this tab.';
    }
    renderConnection();
  }

  $('#saveRepo').addEventListener('click', () => {
    $('#errGhOwner').textContent = '';
    $('#errGhRepo').textContent = '';
    if (!$('#ghOwner').value.trim()) { $('#errGhOwner').textContent = 'Required.'; }
    if (!$('#ghRepo').value.trim()) { $('#errGhRepo').textContent = 'Required.'; }
    const r = CFG.saveRepoSettings({
      owner: $('#ghOwner').value, repo: $('#ghRepo').value,
      branch: $('#ghBranch').value, dir: $('#ghDir').value
    });
    if (!r.ok) { toast('Could not save repository settings.', 'err', r.errors); return; }
    connVerified = false;
    renderRepoSettings(); renderImages();
    toast('Repository settings saved. Press "Test Connection" to verify.', 'ok');
  });

  $$('input[name="imgMode"]').forEach((r) => r.addEventListener('change', () => {
    renderImages(); renderConnection();
  }));

  async function verifyConnection(quiet) {
    $('#ghChip').classList.add('busy');
    if (!quiet) $('#ghStatus').textContent = 'Testing…';
    const r = await CFG.ghTestConnection();
    connVerified = r.ok;
    $('#ghChip').classList.remove('busy');
    $('#ghStatus').textContent = (r.ok ? '✓ ' : '✗ ') + r.message;
    renderConnection();
    if (!quiet) toast(r.message, r.ok ? 'ok' : 'err');
    return r.ok;
  }

  $('#ghUseToken').addEventListener('click', async () => {
    const t = $('#ghToken').value.trim();
    if (!t) { $('#ghStatus').textContent = 'Paste a token first.'; return; }
    CFG.ghToken.set(t);
    $('#ghToken').value = '';
    const ok = await verifyConnection(true);
    toast(ok ? 'Connected to GitHub for this session.' : 'Token saved, but the check failed — see the status message.',
      ok ? 'ok' : 'err');
    if (ok) {
      try { CFG.setPublishedSha(await CFG.ghGetSha(CFG.REMOTE_PATH)); } catch (e) { /* none yet */ }
      refreshPublishBar();
    }
  });
  $('#ghForget').addEventListener('click', () => {
    CFG.ghToken.clear();
    connVerified = false;
    $('#ghToken').value = '';
    $('#ghStatus').textContent = 'Token cleared from this tab.';
    renderConnection();
    toast('Disconnected from GitHub.');
  });
  $('#ghTest').addEventListener('click', () => verifyConnection(false));

  /** Target repo path for a slot (product or site image). */
  function targetPath(kind, key, currentUrl) {
    if (CFG.isRepoFile(currentUrl)) return CFG.repoPath(currentUrl);
    const s = CFG.getRepoSettings();
    return s.dir + '/' + key + '.jpg';   // everything lives in the one image folder
  }

  function imgCard(key, label, sub, url, kind) {
    const safe = url ? esc(url) : '';
    const pend = pending[kind + ':' + key];
    const path = targetPath(kind, key, url);
    const inRepo = CFG.isRepoFile(url);
    const shown = pend ? pend.dataUrl : safe;

    return '<div class="img-item' + (pend ? ' is-pending' : '') + '" data-img-key="' + esc(key) + '" data-kind="' + kind + '">' +
      '<div class="img-thumb-wrap">' +
        (shown ? '<img src="' + shown + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false">' : '') +
        '<span class="ph"' + (shown ? ' hidden' : '') + '>No image file yet</span>' +
        (pend ? '<span class="pend-tag">Ready to publish</span>' : '') +
      '</div>' +
      '<div class="img-meta">' +
        '<span class="img-name">' + esc(label) + '</span>' +
        '<span class="img-sub">' + esc(sub) + '</span>' +
        '<code class="img-path" title="Repository path">' + esc(inRepo ? path : 'external URL') + '</code>' +
        '<input type="text" class="img-url" value="' + safe + '" placeholder="assets/… or https://…" aria-label="Image path or URL for ' + esc(label) + '">' +
        '<div class="img-btns">' +
          '<label class="a-btn a-btn-ghost file-btn">Choose…<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label>' +
          (pend
            ? '<button type="button" class="a-btn a-btn-primary" data-img-publish>' +
                (imgMode() === 'api' ? 'Commit to GitHub' : 'Download file') + '</button>' +
              '<button type="button" class="a-btn a-btn-ghost" data-img-discard>Discard</button>'
            : '<button type="button" class="a-btn a-btn-ghost" data-img-default>Default</button>' +
              '<button type="button" class="a-btn a-btn-danger" data-img-clear>Clear</button>') +
        '</div>' +
      '</div></div>';
  }

  function renderImages() {
    $('#siteImageGrid').innerHTML = Object.keys(CFG.DEFAULT_IMAGES).map((k) =>
      imgCard(k, CFG.DEFAULT_IMAGES[k].label, 'Site image', draft.images[k], 'site')
    ).join('');
    renderProductImages();
  }

  function renderProductImages() {
    const q = ($('#imgProductSearch').value || '').trim().toLowerCase();
    const list = draft.menu.products.filter((p) => !q || p.name.toLowerCase().indexOf(q) !== -1);
    $('#productImageGrid').innerHTML = list.length
      ? list.map((p) => imgCard(p.id, p.name, catLabel(p.cat), p.img, 'product')).join('')
      : '<p class="a-empty">No products match that search.</p>';
  }
  $('#imgProductSearch').addEventListener('input', renderProductImages);

  function catLabel(id) {
    const c = draft.menu.categories.find((x) => x.id === id);
    return c ? c.name : id;
  }

  function setImageValue(kind, key, url) {
    if (kind === 'site') draft.images[key] = url;
    else {
      const p = draft.menu.products.find((x) => x.id === key);
      if (p) p.img = url;
    }
    setDirty('images', true);
    if (kind === 'product') setDirty('menu', true);
  }

  function handleImageGrid(e) {
    const item = e.target.closest('[data-img-key]');
    if (!item) return;
    const key = item.getAttribute('data-img-key');
    const kind = item.getAttribute('data-kind');

    if (e.target.matches('[data-img-default]')) {
      const def = kind === 'site'
        ? (CFG.DEFAULT_IMAGES[key] || {}).url || ''
        : ((CFG.defaults().menu.products.find((p) => p.id === key) || {}).img || '');
      setImageValue(kind, key, def);
      kind === 'site' ? renderImages() : renderProductImages();
      toast('Restored the default image.');
      return;
    }
    if (e.target.matches('[data-img-clear]')) {
      setImageValue(kind, key, '');
      kind === 'site' ? renderImages() : renderProductImages();
      toast('Image cleared. A placeholder will show until you set a new one.');
      return;
    }
    if (e.target.matches('[data-img-discard]')) {
      delete pending[kind + ':' + key];
      kind === 'site' ? renderImages() : renderProductImages();
      toast('Pending image discarded.');
      return;
    }
    if (e.target.matches('[data-img-publish]')) {
      publishImage(kind, key, e.target);
      return;
    }
  }

  /** Write the pending image into the repo (API) or hand it over as a download. */
  async function publishImage(kind, key, btn) {
    const slot = kind + ':' + key;
    const pend = pending[slot];
    if (!pend) return;

    const current = kind === 'site'
      ? draft.images[key]
      : ((draft.menu.products.find((p) => p.id === key) || {}).img || '');
    const path = targetPath(kind, key, current);

    if (imgMode() === 'download') {
      const a = document.createElement('a');
      a.href = pend.dataUrl;
      a.download = CFG.fileNameOf(path) || (key + '.jpg');
      document.body.appendChild(a); a.click(); a.remove();
      // Make sure the config points at the repo path the file belongs in.
      setImageValue(kind, key, './' + path);
      delete pending[slot];
      kind === 'site' ? renderImages() : renderProductImages();
      toast('Downloaded "' + CFG.fileNameOf(path) + '". Replace that file at ' + path +
            ' in your repo, then commit and push.', 'ok');
      return;
    }

    if (!CFG.ghToken.has()) {
      toast('No token active — opening GitHub Setup.', 'err');
      gotoView('github');
      return;
    }
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Committing…';
    try {
      const res = await CFG.ghPutFile(path, CFG.dataUrlToBase64(pend.dataUrl),
        'Update ' + path + ' via BTK Superadmin');
      setImageValue(kind, key, './' + path);
      delete pending[slot];
      // Persist the path immediately so the public site agrees with the repo.
      CFG.save({ images: draft.images, menu: draft.menu });
      setDirty('images', false); setDirty('menu', false);
      kind === 'site' ? renderImages() : renderProductImages();
      toast((res.replaced ? 'Replaced ' : 'Created ') + path +
            ' in GitHub. Allow a minute for Pages to redeploy, then hard-refresh.', 'ok');
    } catch (err) {
      toast('Commit failed: ' + err.message, 'err');
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  }
  $('#siteImageGrid').addEventListener('click', handleImageGrid);
  $('#productImageGrid').addEventListener('click', handleImageGrid);

  function handleUrlInput(e) {
    if (!e.target.matches('.img-url')) return;
    const item = e.target.closest('[data-img-key]');
    const url = e.target.value.trim();
    const valid = url === '' || CFG.isSafeUrl(url);
    e.target.classList.toggle('invalid', !valid);
    if (valid) setImageValue(item.getAttribute('data-kind'), item.getAttribute('data-img-key'), url);
  }
  $('#siteImageGrid').addEventListener('input', handleUrlInput);
  $('#productImageGrid').addEventListener('input', handleUrlInput);

  function handleFile(e) {
    if (e.target.type !== 'file' || !e.target.files || !e.target.files[0]) return;
    const item = e.target.closest('[data-img-key]');
    if (!item) return;
    const kind = item.getAttribute('data-kind');
    const key = item.getAttribute('data-img-key');
    readImageFile(e.target.files[0], (err, dataUrl) => {
      e.target.value = '';
      if (err) { toast(err, 'err'); return; }
      // Held in memory only until it is committed or downloaded — nothing
      // large is ever written into localStorage.
      pending[kind + ':' + key] = { dataUrl: dataUrl };
      kind === 'site' ? renderImages() : renderProductImages();
      toast(imgMode() === 'api'
        ? 'Image ready. Press "Commit to GitHub" to replace the repo file.'
        : 'Image ready. Press "Download file", then commit it to your repo.');
    });
  }
  $('#siteImageGrid').addEventListener('change', handleFile);
  $('#productImageGrid').addEventListener('change', handleFile);

  /** Validate + downscale an uploaded image into a storable data URL. */
  function readImageFile(file, cb) {
    const okTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (okTypes.indexOf(file.type) === -1) { cb('Unsupported file type. Use JPG, PNG, or WebP.'); return; }
    if (file.size > 6 * 1024 * 1024) { cb('That file is larger than 6 MB. Please use a smaller image.'); return; }

    const reader = new FileReader();
    reader.onerror = () => cb('Could not read that file.');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => cb('That file is not a readable image.');
      img.onload = () => {
        const MAXW = 900;
        const scale = Math.min(1, MAXW / img.naturalWidth);
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        let out;
        try { out = cv.toDataURL('image/jpeg', 0.82); }
        catch (err) { cb('Could not process that image.'); return; }
        if (out.length > MAX_UPLOAD * 1.4) {
          out = cv.toDataURL('image/jpeg', 0.6);
        }
        if (out.length > MAX_UPLOAD * 1.8) {
          cb('Image is still too large after compression. Please upload a smaller photo or paste a hosted URL.');
          return;
        }
        cb(null, out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  $('#saveImages').addEventListener('click', () => {
    const r = CFG.save({ images: draft.images, menu: draft.menu });
    if (!r.ok) { toast('Could not save images.', 'err', r.errors); return; }
    setDirty('images', false); setDirty('menu', false);
    toast('Image paths saved to your draft. Publish to make them live.', 'ok');
    renderOverview(); refreshPublishBar();
  });
  $('#revertImages').addEventListener('click', () => {
    const c = CFG.load(true);
    draft.images = JSON.parse(JSON.stringify(c.images));
    draft.menu = JSON.parse(JSON.stringify(c.menu));
    renderImages(); setDirty('images', false);
    toast('Reverted to the last saved images.');
  });
  $('#defaultImages').addEventListener('click', () => {
    confirmAsk('Restore default images?',
      'Site images return to the originals. Product images are also reset. Colours, prices, and contact details are not affected.',
      () => {
        const d = CFG.defaults();
        draft.images = JSON.parse(JSON.stringify(d.images));
        draft.menu.products.forEach((p) => {
          const def = d.menu.products.find((x) => x.id === p.id);
          if (def) p.img = def.img;
        });
        const r = CFG.save({ images: draft.images, menu: draft.menu });
        if (!r.ok) { toast('Reset failed.', 'err', r.errors); return; }
        renderImages(); setDirty('images', false); setDirty('menu', false);
        toast('Default images restored.', 'ok');
      });
  });

  /* =========================================================
     4. MENU MANAGEMENT
     ========================================================= */
  function renderCats() {
    $('#catList').innerHTML = draft.menu.categories.map((c) => {
      const n = draft.menu.products.filter((p) => p.cat === c.id).length;
      return '<span class="cat-chip" data-cat="' + esc(c.id) + '">' +
        '<input type="text" value="' + esc(c.name) + '" maxlength="40" aria-label="Rename category ' + esc(c.name) + '">' +
        '<span class="cc-count">' + n + '</span>' +
        '<button type="button" class="cat-del" aria-label="Delete category ' + esc(c.name) + '">&times;</button></span>';
    }).join('');
    const sel = $('#prodCatFilter');
    sel.innerHTML = '<option value="all">All categories</option>' +
      draft.menu.categories.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('');
  }

  $('#catList').addEventListener('input', (e) => {
    if (e.target.tagName !== 'INPUT') return;
    const id = e.target.closest('[data-cat]').getAttribute('data-cat');
    const c = draft.menu.categories.find((x) => x.id === id);
    if (c) { c.name = e.target.value; setDirty('menu', true); }
  });

  $('#catList').addEventListener('click', (e) => {
    if (!e.target.closest('.cat-del')) return;
    const id = e.target.closest('[data-cat]').getAttribute('data-cat');
    const cat = draft.menu.categories.find((x) => x.id === id);
    const used = draft.menu.products.filter((p) => p.cat === id);
    if (draft.menu.categories.length <= 1) { toast('You need at least one category.', 'err'); return; }
    confirmAsk('Delete "' + (cat ? cat.name : id) + '"?',
      used.length
        ? 'This category has ' + used.length + ' product(s). They will be deleted too. This cannot be undone until you reload without saving.'
        : 'This category is empty and will be removed.',
      () => {
        draft.menu.categories = draft.menu.categories.filter((x) => x.id !== id);
        draft.menu.products = draft.menu.products.filter((p) => p.cat !== id);
        setDirty('menu', true); renderCats(); renderProducts();
        toast('Category removed. Click "Save Changes" to apply.');
      });
  });

  $('#addCat').addEventListener('click', () => {
    const input = $('#newCatName');
    const name = input.value.trim();
    if (!name) { toast('Enter a category name first.', 'err'); return; }
    const id = CFG.slug(name);
    if (!id) { toast('That name cannot be used.', 'err'); return; }
    if (draft.menu.categories.some((c) => c.id === id)) { toast('That category already exists.', 'err'); return; }
    draft.menu.categories.push({ id: id, name: name });
    input.value = '';
    setDirty('menu', true); renderCats();
    toast('Category added. Click "Save Changes" to apply.');
  });

  function renderProducts() {
    const q = ($('#prodSearch').value || '').trim().toLowerCase();
    const cat = $('#prodCatFilter').value || 'all';
    const list = draft.menu.products.filter((p) =>
      (cat === 'all' || p.cat === cat) && (!q || p.name.toLowerCase().indexOf(q) !== -1));

    $('#prodCount').textContent = draft.menu.products.length;
    $('#prodEmpty').hidden = list.length > 0;
    $('#prodTable').innerHTML = list.map((p) => {
      const sizes = p.sizes.map((s) => esc(s.label) + ' ' + peso(s.price)).join(' · ');
      const boxTag = p.boxRule ? '<span class="pr-badge box">+₱5 box</span>' : '';
      return '<div class="prow' + (p.available === false ? ' off' : '') + '" data-pid="' + esc(p.id) + '">' +
        (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : '<img alt="">') +
        '<div class="pr-main">' +
          '<div class="pr-name">' + esc(p.name) +
            (p.featured ? '<span class="pr-badge feat">Featured</span>' : '') +
            (p.available === false ? '<span class="pr-badge off">Unavailable</span>' : '') + boxTag +
          '</div>' +
          '<div class="pr-sub">' + esc(catLabel(p.cat)) + ' — ' + sizes + '</div>' +
        '</div>' +
        '<div class="pr-acts">' +
          '<button type="button" class="a-btn a-btn-ghost" data-edit>Edit</button>' +
          '<button type="button" class="a-btn a-btn-danger" data-del>Delete</button>' +
        '</div></div>';
    }).join('');
  }
  $('#prodSearch').addEventListener('input', renderProducts);
  $('#prodCatFilter').addEventListener('change', renderProducts);

  $('#prodTable').addEventListener('click', (e) => {
    const row = e.target.closest('[data-pid]');
    if (!row) return;
    const id = row.getAttribute('data-pid');
    if (e.target.matches('[data-edit]')) { openProduct(id); return; }
    if (e.target.matches('[data-del]')) {
      const p = draft.menu.products.find((x) => x.id === id);
      confirmAsk('Delete "' + (p ? p.name : id) + '"?',
        'This removes the product from the public menu. Customers with it in their cart will be told it is no longer available.',
        () => {
          draft.menu.products = draft.menu.products.filter((x) => x.id !== id);
          setDirty('menu', true); renderProducts(); renderCats();
          toast('Product deleted. Click "Save Changes" to apply.');
        });
    }
  });

  /* ----- product editor ----- */
  let editingId = null;

  function sizeRowHtml(label, pricePhp) {
    return '<div class="size-row">' +
      '<input type="text" class="s-label" value="' + esc(label) + '" placeholder="Size (e.g. 16 oz)" maxlength="24" aria-label="Size label">' +
      '<input type="number" class="s-price" value="' + esc(pricePhp) + '" min="0" step="1" placeholder="Price ₱" aria-label="Price in pesos">' +
      '<button type="button" class="size-del" aria-label="Remove this size">&times;</button></div>';
  }

  function openProduct(id) {
    editingId = id;
    const p = id ? draft.menu.products.find((x) => x.id === id) : null;
    $('#prodModalTitle').textContent = p ? 'Edit Product' : 'Add New Product';
    $('#pCat').innerHTML = draft.menu.categories.map((c) =>
      '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('');

    $('#pName').value = p ? p.name : '';
    $('#pCat').value = p ? p.cat : (draft.menu.categories[0] || {}).id || '';
    $('#pDesc').value = p ? p.desc : '';
    $('#pImg').value = p ? p.img : '';
    $('#pAvailable').checked = p ? p.available !== false : true;
    $('#pFeatured').checked = p ? !!p.featured : false;
    $('#pBoxRule').value = p ? (p.boxRule === 'all' ? 'all' : (Array.isArray(p.boxRule) ? 'double' : '')) : '';
    $('#pSizes').innerHTML = (p && p.sizes.length ? p.sizes : [{ label: '', price: 0 }])
      .map((s) => sizeRowHtml(s.label, s.price ? toPhp(s.price) : '')).join('');
    ['errPName', 'errPImg', 'errPSizes'].forEach((k) => { $('#' + k).textContent = ''; });
    updateImgPreview();
    $('#prodScrim').hidden = false;
    setTimeout(() => $('#pName').focus(), 50);
  }
  function closeProduct() { $('#prodScrim').hidden = true; editingId = null; }

  $('#addProduct').addEventListener('click', () => openProduct(null));
  $('#prodClose').addEventListener('click', closeProduct);
  $('#prodCancel').addEventListener('click', closeProduct);
  $('#addSize').addEventListener('click', () => {
    $('#pSizes').insertAdjacentHTML('beforeend', sizeRowHtml('', ''));
  });
  $('#pSizes').addEventListener('click', (e) => {
    if (!e.target.closest('.size-del')) return;
    const rows = $$('.size-row', $('#pSizes'));
    if (rows.length <= 1) { toast('A product needs at least one size option.', 'err'); return; }
    e.target.closest('.size-row').remove();
  });

  function updateImgPreview() {
    const url = $('#pImg').value.trim();
    const img = $('#pImgPreview');
    if (url) { img.src = url; img.style.visibility = 'visible'; }
    else { img.removeAttribute('src'); img.style.visibility = 'hidden'; }
  }
  $('#pImg').addEventListener('input', updateImgPreview);
  $('#pImgFile').addEventListener('change', (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    readImageFile(e.target.files[0], (err, dataUrl) => {
      e.target.value = '';
      if (err) { $('#errPImg').textContent = err; return; }
      $('#errPImg').textContent = '';
      $('#pImg').value = dataUrl;
      updateImgPreview();
    });
  });

  $('#prodSave').addEventListener('click', () => {
    const name = $('#pName').value.trim();
    const img = $('#pImg').value.trim();
    let bad = false;

    $('#errPName').textContent = '';
    $('#errPImg').textContent = '';
    $('#errPSizes').textContent = '';

    if (!name) { $('#errPName').textContent = 'Product name is required.'; bad = true; }
    if (img && !CFG.isSafeUrl(img)) {
      $('#errPImg').textContent = 'Use an https URL, an assets/… path, or upload a file.'; bad = true;
    }

    const sizes = [];
    const seen = {};
    $$('.size-row', $('#pSizes')).forEach((row) => {
      const label = $('.s-label', row).value.trim();
      const raw = $('.s-price', row).value;
      if (!label && raw === '') return;
      if (!label) { $('#errPSizes').textContent = 'Every size needs a label.'; bad = true; return; }
      if (seen[label.toLowerCase()]) { $('#errPSizes').textContent = 'Duplicate size "' + label + '".'; bad = true; return; }
      const php = Number(raw);
      if (raw === '' || !isFinite(php) || php < 0) {
        $('#errPSizes').textContent = 'Price for "' + label + '" must be a number of 0 or more.'; bad = true; return;
      }
      seen[label.toLowerCase()] = true;
      sizes.push({ label: label, price: toCentavos(php) });
    });
    if (!sizes.length && !$('#errPSizes').textContent) {
      $('#errPSizes').textContent = 'Add at least one size and price.'; bad = true;
    }
    if (bad) return;

    const boxSel = $('#pBoxRule').value;
    const boxRule = boxSel === 'all' ? 'all' : (boxSel === 'double' ? ['Double'] : null);

    const record = {
      id: editingId || uniqueProductId(name),
      cat: $('#pCat').value,
      name: name,
      desc: $('#pDesc').value.trim(),
      img: img,
      sizes: sizes,
      featured: $('#pFeatured').checked,
      available: $('#pAvailable').checked,
      boxRule: boxRule
    };

    if (editingId) {
      const i = draft.menu.products.findIndex((x) => x.id === editingId);
      if (i !== -1) draft.menu.products[i] = record; else draft.menu.products.push(record);
    } else {
      draft.menu.products.push(record);
    }

    setDirty('menu', true);
    closeProduct(); renderProducts(); renderCats(); renderProductImages();
    toast('Product saved in the editor. Click "Save Changes" to publish it.');
  });

  function uniqueProductId(name) {
    let base = CFG.slug(name) || 'item';
    let id = base, n = 2;
    while (draft.menu.products.some((p) => p.id === id)) { id = base + '-' + n; n++; }
    return id;
  }

  $('#saveMenu').addEventListener('click', () => {
    // Normalise category names typed inline before validating.
    draft.menu.categories = draft.menu.categories.map((c) => ({ id: c.id, name: String(c.name || '').trim() }));
    const check = CFG.validateMenu(draft.menu);
    if (!check.ok) { toast('Menu not saved — please fix these:', 'err', check.errors); return; }
    const r = CFG.save({ menu: check.value });
    if (!r.ok) { toast('Could not save the menu.', 'err', r.errors); return; }
    draft.menu = JSON.parse(JSON.stringify(CFG.load(true).menu));
    setDirty('menu', false);
    renderCats(); renderProducts(); renderProductImages(); renderOverview(); refreshPublishBar();
    toast('Menu saved to your draft. Publish to GitHub so customers get these prices.', 'ok');
  });

  $('#revertMenu').addEventListener('click', () => {
    draft.menu = JSON.parse(JSON.stringify(CFG.load(true).menu));
    setDirty('menu', false); renderCats(); renderProducts(); renderProductImages();
    toast('Reverted to the last saved menu.');
  });

  $('#defaultMenu').addEventListener('click', () => {
    confirmAsk('Restore the default menu?',
      'All products, prices, and categories return to the original BTK Coffee menu. Colours, images, and contact details are not affected.',
      () => {
        const r = CFG.resetSection('menu');
        if (!r.ok) { toast('Reset failed.', 'err', r.errors); return; }
        draft.menu = JSON.parse(JSON.stringify(CFG.load(true).menu));
        setDirty('menu', false); renderCats(); renderProducts(); renderProductImages(); renderOverview();
        toast('Default menu restored.', 'ok');
      });
  });

  /* =========================================================
     5. CONTACT & LOCATION
     ========================================================= */
  const CONTACT_FIELDS = [
    { k: 'brand', l: 'Business display name', t: 'text', req: true },
    { k: 'tagline', l: 'Tagline', t: 'text' },
    { k: 'messenger', l: 'Messenger URL', t: 'url', req: true },
    { k: 'facebook', l: 'Facebook page URL', t: 'url', ph: 'Leave blank to hide' },
    { k: 'maps', l: 'Google Maps URL', t: 'url', req: true },
    { k: 'heading', l: 'Contact section heading', t: 'text', wide: true },
    { k: 'description', l: 'Contact section description', t: 'textarea', wide: true },
    { k: 'phone', l: 'Displayed phone number', t: 'text', ph: 'Leave blank to hide' },
    { k: 'email', l: 'Displayed email address', t: 'text', ph: 'Leave blank to hide' },
    { k: 'address', l: 'Displayed physical address', t: 'text', ph: 'Leave blank to hide', wide: true },
    { k: 'instructions', l: 'Additional customer instructions', t: 'textarea', wide: true },
    { k: 'freeArea', l: 'Free-delivery area', t: 'text' },
    { k: 'pinLocation', l: 'Courier pin location', t: 'text' },
    { k: 'contactName', l: 'Courier contact name', t: 'text' },
    { k: 'contactNumber', l: 'Courier contact number', t: 'text' }
  ];

  function renderContact() {
    $('#contactForm').innerHTML = CONTACT_FIELDS.map((f) => {
      const v = esc(draft.contact[f.k] || '');
      const ctrl = f.t === 'textarea'
        ? '<textarea class="a-input" rows="2" data-cf="' + f.k + '" placeholder="' + esc(f.ph || '') + '">' + v + '</textarea>'
        : '<input type="text" class="a-input" data-cf="' + f.k + '" value="' + v + '" placeholder="' + esc(f.ph || '') + '">';
      return '<div class="a-field' + (f.wide ? ' wide' : '') + '">' +
        '<label for="cf-' + f.k + '">' + esc(f.l) + (f.req ? ' <span style="color:#A8504A">*</span>' : '') + '</label>' +
        ctrl.replace('class="a-input"', 'class="a-input" id="cf-' + f.k + '"') +
        '<p class="a-err" data-cerr="' + f.k + '"></p></div>';
    }).join('');
  }

  $('#contactForm').addEventListener('input', (e) => {
    const k = e.target.getAttribute('data-cf');
    if (!k) return;
    draft.contact[k] = e.target.value;
    setDirty('contact', true);
    const errEl = $('[data-cerr="' + k + '"]');
    const isUrlField = ['messenger', 'maps', 'facebook'].indexOf(k) !== -1;
    if (isUrlField && e.target.value.trim() && !CFG.isHttpUrl(e.target.value.trim())) {
      errEl.textContent = 'Must be a full http(s) URL.';
      e.target.classList.add('invalid');
    } else { errEl.textContent = ''; e.target.classList.remove('invalid'); }
  });

  $('#saveContact').addEventListener('click', () => {
    const check = CFG.validateContact(draft.contact);
    if (!check.ok) { toast('Contact details not saved:', 'err', check.errors); return; }
    const r = CFG.save({ contact: check.value });
    if (!r.ok) { toast('Could not save contact details.', 'err', r.errors); return; }
    draft.contact = JSON.parse(JSON.stringify(CFG.load(true).contact));
    renderContact(); setDirty('contact', false); renderOverview(); refreshPublishBar();
    toast('Contact details saved to your draft. Publish to make them live.', 'ok');
  });
  $('#revertContact').addEventListener('click', () => {
    draft.contact = JSON.parse(JSON.stringify(CFG.load(true).contact));
    renderContact(); setDirty('contact', false); toast('Reverted to the last saved details.');
  });
  $('#defaultContact').addEventListener('click', () => {
    confirmAsk('Restore default contact info?',
      'Business name, tagline, Messenger and Maps links return to the original values. Colours, images, and the menu are not affected.',
      () => {
        const r = CFG.resetSection('contact');
        if (!r.ok) { toast('Reset failed.', 'err', r.errors); return; }
        draft.contact = JSON.parse(JSON.stringify(CFG.load(true).contact));
        renderContact(); setDirty('contact', false); renderOverview();
        toast('Default contact information restored.', 'ok');
      });
  });

  /* =========================================================
     6. ACCOUNT SECURITY
     ========================================================= */
  $('#pwNew').addEventListener('input', () => {
    const p = CFG.passwordPolicy($('#pwNew').value);
    const bar = $('#pwBar');
    const len = $('#pwNew').value.length;
    const pct = Math.min(100, Math.round((len / 16) * 100));
    bar.style.width = pct + '%';
    bar.className = p.strong ? 'good' : (p.ok ? 'mid' : '');
  });

  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cur = $('#pwCurrent').value;
    const nw = $('#pwNew').value;
    const cf = $('#pwConfirm').value;
    let bad = false;
    ['errCurrent', 'errNew', 'errConfirm'].forEach((k) => { $('#' + k).textContent = ''; });

    if (!cur) { $('#errCurrent').textContent = 'Enter your current password.'; bad = true; }
    if (!nw) { $('#errNew').textContent = 'Enter a new password.'; bad = true; }
    if (!cf) { $('#errConfirm').textContent = 'Re-enter the new password.'; bad = true; }
    if (bad) return;

    const policy = CFG.passwordPolicy(nw);
    if (!policy.ok) { $('#errNew').textContent = 'Password needs ' + policy.issues.join(', ') + '.'; return; }
    if (nw !== cf) { $('#errConfirm').textContent = 'The two passwords do not match.'; return; }
    if (nw === cur) { $('#errNew').textContent = 'The new password must be different from the current one.'; return; }

    const ok = await CFG.verifyPassword(cur);
    if (!ok) { $('#errCurrent').textContent = 'Current password is incorrect.'; return; }

    const res = await CFG.setPassword(nw);
    if (!res.ok) { toast('Password change failed.', 'err', res.errors); return; }

    $('#pwCurrent').value = ''; $('#pwNew').value = ''; $('#pwConfirm').value = '';
    $('#pwBar').style.width = '0'; $('#pwBar').className = '';
    $('#defaultHint').textContent = '';
    toast('Password updated for this browser.', 'ok');
  });

  /* =========================================================
     PUBLISH PIPELINE  — validate, then commit to GitHub
     Nothing reaches customers until it passes validation AND is
     committed to data/site-config.json in the repository.
     ========================================================= */
  function pbSet(state, text) {
    $('#pbDot').className = 'pb-dot ' + (state || '');
    $('#pbText').textContent = text;
  }

  function refreshPublishBar() {
    const st = CFG.remoteState();
    const hasDraft = CFG.hasDraft() && CFG.draftDiffers();
    const preview = CFG.previewOn();
    $('#publishBar').classList.toggle('is-preview', preview);
    $('#pbPreview').textContent = preview ? 'Exit Preview' : 'Preview Draft';
    $('#livePill').hidden = !(st === 'ok' && !hasDraft);
    $('#pbDiscard').disabled = !CFG.hasDraft();

    if (hasDraft) {
      pbSet('warn', 'Unpublished draft changes — customers still see the live version.');
    } else if (st === 'ok') {
      pbSet('ok', 'Live configuration published from ' + CFG.REMOTE_PATH + '.');
    } else if (st === 'missing') {
      pbSet('warn', 'Nothing published yet. Publish to create ' + CFG.REMOTE_PATH + ' in your repo.');
    } else if (st === 'error') {
      pbSet('err', CFG.remoteMessage());
    } else {
      pbSet('', 'Checking published configuration…');
    }
  }

  async function doPublish(force) {
    const btn = $('#pbPublish');
    btn.disabled = true;
    pbSet('busy', 'Validating configuration…');

    // 1. Validate everything first — an invalid config can never be committed.
    const current = CFG.load(true);
    const check = CFG.validateAll({
      theme: current.theme, images: current.images,
      contact: current.contact, menu: current.menu
    });
    if (!check.ok) {
      btn.disabled = false;
      pbSet('err', 'Validation failed — nothing was committed.');
      toast('Publish blocked. Fix these first:', 'err', check.errors);
      return;
    }

    pbSet('busy', 'Committing to GitHub…');
    const res = await CFG.publish({ expectSha: CFG.publishedSha(), force: !!force });

    if (!res.ok) {
      btn.disabled = false;
      if (res.stage === 'conflict') {
        pbSet('warn', 'Conflict with the version in GitHub.');
        confirmAsk('Overwrite the published config?',
          'data/site-config.json changed in GitHub since this page loaded. Publishing now replaces it. Reload first if someone else may have made changes.',
          () => doPublish(true));
        return;
      }
      pbSet('err', 'Publish failed — nothing was committed.');
      toast('Publish failed (' + res.stage + '):', 'err', res.errors);
      return;
    }

    // 2. Draft is now live — clear it so the two can't drift apart.
    CFG.discardDraft();
    CFG.setPreview(false);
    draft = freshDraft();
    btn.disabled = false;
    clearDirty();
    refreshPublishBar();
    renderOverview();
    toast((res.replaced ? 'Updated ' : 'Created ') + res.path +
      ' in GitHub. Customers see it once Pages redeploys (~1 min).', 'ok');
  }

  $('#pbPublish').addEventListener('click', () => {
    const s = CFG.getRepoSettings();
    if (!s.owner || !s.repo || !CFG.ghToken.has()) {
      toast('Connect GitHub first — opening GitHub Setup.', 'err');
      gotoView('github');
      return;
    }
    const n = [];
    if (dirty.theme) n.push('colours');
    if (dirty.images) n.push('images');
    if (dirty.menu) n.push('menu');
    if (dirty.contact) n.push('contact details');
    confirmAsk('Publish to GitHub?',
      'This validates the whole configuration and commits it to ' + CFG.REMOTE_PATH +
      '. Once GitHub Pages redeploys, every visitor sees these changes' +
      (n.length ? ' (pending: ' + n.join(', ') + ').' : '.'),
      () => doPublish(false));
  });

  $('#pbPreview').addEventListener('click', () => {
    const on = !CFG.previewOn();
    CFG.setPreview(on);
    refreshPublishBar();
    if (on) {
      toast('Preview on. Open the site in THIS tab\'s session to see draft changes.', 'ok');
      window.open('index.html', '_blank', 'noopener');
    } else {
      toast('Preview off. The site shows the published version again.');
    }
  });

  $('#pbDiscard').addEventListener('click', () => {
    confirmAsk('Discard local draft?',
      'All unpublished edits in this browser are deleted and the dashboard reloads the live published configuration. This cannot be undone.',
      () => {
        CFG.discardDraft();
        CFG.setPreview(false);
        draft = freshDraft();
        clearDirty();
        hydrateAll();
        refreshPublishBar();
        toast('Draft discarded. Showing the published configuration.', 'ok');
      });
  });

  /* =========================================================
     HYDRATE + BOOT
     ========================================================= */
  function hydrateAll() {
    draft = freshDraft();
    const err = CFG.loadError();
    if (err) toast(err, 'err');
    renderOverview();
    renderColors();
    renderRepoSettings();
    renderImages();
    renderCats();
    renderProducts();
    renderContact();
    clearDirty();
    refreshPublishBar();
    renderConnection();
  }

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#confirmScrim').hidden) { confirmClose(); return; }
    if (!$('#prodScrim').hidden) { closeProduct(); return; }
    if ($('#aSide').classList.contains('open')) closeSide();
  });
  $('#prodScrim').addEventListener('click', (e) => { if (e.target === $('#prodScrim')) closeProduct(); });

  // Keep the session alive while actively working.
  ['click', 'keydown'].forEach((evt) =>
    document.addEventListener(evt, () => { if (!dashView.hidden) CFG.touchSession(); }, { passive: true }));

  // Session guard: expired or absent session always lands on the login screen.
  setInterval(() => {
    if (!dashView.hidden && !CFG.sessionValid()) {
      showLogin();
      loginAlert('Your session expired after 30 minutes of inactivity. Please sign in again.');
    }
  }, 20000);

  if (CFG.sessionValid()) showDash(); else showLogin();
})();
