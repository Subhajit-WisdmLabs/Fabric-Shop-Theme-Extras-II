/* Rights-confirmation checkbox: gates the Add-to-Cart button until the user
   confirms they have rights to the uploaded design, plus an optional
   "What I'm confirming" disclosure. Self-initialises every .rcb-block on the
   page (no Liquid needed), so the markup can live in a static asset. */
(function () {
  function initBlock(card) {
    var row        = card.querySelector('.rcb-row');
    if (!row) return;
    var disclosure = card.querySelector('.rcb-disclosure');
    var details    = card.querySelector('.rcb-details');
    var checked     = false;
    var designReady = false;

    // Checkbox starts disabled — unlocked only after image is uploaded
    row.classList.add('rcb-disabled');

    function setGate(on) {
      document.body.classList.toggle('rcb--needs-confirm', !!on);
    }

    function applyState() {
      if (checked) {
        row.classList.add('rcb-checked');
        card.classList.add('rcb-confirmed');
        row.setAttribute('aria-checked', 'true');
        if (designReady) setGate(false);
      } else {
        row.classList.remove('rcb-checked');
        card.classList.remove('rcb-confirmed');
        row.setAttribute('aria-checked', 'false');
        if (designReady) setGate(true);
      }
    }

    function toggle() { checked = !checked; applyState(); }

    row.addEventListener('click', toggle);
    row.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });

    // "What I'm confirming" disclosure — expand/collapse, swap label + arrow.
    if (disclosure && details) {
      disclosure.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = details.hasAttribute('hidden');
        if (open) details.removeAttribute('hidden');
        else details.setAttribute('hidden', '');
        disclosure.setAttribute('aria-expanded', open ? 'true' : 'false');
        var txt = disclosure.querySelector('.rcb-disclosure-text');
        if (txt) {
          txt.textContent = open
            ? (txt.getAttribute('data-open') || 'Show less')
            : (txt.getAttribute('data-closed') || '');
        }
      });
    }

    // Hard backstop: block form submit in capture phase if gate is active
    var form = document.querySelector('form[action*="/cart/add"]');
    if (form && !form._rcbGuardAttached) {
      form._rcbGuardAttached = true;
      form.addEventListener('submit', function (e) {
        if (designReady && !checked) {
          e.preventDefault();
          e.stopImmediatePropagation();
          card.style.animation = 'none';
          card.offsetHeight; // reflow
          card.style.animation = 'rcb-shake 0.3s ease';
        }
      }, true);
    }

    // custom-fabric.js fires this when a design image is selected/uploaded
    document.addEventListener('cfu:design-loaded', function () {
      designReady = true;
      row.classList.remove('rcb-disabled');
      if (!checked) setGate(true);
    });

    // Fires when the user removes/resets the design
    document.addEventListener('cfu:design-reset', function () {
      designReady = false;
      checked = false;
      row.classList.add('rcb-disabled');
      row.classList.remove('rcb-checked');
      card.classList.remove('rcb-confirmed');
      row.setAttribute('aria-checked', 'false');
      setGate(false);
    });
  }

  function init() {
    var blocks = document.querySelectorAll('.rcb-block');
    for (var i = 0; i < blocks.length; i++) initBlock(blocks[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
