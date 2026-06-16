(function () {
  var root = document.getElementById('yrf-root');
  if (!root) return;

  var PAGE_SIZE = 30;

  function trim(s) { return s.trim(); }

  var state = { type: 'all', ftype: null, fibres: [], weight: null, sort: 'manual', page: 1 };

  var allCards   = Array.from(root.querySelectorAll('.yrf-card'));
  var editorial  = document.getElementById('yrf-editorial');
  var subchipsEl = document.getElementById('yrf-subchips');
  var subchipType = subchipsEl ? (subchipsEl.dataset.subchipType || '').toLowerCase() : '';
  var fibreContainer = document.getElementById('yrf-fibre-opts');

  // ── Wishlist / favourites ──
  var WISHLIST_KEY = 'fp_wishlist';
  var PROXY_BASE   = '/apps/fabric-shop/api';
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch(e) { return []; }
  }
  function setWishlist(list) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch(e) {}
  }
  function initFavBtns() {
    var favs = getWishlist();
    root.querySelectorAll('.yrf-fav').forEach(function(btn) {
      var pid = String(btn.dataset.productId || '');
      var on  = favs.indexOf(pid) > -1;
      btn.textContent = on ? '♥' : '♡';
      btn.classList.toggle('active', on);
    });
  }

  // ── Build fabric.type sub-category chips (single-select), preserving the active one ──
  function buildSubchips() {
    if (!subchipsEl || !subchipType) return;
    var ftypeMap = {};
    allCards.forEach(function (card) {
      if ((card.dataset.type || '').toLowerCase() !== subchipType) return;
      var raw = (card.dataset.ftype || '').trim();
      if (!raw) return;
      var key = raw.toLowerCase();
      if (!ftypeMap[key]) ftypeMap[key] = { label: raw, count: 0 };
      ftypeMap[key].count++;
    });
    subchipsEl.innerHTML = '';
    Object.keys(ftypeMap).sort().forEach(function (key) {
      var item = ftypeMap[key];
      var span = document.createElement('span');
      span.className = 'yrf-subchip';
      if (state.ftype === key) span.classList.add('active');
      span.setAttribute('data-ftype', key);
      span.innerHTML = escHtml(item.label) + ' <em>' + item.count + '</em>';
      subchipsEl.appendChild(span);
    });
  }

  // ── Build fibre filter options from product data, preserving checked state ──
  function buildFibreOptions() {
    var fibreMap = {};
    allCards.forEach(function (card) {
      (card.dataset.fibre || '').split(',').forEach(function (f) {
        f = f.trim();
        if (f) fibreMap[f] = (fibreMap[f] || 0) + 1;
      });
    });
    fibreContainer.innerHTML = '';
    Object.keys(fibreMap).sort().forEach(function (fibre) {
      var checked = state.fibres.indexOf(fibre) > -1 ? ' checked' : '';
      var lbl = document.createElement('label');
      lbl.className = 'yrf-opt';
      lbl.innerHTML =
        '<input type="checkbox" value="' + esc(fibre) + '" class="yrf-checkbox"' + checked + '>' +
        '<span class="yrf-opt-label">' + cap(fibre) + '</span>' +
        '<span class="yrf-opt-count">' + fibreMap[fibre] + '</span>';
      fibreContainer.appendChild(lbl);
    });
  }

  buildSubchips();
  buildFibreOptions();

  function matches(card) {
    var type   = (card.dataset.type   || '').trim();
    var fibres = (card.dataset.fibre  || '').split(',').map(trim).filter(Boolean);
    var weight = (card.dataset.weight || '').trim();
    if (state.type !== 'all' && type !== state.type) return false;
    if (state.ftype && (card.dataset.ftype || '').toLowerCase() !== state.ftype) return false;
    if (state.fibres.length && !state.fibres.some(function (f) { return fibres.indexOf(f) > -1; })) return false;
    if (state.weight && weight !== state.weight) return false;
    return true;
  }

  function sorted(cards) {
    if (state.sort === 'manual') return cards;
    return cards.slice().sort(function (a, b) {
      if (state.sort === 'price-asc')  return +a.dataset.price - +b.dataset.price;
      if (state.sort === 'price-desc') return +b.dataset.price - +a.dataset.price;
      if (state.sort === 'title-asc')  return a.dataset.title.localeCompare(b.dataset.title);
      return 0;
    });
  }

  // ── Main render ──
  function apply() {
    var grid     = document.getElementById('yrf-grid');
    var filtered = allCards.filter(matches);
    var ordered  = sorted(filtered);
    var total    = ordered.length;
    var showing  = Math.min(state.page * PAGE_SIZE, total);

    // Re-order DOM and show/hide
    ordered.forEach(function (card, i) {
      card.hidden = i >= showing;
      grid.appendChild(card);
    });
    allCards.forEach(function (card) {
      if (filtered.indexOf(card) === -1) {
        card.hidden = true;
        grid.appendChild(card);
      }
    });

    // Re-position editorial: only on the "all" view, after the 8th card
    if (editorial) {
      editorial.hidden = state.type !== 'all' || ordered.length === 0;
      if (!editorial.hidden) {
        var target = ordered[8] || null;
        grid.insertBefore(editorial, target);
      }
    }

    // Empty state
    var emptyEl = grid.querySelector('.yrf-empty');
    if (filtered.length === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'yrf-empty';
        emptyEl.textContent = 'No products match these filters.';
        grid.appendChild(emptyEl);
      }
    } else if (emptyEl) {
      emptyEl.remove();
    }

    // Counts
    document.getElementById('yrf-count-range').textContent = total > 0 ? '1–' + showing : '0';
    document.getElementById('yrf-count-total').textContent = total;
    document.getElementById('yrf-footer-meta').textContent = showing + ' of ' + total;

    var loadMore = document.getElementById('yrf-load-more');
    loadMore.hidden = showing >= total;
    if (!loadMore.hidden) {
      loadMore.textContent = 'Load ' + Math.min(total - showing, PAGE_SIZE) + ' more';
    }

    renderChips();
    updateCounts();
    document.getElementById('yrf-clear').hidden = !(state.type !== 'all' || state.ftype || state.fibres.length || state.weight);
  }

  // ── Sidebar counts (per product type + total) ──
  function updateCounts() {
    var counts = { all: allCards.length };
    allCards.forEach(function (card) {
      var t = (card.dataset.type || '').trim();
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
    root.querySelectorAll('[data-type-count]').forEach(function (el) {
      var k = el.getAttribute('data-type-count');
      el.textContent = counts[k] || 0;
    });
  }

  // ── Active filter chips ──
  function renderChips() {
    var c = document.getElementById('yrf-active-chips');
    c.innerHTML = '';
    if (state.type !== 'all') {
      var radioEl = root.querySelector('.yrf-radio[value="' + state.type + '"]');
      var label   = radioEl
        ? radioEl.parentNode.querySelector('.yrf-opt-label').textContent
        : state.type;
      chip(c, label, function () {
        state.type = 'all'; state.ftype = null; state.page = 1;
        root.querySelector('.yrf-radio[value="all"]').checked = true;
        syncSubchips();
        apply();
      });
    }
    if (state.ftype) {
      var sc = subchipsEl ? subchipsEl.querySelector('.yrf-subchip[data-ftype="' + state.ftype + '"]') : null;
      var scLabel = sc ? sc.textContent.replace(/\s*\d+\s*$/, '').trim() : state.ftype;
      chip(c, scLabel, function () {
        state.ftype = null; state.page = 1;
        if (sc) sc.classList.remove('active');
        apply();
      });
    }
    state.fibres.forEach(function (f) {
      chip(c, cap(f), function () {
        state.fibres = state.fibres.filter(function (x) { return x !== f; });
        state.page = 1;
        var cb = root.querySelector('.yrf-checkbox[value="' + f + '"]');
        if (cb) cb.checked = false;
        apply();
      });
    });
    if (state.weight) {
      chip(c, cap(state.weight) + ' weight', function () {
        state.weight = null; state.page = 1;
        root.querySelectorAll('.yrf-chip[data-weight]').forEach(function (ch) { ch.classList.remove('active'); });
        apply();
      });
    }
  }

  function chip(container, label, onRemove) {
    var el = document.createElement('span');
    el.className = 'yrf-active-chip';
    el.innerHTML = escHtml(label) + '<span class="yrf-active-chip-x" role="button" aria-label="Remove filter">×</span>';
    el.querySelector('.yrf-active-chip-x').addEventListener('click', onRemove);
    container.appendChild(el);
  }

  // ── Wire up controls ──
  root.querySelectorAll('.yrf-radio').forEach(function (radio) {
    radio.addEventListener('change', function () {
      state.type = this.value; state.ftype = null; state.page = 1;
      syncSubchips();
      apply();
    });
  });

  // Show subchips only when the designated type is active; clear active states otherwise.
  function syncSubchips() {
    if (!subchipsEl || !subchipType) return;
    var show = state.type === subchipType && subchipsEl.children.length > 0;
    subchipsEl.classList.toggle('yrf-hidden', !show);
    if (!show) {
      subchipsEl.querySelectorAll('.yrf-subchip').forEach(function (s) { s.classList.remove('active'); });
    }
  }

  if (subchipsEl) {
    subchipsEl.addEventListener('click', function (e) {
      var chipEl = e.target.closest('.yrf-subchip');
      if (!chipEl) return;
      var val = chipEl.getAttribute('data-ftype');
      if (state.ftype === val) {
        state.ftype = null;
        chipEl.classList.remove('active');
      } else {
        subchipsEl.querySelectorAll('.yrf-subchip').forEach(function (s) { s.classList.remove('active'); });
        state.ftype = val;
        chipEl.classList.add('active');
      }
      state.page = 1;
      apply();
    });
  }

  fibreContainer.addEventListener('change', function (e) {
    if (!e.target.classList.contains('yrf-checkbox')) return;
    var val = e.target.value;
    if (e.target.checked) { if (state.fibres.indexOf(val) === -1) state.fibres.push(val); }
    else { state.fibres = state.fibres.filter(function (f) { return f !== val; }); }
    state.page = 1;
    apply();
  });

  root.querySelectorAll('.yrf-chip[data-weight]').forEach(function (ch) {
    ch.addEventListener('click', function () {
      var w = this.dataset.weight;
      if (state.weight === w) {
        state.weight = null;
        this.classList.remove('active');
      } else {
        root.querySelectorAll('.yrf-chip[data-weight]').forEach(function (c) { c.classList.remove('active'); });
        state.weight = w;
        this.classList.add('active');
      }
      state.page = 1;
      apply();
    });
  });

  document.getElementById('yrf-sort-select').addEventListener('change', function () {
    state.sort = this.value; state.page = 1; apply();
  });

  document.getElementById('yrf-load-more').addEventListener('click', function () {
    state.page++;
    apply();
  });

  document.getElementById('yrf-clear').addEventListener('click', function () {
    state.type = 'all'; state.ftype = null; state.fibres = []; state.weight = null; state.page = 1;
    root.querySelector('.yrf-radio[value="all"]').checked = true;
    fibreContainer.querySelectorAll('.yrf-checkbox').forEach(function (c) { c.checked = false; });
    root.querySelectorAll('.yrf-chip[data-weight]').forEach(function (c) { c.classList.remove('active'); });
    syncSubchips();
    apply();
  });

  // ── Fav button click (delegate from grid so it works after loadAllPages appends cards) ──
  document.getElementById('yrf-grid').addEventListener('click', function(e) {
    var btn = e.target.closest('.yrf-fav');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var pid = String(btn.dataset.productId || '');
    if (!pid) return;
    var favs   = getWishlist();
    var isFaved = favs.indexOf(pid) > -1;
    if (isFaved) {
      favs = favs.filter(function(id) { return id !== pid; });
    } else {
      favs.push(pid);
    }
    setWishlist(favs);
    btn.textContent = isFaved ? '♡' : '♥';
    btn.classList.toggle('active', !isFaved);
    fetch(PROXY_BASE + '/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isFaved ? 'remove' : 'add', productId: pid })
    }).catch(function() {});
  });

  // ── Collapse/expand filter groups ──
  root.querySelectorAll('.yrf-group-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var group  = this.closest('.yrf-group');
      var toggle = this.querySelector('.yrf-group-toggle');
      group.classList.toggle('collapsed');
      toggle.textContent = group.classList.contains('collapsed') ? '+' : '−';
    });
  });

  // ── Helpers ──
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function esc(s) { return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Background-load remaining pages so filters/sort/counts span the whole catalogue ──
  function loadAllPages() {
    var dataEl = document.getElementById('yrf-pagination-data');
    var totalPages = dataEl ? parseInt(dataEl.getAttribute('data-total-pages'), 10) : 1;
    if (!totalPages || totalPages < 2) return;

    var grid    = document.getElementById('yrf-grid');
    var footer  = document.getElementById('yrf-footer-meta');
    var base    = location.pathname;
    var pageNums = [];
    for (var p = 2; p <= totalPages; p++) pageNums.push(p);

    if (footer) footer.textContent = 'Loading all products…';

    var CONCURRENCY = 4;
    var results = {};   // page number -> array of card nodes
    var nextIdx = 0;
    var done = 0;

    function fetchPage(pageNum) {
      var sep = base.indexOf('?') > -1 ? '&' : '?';
      return fetch(base + sep + 'page=' + pageNum, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (html) {
          if (!html) { results[pageNum] = []; return; }
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var srcGrid = doc.getElementById('yrf-grid');
          var cards = srcGrid ? Array.from(srcGrid.querySelectorAll('.yrf-card')) : [];
          results[pageNum] = cards.map(function (c) { return document.importNode(c, true); });
        })
        .catch(function () { results[pageNum] = []; });
    }

    function pump() {
      return new Promise(function (resolve) {
        function next() {
          if (nextIdx >= pageNums.length) return;
          var pageNum = pageNums[nextIdx++];
          fetchPage(pageNum).then(function () {
            done++;
            if (footer) footer.textContent = 'Loading all products… (' + done + '/' + pageNums.length + ')';
            if (done >= pageNums.length) resolve();
            else next();
          });
        }
        for (var i = 0; i < Math.min(CONCURRENCY, pageNums.length); i++) next();
      });
    }

    pump().then(function () {
      // Append in page order to preserve the collection's manual sort
      pageNums.forEach(function (pageNum) {
        (results[pageNum] || []).forEach(function (card) {
          grid.appendChild(card);
          allCards.push(card);
        });
      });
      buildSubchips();
      buildFibreOptions();
      syncSubchips();
      apply();
      initFavBtns();
    });
  }

  // ── Initial render, then pull the rest of the catalogue ──
  apply();
  initFavBtns();
  loadAllPages();

})();
