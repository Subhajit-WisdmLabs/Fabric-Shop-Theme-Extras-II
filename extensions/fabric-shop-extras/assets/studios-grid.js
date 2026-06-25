(function () {
  'use strict';

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var VARIANTS = 8;
  var MAX_DESC = 200;

  function bannerVariant(idx)  { return 'sgb-banner-'   + ((idx % VARIANTS) + 1); }
  function portraitVariant(idx){ return 'sgb-portrait-' + ((idx % VARIANTS) + 1); }
  function tileVariant(idx)    { return 'v'             + ((idx % VARIANTS) + 1); }

  function renderCard(studio, idx, profileUrl) {
    var v = tileVariant(idx);

    var portraitInner = studio.profileImageUrl
      ? '<img src="' + esc(studio.profileImageUrl) + '" alt="' + esc(studio.studioName) + '" loading="lazy" width="56" height="56">'
      : '';
    var portraitEl = '<div class="sgb-portrait ' + portraitVariant(idx) + '">' + portraitInner + '</div>';

    var sep  = profileUrl.indexOf('?') >= 0 ? '&' : '?';
    var href = profileUrl + sep + 'handle=' + encodeURIComponent(studio.slug || '');

    var bannerEl;
    if (studio.bannerImageUrl) {
      bannerEl =
        '<div class="sgb-banner">' +
          '<a class="sgb-banner-link" href="' + esc(href) + '" tabindex="-1" aria-hidden="true"></a>' +
          '<img src="' + esc(studio.bannerImageUrl) + '" alt="" loading="lazy">' +
          portraitEl +
        '</div>';
    } else {
      bannerEl =
        '<div class="sgb-banner ' + bannerVariant(idx) + '">' +
          '<a class="sgb-banner-link" href="' + esc(href) + '" tabindex="-1" aria-hidden="true"></a>' +
          portraitEl +
        '</div>';
    }

    var locationParts = [];
    if (studio.city)    locationParts.push(studio.city);
    if (studio.country) locationParts.push(studio.country);
    var locationStr = locationParts.map(esc).join(' &middot; ');
    var byline = 'by ' + esc(studio.fullName) + (locationStr ? ' &middot; ' + locationStr : '');

    var meta = [];
    if (studio.designCount    > 0) meta.push(studio.designCount    + ' design'     + (studio.designCount    === 1 ? '' : 's'));
    if (studio.collectionCount > 0) meta.push(studio.collectionCount + ' collection' + (studio.collectionCount === 1 ? '' : 's'));

    var tiles = [0, 1, 2].map(function (t) {
      var imgUrl = studio.recentDesigns && studio.recentDesigns[t];
      if (imgUrl) {
        var src = imgUrl + (imgUrl.indexOf('?') >= 0 ? '&' : '?') + 'width=400';
        return '<div class="sgb-tile sgb-tile-img"><img src="' + esc(src) + '" alt="" loading="lazy"></div>';
      }
      return '<div class="sgb-tile sgb-tile-' + v + '-' + t + '"></div>';
    }).join('');

    return (
      '<article class="sgb-card">' +
        bannerEl +
        '<div class="sgb-body">' +
          '<a class="sgb-name-link" href="' + esc(href) + '">' +
            '<h3 class="sgb-name">' + esc(studio.studioName) + '</h3>' +
          '</a>' +
          '<div class="sgb-location">' + byline + '</div>' +
          (function () {
            var bio = studio.bio || '';
            if (!bio) return '';
            if (bio.length <= MAX_DESC) {
              return '<p class="sgb-desc">' + esc(bio) + '</p>';
            }
            return (
              '<p class="sgb-desc" data-bio-full="' + esc(bio) + '" data-bio-short="' + esc(bio.slice(0, MAX_DESC)) + '">' +
                esc(bio.slice(0, MAX_DESC)) + '&hellip;&nbsp;' +
                '<button type="button" class="sgb-see-more">See more</button>' +
              '</p>'
            );
          }()) +
          '<div class="sgb-strip">' + tiles + '</div>' +
          '<div class="sgb-foot">' +
            '<span class="sgb-meta">' + esc(meta.join(' · ')) + '</span>' +
            '<a class="sgb-link" href="' + esc(href) + '">Visit studio</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function initBlock(root) {
    var blockId    = root.getAttribute('data-sgb-block');
    var proxyBase  = root.getAttribute('data-proxy-base') || '/apps/fabric-shop/api';
    var profileUrl = root.getAttribute('data-profile-url') || '/pages/partners';
    var perPage    = parseInt(root.getAttribute('data-per-page') || '3', 10);

    var modCountEl      = document.getElementById('sgb-mod-count-'    + blockId);
    var filterCountEl   = document.getElementById('sgb-filter-count-' + blockId);
    var pillsEl         = document.getElementById('sgb-pills-'        + blockId);
    var gridEl      = document.getElementById('sgb-grid-'         + blockId);
    var paginationEl = document.getElementById('sgb-pagination-'  + blockId);
    var prevBtn     = document.getElementById('sgb-pag-prev-'     + blockId);
    var nextBtn     = document.getElementById('sgb-pag-next-'     + blockId);
    var pageInfoEl  = document.getElementById('sgb-pag-info-'     + blockId);

    // Page cache: keyed by "discipline|sort|page" — avoids re-fetching already-seen pages
    var pageCache = {};

    var state = {
      discipline:     '',
      sort:           'recent_active',
      page:           1,
      total:          0,
      totalPages:     0,
      loading:        false,
      pillsPopulated: false,
    };

    function cacheKey(d, s, p) { return d + '|' + s + '|' + p; }

    function buildUrl(page) {
      var u = proxyBase + '/studios?per_page=' + perPage + '&page=' + page + '&sort=' + encodeURIComponent(state.sort);
      if (state.discipline) u += '&discipline=' + encodeURIComponent(state.discipline);
      return u;
    }

    function setLoading(on) {
      state.loading = on;
      if (prevBtn) prevBtn.disabled = on || state.page <= 1;
      if (nextBtn) nextBtn.disabled = on || state.page >= state.totalPages;
    }

    var MAX_PILLS = 4;

    function populatePills(disciplines) {
      if (!pillsEl || state.pillsPopulated) return;
      state.pillsPopulated = true;

      pillsEl.innerHTML = '<button type="button" class="sgb-pill active" data-discipline="">All</button>';
      disciplines.forEach(function (d, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = i >= MAX_PILLS ? 'sgb-pill sgb-pill--overflow' : 'sgb-pill';
        btn.setAttribute('data-discipline', d);
        btn.textContent = d;
        btn.title = d;
        pillsEl.appendChild(btn);
      });

      if (disciplines.length > MAX_PILLS) {
        var extra = disciplines.length - MAX_PILLS;
        var moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'sgb-pill sgb-pill-toggle';
        moreBtn.textContent = '+' + extra + ' more';
        moreBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var expanded = pillsEl.classList.toggle('sgb-pills--expanded');
          moreBtn.textContent = expanded ? 'Show less' : '+' + extra + ' more';
        });
        pillsEl.appendChild(moreBtn);
      }
    }

    function syncActivePill() {
      if (!pillsEl) return;
      pillsEl.querySelectorAll('.sgb-pill').forEach(function (btn) {
        btn.classList.toggle('active', (btn.getAttribute('data-discipline') || '') === state.discipline);
      });
    }

    function applyData(data, page) {
      state.page       = page;
      state.total      = data.total || 0;
      state.totalPages = Math.ceil(state.total / perPage);

      if (page === 1 && data.disciplines) populatePills(data.disciplines);

      if (page === 1 && modCountEl) {
        var ct = state.total + ' Studio' + (state.total === 1 ? '' : 's');
        modCountEl.textContent = state.discipline ? ct : ct + ' · Updated weekly';
      }
      if (page === 1 && filterCountEl) {
        filterCountEl.textContent = state.total + ' Studio' + (state.total === 1 ? '' : 's');
      }

      var studios = data.studios || [];
      if (studios.length === 0) {
        gridEl.innerHTML = '<p class="sgb-empty">No studios match this discipline — try a different filter.</p>';
      } else {
        var offset = (page - 1) * perPage;
        gridEl.innerHTML = studios.map(function (s, i) {
          return renderCard(s, offset + i, profileUrl);
        }).join('');
      }

      if (paginationEl) {
        paginationEl.hidden = state.totalPages <= 1;
        if (state.totalPages > 1) {
          if (pageInfoEl) {
            var from = (page - 1) * perPage + 1;
            var to   = Math.min(page * perPage, state.total);
            pageInfoEl.textContent = from + '–' + to + ' of ' + state.total;
          }
          if (prevBtn) prevBtn.disabled = page <= 1;
          if (nextBtn) nextBtn.disabled = page >= state.totalPages;
        }
      }
    }

    // Silent background pre-fetch — stores result in cache without touching the UI
    function prefetch(page) {
      if (page < 1) return;
      if (state.totalPages > 0 && page > state.totalPages) return;
      var key = cacheKey(state.discipline, state.sort, page);
      if (pageCache[key]) return;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', buildUrl(page));
      xhr.onload = function () {
        if (xhr.status !== 200) return;
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { return; }
        pageCache[key] = data;
      };
      xhr.send();
    }

    function fetchPage(page) {
      if (state.loading) return;
      var key = cacheKey(state.discipline, state.sort, page);

      if (pageCache[key]) {
        applyData(pageCache[key], page);
        prefetch(page + 1);
        prefetch(page - 1);
        return;
      }

      setLoading(true);
      var xhr = new XMLHttpRequest();
      xhr.open('GET', buildUrl(page));
      xhr.onload = function () {
        setLoading(false);
        if (xhr.status !== 200) return;
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { return; }
        pageCache[key] = data;
        applyData(data, page);
        prefetch(page + 1);
        prefetch(page - 1);
      };
      xhr.onerror = function () { setLoading(false); };
      xhr.send();
    }

    if (pillsEl) {
      pillsEl.addEventListener('click', function (e) {
        var target = e.target.closest('.sgb-pill');
        if (!target) return;
        state.discipline = target.getAttribute('data-discipline') || '';
        syncActivePill();
        fetchPage(1);
      });
    }

    if (gridEl) {
      gridEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.sgb-see-more, .sgb-see-less');
        if (!btn) return;
        var p = btn.closest('.sgb-desc');
        if (!p) return;
        var expanded = p.classList.toggle('sgb-desc--expanded');
        var full  = p.getAttribute('data-bio-full');
        var short = p.getAttribute('data-bio-short');
        if (expanded) {
          p.innerHTML = esc(full) + '&nbsp;<button type="button" class="sgb-see-less">See less</button>';
        } else {
          p.innerHTML = esc(short) + '&hellip;&nbsp;<button type="button" class="sgb-see-more">See more</button>';
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (state.page > 1) fetchPage(state.page - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (state.page < state.totalPages) fetchPage(state.page + 1);
      });
    }

    fetchPage(1);
  }

  document.querySelectorAll('[data-sgb-block]').forEach(function (root) {
    initBlock(root);
  });

}());
