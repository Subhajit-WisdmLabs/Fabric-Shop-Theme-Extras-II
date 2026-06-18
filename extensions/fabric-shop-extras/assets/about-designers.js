(function () {
  document.querySelectorAll('[data-adp-block]').forEach(function (wrap) {
    var raw = wrap.dataset.adpSlugs || '';
    var slugs = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!slugs.length) return;

    var proxyBase = wrap.dataset.proxyBase || '/apps/fabric-shop/api';
    var profileBase = wrap.dataset.profileBase || '/pages/partners';

    fetch(proxyBase + '/about-designers?slugs=' + slugs.join(','))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.cards || !Array.isArray(data.cards)) return;

        var cardMap = {};
        data.cards.forEach(function (card) { cardMap[card.slug] = card; });

        wrap.querySelectorAll('[data-adp-slug]').forEach(function (tile) {
          var slug = tile.dataset.adpSlug;
          var card = cardMap[slug];

          var art = tile.querySelector('.adp-tile-art');
          var cap = tile.querySelector('.adp-tile-cap');

          if (!card) {
            if (art) {
              art.classList.remove('adp-tile-art--skel');
              art.classList.add('adp-tile-art--placeholder');
            }
            if (cap) cap.remove();
            return;
          }

          // Fill design image
          if (art) {
            art.classList.remove('adp-tile-art--skel');
            if (card.imageUrl) {
              var img = document.createElement('img');
              img.className = 'adp-tile-img';
              img.src = card.imageUrl;
              img.alt = card.studioName;
              img.loading = 'lazy';
              art.appendChild(img);
            } else {
              art.classList.add('adp-tile-art--placeholder');
            }
          }

          // Remove caption — hover bar replaces it
          if (cap) cap.remove();

          // Hover bar — slides up from bottom of tile on hover
          var hoverBar = document.createElement('div');
          hoverBar.className = 'adp-hover-bar';
          var hoverLabel = document.createElement('span');
          hoverLabel.className = 'adp-hover-bar-label';
          hoverLabel.textContent = card.studioName + ' →';
          hoverBar.appendChild(hoverLabel);
          tile.appendChild(hoverBar);

          // Overlay link to studio profile
          var a = document.createElement('a');
          a.className = 'adp-tile-link';
          a.href = profileBase + '?handle=' + encodeURIComponent(card.slug);
          a.setAttribute('aria-label', 'Browse ' + card.studioName);
          tile.appendChild(a);
        });
      })
      .catch(function (err) {
        console.error('[about-designers]', err);
        wrap.querySelectorAll('.adp-tile-art--skel').forEach(function (art) {
          art.classList.remove('adp-tile-art--skel');
          art.classList.add('adp-tile-art--placeholder');
        });
        wrap.querySelectorAll('.adp-tile-cap--skel').forEach(function (cap) {
          cap.remove();
        });
      });
  });
})();
