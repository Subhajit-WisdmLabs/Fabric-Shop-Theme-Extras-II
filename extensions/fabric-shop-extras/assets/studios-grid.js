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

  function bannerVariant(idx) {
    return 'sgb-banner-' + ((idx % VARIANTS) + 1);
  }

  function portraitVariant(idx) {
    return 'sgb-portrait-' + ((idx % VARIANTS) + 1);
  }

  function tileVariant(idx) {
    return 'v' + ((idx % VARIANTS) + 1);
  }

  function renderCard(studio, idx, profileUrl) {
    var v = tileVariant(idx);

    var portraitInner = studio.profileImageUrl
      ? '<img src="' + esc(studio.profileImageUrl) + '" alt="' + esc(studio.studioName) + '" loading="lazy" width="56" height="56">'
      : '';
    var portraitEl = '<div class="sgb-portrait ' + portraitVariant(idx) + '">' + portraitInner + '</div>';

    var bannerEl = studio.bannerImageUrl
      ? '<div class="sgb-banner"><img src="' + esc(studio.bannerImageUrl) + '" alt="" loading="lazy">' + portraitEl + '</div>'
      : '<div class="sgb-banner ' + bannerVariant(idx) + '">' + portraitEl + '</div>';

    var sep = profileUrl.indexOf('?') >= 0 ? '&' : '?';
    var href = profileUrl + sep + 'handle=' + encodeURIComponent(studio.slug || '');

    var locationParts = [];
    if (studio.city) locationParts.push(studio.city);
    if (studio.country) locationParts.push(studio.country);
    var locationStr = locationParts.map(esc).join(' &middot; ');
    var byline = 'by ' + esc(studio.fullName) + (locationStr ? ' &middot; ' + locationStr : '');

    var meta = [];
    if (studio.designCount > 0) meta.push(studio.designCount + ' design' + (studio.designCount === 1 ? '' : 's'));
    if (studio.collectionCount > 0) meta.push(studio.collectionCount + ' collection' + (studio.collectionCount === 1 ? '' : 's'));

    var tiles = [0, 1, 2].map(function (t) {
      return '<div class="sgb-tile sgb-tile-' + v + '-' + t + '"></div>';
    }).join('');

    return (
      '<a class="sgb-card" href="' + esc(href) + '">' +
        bannerEl +
        '<div class="sgb-body">' +
          '<h3 class="sgb-name">' + esc(studio.studioName) + '</h3>' +
          '<div class="sgb-location">' + byline + '</div>' +
          '<p class="sgb-discipline">' + esc(studio.specialties) + '</p>' +
          '<div class="sgb-strip">' + tiles + '</div>' +
          '<div class="sgb-foot">' +
            '<span class="sgb-meta">' + esc(meta.join(' · ')) + '</span>' +
            '<span class="sgb-link">Visit studio</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function initBlock(root) {
    var blockId   = root.getAttribute('data-sgb-block');
    var proxyBase = root.getAttribute('data-proxy-base') || '/apps/fabric-shop/api';
    var profileUrl = root.getAttribute('data-profile-url') || '/pages/partners';
    var perPage   = parseInt(root.getAttribute('data-per-page') || '9', 10);

    var modCountEl   = document.getElementById('sgb-mod-count-' + blockId);
    var pillsEl      = document.getElementById('sgb-pills-' + blockId);
    var gridEl       = document.getElementById('sgb-grid-' + blockId);
    var loadMoreWrap = document.getElementById('sgb-load-more-' + blockId);
    var loadBtn      = document.getElementById('sgb-load-btn-' + blockId);
    var loadCountEl  = document.getElementById('sgb-load-count-' + blockId);

    var state = {
      discipline:      '',
      sort:            'recent_active',
      page:            1,
      total:           0,
      hasMore:         false,
      renderedCount:   0,
      loading:         false,
      pillsPopulated:  false,
    };

    function buildUrl(page) {
      var u = proxyBase + '/studios?per_page=' + perPage + '&page=' + page + '&sort=' + encodeURIComponent(state.sort);
      if (state.discipline) u += '&discipline=' + encodeURIComponent(state.discipline);
      return u;
    }

    function setLoading(on) {
      state.loading = on;
      if (loadBtn) loadBtn.disabled = on;
    }

    function populatePills(disciplines) {
      if (!pillsEl || state.pillsPopulated) return;
      state.pillsPopulated = true;

      pillsEl.innerHTML = '<button type="button" class="sgb-pill active" data-discipline="">All</button>';
      disciplines.forEach(function (d) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sgb-pill';
        btn.setAttribute('data-discipline', d);
        var label = d.length > 24 ? d.slice(0, 22) + '…' : d;
        btn.textContent = label;
        btn.title = d;
        pillsEl.appendChild(btn);
      });
    }

    function syncActivePill() {
      if (!pillsEl) return;
      pillsEl.querySelectorAll('.sgb-pill').forEach(function (btn) {
        btn.classList.toggle('active', (btn.getAttribute('data-discipline') || '') === state.discipline);
      });
    }

    function fetch(page, append) {
      if (state.loading) return;
      setLoading(true);

      var xhr = new XMLHttpRequest();
      xhr.open('GET', buildUrl(page));
      xhr.onload = function () {
        setLoading(false);
        if (xhr.status !== 200) return;
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { return; }

        if (page === 1 && !append && data.disciplines) {
          populatePills(data.disciplines);
        }

        state.page    = page;
        state.total   = data.total || 0;
        state.hasMore = !!data.hasMore;

        if (page === 1 && !append && modCountEl) {
          var ct = state.total + ' Studio' + (state.total === 1 ? '' : 's');
          modCountEl.textContent = state.discipline ? ct : ct + ' · Updated weekly';
        }

        var studios = data.studios || [];

        if (!append) {
          state.renderedCount = 0;
          if (studios.length === 0) {
            gridEl.innerHTML = '<p class="sgb-empty">No studios match this discipline — try a different filter.</p>';
          } else {
            gridEl.innerHTML = studios.map(function (s, i) {
              return renderCard(s, i, profileUrl);
            }).join('');
            state.renderedCount = studios.length;
          }
        } else {
          var offset = state.renderedCount;
          gridEl.insertAdjacentHTML('beforeend', studios.map(function (s, i) {
            return renderCard(s, offset + i, profileUrl);
          }).join(''));
          state.renderedCount += studios.length;
        }

        if (loadMoreWrap) {
          loadMoreWrap.hidden = !state.hasMore;
          if (state.hasMore && loadCountEl) {
            loadCountEl.textContent = 'Showing ' + state.renderedCount + ' of ' + state.total;
          }
        }
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
        fetch(1, false);
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', function () {
        fetch(state.page + 1, true);
      });
    }

    fetch(1, false);
  }

  document.querySelectorAll('[data-sgb-block]').forEach(function (root) {
    initBlock(root);
  });

})();
