/* ==========================================================
   Duaa Perfumes — storefront interactions
   ========================================================== */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const WA = 'https://wa.me/message/HJKRWLGVJB6BG1';
  const img = (f) => 'assets/img/' + f;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };

  /* ---------- Catalogue (packshots supplied by Duaa) ---------- */
  const PRODUCTS = [
    { id: 'limmensite', name: "L'Immensité", family: 'fresh', badge: 'Bestseller',
      inspired: 'Louis Vuitton', image: 'packshots/limmensite.webp', vibe: 'Fresh · Aquatic · Clean' },
    { id: 'purpose', name: 'Purpose 50', family: 'woody', badge: '',
      inspired: 'Amouage', image: 'packshots/purpose.webp', vibe: 'Woody · Resinous · Regal' },
    { id: 'kirke', name: 'Kirke', family: 'sweet', badge: 'New',
      inspired: 'Tiziana Terenzi', image: 'packshots/kirke.webp', vibe: 'Sweet · Fruity · Sensual' },
    { id: 'aventus', name: 'Aventus Absolu', family: 'woody', badge: 'Noir Edition',
      inspired: 'Creed', image: 'packshots/aventus.webp', vibe: 'Fruity · Smoky · Iconic' },
  ];
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const typeOf = () => 'Extrait de Parfum';
  const ROUNDS = 3; // until more packshots arrive, the four bottles repeat to fill the grid

  /* ---------- Render grid ---------- */
  const grid = $('#grid');
  let saved = store.get('duaa-saved', []);

  const cardHTML = (p, first) => `
      <article class="card" data-id="${p.id}" data-family="${p.family}"${first ? '' : ' data-repeat'}>
        <div class="card__media">
          ${first && p.badge ? `<span class="card__badge">${p.badge}</span>` : ''}
          <img src="${img(p.image)}" alt="Duaa ${p.name}, inspired by ${p.inspired}" loading="lazy" />
        </div>
        <div class="card__info">
          <p class="card__type">Inspired by ${p.inspired}</p>
          <h3 class="card__name">${p.name}</h3>
          <p class="card__meta">${p.vibe}</p>
          <button class="card__save${saved.includes(p.id) ? ' is-on' : ''}" data-save="${p.id}" aria-label="Save ${p.name}">
            <svg viewBox="0 0 13 16"><path d="M.6.6h11.8v14.6L6.5 11 .6 15.2z"/></svg>
          </button>
        </div>
        <button class="card__add" data-add="${p.id}">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M2.5 5.5h11l-1 9h-9z"/><path d="M5.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"/></svg>
          Add to bag
        </button>
      </article>`;

  let html = '';
  for (let r = 0; r < ROUNDS; r++) PRODUCTS.forEach((p) => { html += cardHTML(p, r === 0); });
  grid.innerHTML = html + '<p class="empty" hidden>No fragrances match these filters.</p>';
  $('#totalCount').textContent = `(${PRODUCTS.length})`;

  /* ---------- Filters ---------- */
  const filterInputs = $$('#filters input');
  function applyFilters() {
    const fams = filterInputs.filter((i) => i.checked).map((i) => i.value);
    const shown = new Set();
    $$('.card', grid).forEach((c) => {
      // Repeated copies only pad the full grid; a filtered view lists each fragrance once
      const ok = !fams.length ? true : fams.includes(c.dataset.family) && !('repeat' in c.dataset);
      c.hidden = !ok;
      if (ok) shown.add(c.dataset.id);
    });
    $('.empty', grid).hidden = shown.size > 0;
    $('#filterCount').textContent = `(${fams.length})`;
    $('#shownCount').textContent = `${shown.size} fragrance${shown.size === 1 ? '' : 's'}`;
    $$('.subnav a[data-jump]').forEach((a) => {
      const j = a.dataset.jump;
      a.classList.toggle('is-active', (j === 'all' && !fams.length) || (fams.length === 1 && fams[0] === j));
    });
  }
  filterInputs.forEach((i) => i.addEventListener('change', applyFilters));
  $('#filtersClear').addEventListener('click', () => { filterInputs.forEach((i) => { i.checked = false; }); applyFilters(); });
  // Category links act as quick filters
  $$('[data-jump]').forEach((a) => a.addEventListener('click', () => {
    filterInputs.forEach((i) => { i.checked = i.value === a.dataset.jump; });
    applyFilters();
    closeLayers();
  }));
  applyFilters();

  // Grid density
  $$('.view-toggle button').forEach((b) => b.addEventListener('click', () => {
    $$('.view-toggle button').forEach((x) => x.classList.toggle('is-active', x === b));
    grid.dataset.cols = b.dataset.cols;
    store.set('duaa-cols', b.dataset.cols);
  }));
  const cols = store.get('duaa-cols', '4');
  if (cols !== '4') $(`.view-toggle [data-cols="${cols}"]`).click();

  /* ---------- Layers (drawers, product view) ---------- */
  const scrim = $('#scrim');
  let lastFocus = null;
  function openLayer(el) {
    closeLayers();
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    if (el.classList.contains('drawer')) scrim.classList.add('is-on');
    document.body.classList.add('is-locked');
    const focusable = $('[data-close]', el);
    focusable && focusable.focus({ preventScroll: true });
  }
  function closeLayers() {
    $$('.drawer.is-open').forEach((el) => { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); });
    scrim.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    if (lastFocus) { lastFocus.focus({ preventScroll: true }); lastFocus = null; }
  }
  $('#menuOpen').addEventListener('click', () => openLayer($('#menu')));
  $('#filtersOpen').addEventListener('click', () => openLayer($('#filters')));
  $('#bagOpen').addEventListener('click', () => openLayer($('#bag')));
  scrim.addEventListener('click', closeLayers);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeLayers(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLayers(); });

  /* ---------- Saved (wishlist) ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const id = b.dataset.save;
    saved = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    store.set('duaa-saved', saved);
    b.classList.toggle('is-on', saved.includes(id));
    toast(saved.includes(id) ? 'Saved' : 'Removed from saved');
  });

  /* ---------- Bag ---------- */
  let bag = store.get('duaa-bag', []).filter((l) => byId[l.id]);
  function renderBag() {
    const n = bag.reduce((s, l) => s + l.qty, 0);
    $('#bagCount').textContent = n;
    $('#bagCount2').textContent = n;
    $('#bagItems').innerHTML = bag.length ? bag.map((l) => {
      const p = byId[l.id];
      return `
        <div class="line">
          <div class="line__img"><img src="${img(p.image)}" alt="" /></div>
          <div>
            <p class="line__name">${p.name}</p>
            <p class="line__sub">${typeOf(p)}</p>
            <div class="line__qty">
              <button data-dec="${l.id}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-inc="${l.id}" aria-label="Increase">+</button>
              <button class="line__remove" data-remove="${l.id}">Remove</button>
            </div>
          </div>
        </div>`;
    }).join('') : '<p class="bag__empty">Your bag is empty</p>';
    $('#checkout').disabled = !bag.length;
    store.set('duaa-bag', bag);
  }
  function addToBag(id) {
    const l = bag.find((x) => x.id === id);
    if (l) l.qty++; else bag.push({ id, qty: 1 });
    renderBag();
    toast(`${byId[id].name} added to bag`);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (a) {
      addToBag(a.dataset.add);
      if (a.classList.contains('card__add') && !a.classList.contains('is-added')) {
        const label = a.innerHTML;
        a.classList.add('is-added');
        a.textContent = 'Added ✓';
        setTimeout(() => { a.innerHTML = label; a.classList.remove('is-added'); }, 1400);
      }
      return;
    }
    const t = e.target.closest('[data-inc], [data-dec], [data-remove]');
    if (!t) return;
    const id = t.dataset.inc || t.dataset.dec || t.dataset.remove;
    const l = bag.find((x) => x.id === id);
    if (t.dataset.inc) l.qty++;
    if (t.dataset.dec) l.qty--;
    if (t.dataset.remove) l.qty = 0;
    bag = bag.filter((x) => x.qty > 0);
    renderBag();
  });
  $('#checkout').addEventListener('click', async () => {
    const text = 'Hi Duaa Perfumes, I would like to order:\n' +
      bag.map((l) => `• ${byId[l.id].name} × ${l.qty}`).join('\n');
    try { await navigator.clipboard.writeText(text); toast('Order copied — paste it in WhatsApp'); } catch (_) { toast('Opening WhatsApp'); }
    window.open(WA, '_blank', 'noopener');
  });
  renderBag();

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('Thank you for subscribing'); });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
  }

  /* ---------- Header hides on scroll down ---------- */
  const header = $('#header');
  let lastY = scrollY;
  window.addEventListener('scroll', () => {
    const y = scrollY;
    const hide = y > lastY && y > 300;
    header.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('header-hidden', hide);
    lastY = y;
  }, { passive: true });
})();
