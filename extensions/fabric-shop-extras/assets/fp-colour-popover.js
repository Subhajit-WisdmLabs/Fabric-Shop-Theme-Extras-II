/**
 * Shared colour-options popover for product-card sections (part-of-collection,
 * more-by-studio, …). Appended to <body> and fixed-positioned under the toggle,
 * sized to the card so it floats over content without reflowing the grid and
 * fits within narrow mobile cards. Swatches deep-link to the PDP with the
 * colour preselected (?colour=<value>, honoured by product-options.js).
 *
 * Usage:
 *   window.FPColourPopover.open(handle, colours, toggleEl, cardEl)
 *     colours: [{ name, value, image }]
 */
(function () {
  if (window.FPColourPopover) return;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function close() {
    var pop = document.querySelector('.fp-colours-pop');
    if (pop) {
      if (typeof pop.cleanup === 'function') pop.cleanup();
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    }
  }

  function open(handle, colours, toggleEl, cardEl) {
    var existing = document.querySelector('.fp-colours-pop');
    var wasForThis = existing && existing.owner === toggleEl;
    close();
    if (wasForThis) return;

    var swatchesHtml = (colours || []).map(function (c) {
      return '<a class="fp-colour-swatch" href="/products/' + esc(handle) +
        '?colour=' + encodeURIComponent(c.value) + '"' +
        ' title="' + esc(c.name || '') + '"' +
        (c.image ? ' style="background-image:url(\'' + esc(c.image) + '\')"' : '') + '></a>';
    }).join('');

    var pop = document.createElement('div');
    pop.className = 'fp-colours-pop';
    pop.innerHTML = '<div class="fp-colours-pop-grid">' + swatchesHtml + '</div>';
    pop.owner = toggleEl;
    document.body.appendChild(pop);
    if (toggleEl) toggleEl.classList.add('is-open');

    var r = toggleEl.getBoundingClientRect();
    var rect = cardEl ? cardEl.getBoundingClientRect() : r;
    var margin = 8;
    var width = Math.min(280, rect.width);
    pop.style.width = width + 'px';
    var left = rect.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    if (left < margin) left = margin;
    var top = r.bottom + 6;
    var maxH = window.innerHeight - top - margin;
    if (maxH < pop.offsetHeight) pop.style.maxHeight = Math.max(140, maxH) + 'px';
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';

    function onDocDown(e) {
      if (!pop.contains(e.target) && !(toggleEl && toggleEl.contains(e.target))) close();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    pop.cleanup = function () {
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      if (toggleEl) toggleEl.classList.remove('is-open');
    };
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
  }

  window.FPColourPopover = { open: open, close: close };
})();
