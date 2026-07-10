/* FEMMAS PRINT — sidebar enhancer
 * - fp logo (top) is the collapse/expand toggle (body.fp-rail).
 * - every nav item gets a tooltip (title) so hovering shows its name.
 * - any nav item without an SVG icon gets a fallback icon so ALL icons show when collapsed.
 * Reactive-safe: re-applies on re-render (MutationObserver + interval).
 */
(function () {
  try {
    var css = document.createElement('style');
    css.textContent =
      '#fpRailBtn{display:none !important}' +
      ' body:not(.fp-rail) aside .fp-fallicon{display:none !important}' +
      ' body.fp-rail aside .fp-fallicon{font-size:0 !important;display:flex !important;align-items:center;justify-content:center;width:100% !important}' +
      ' body.fp-rail aside .fp-fallicon svg{width:20px !important;height:20px !important}' +
      ' aside img{cursor:pointer}';
    document.head.appendChild(css);

    var TAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';

    function enhance() {
      var aside = document.querySelector('aside');
      if (!aside) return;
      var items = aside.querySelectorAll('a,button');
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var label = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (label) el.setAttribute('title', label.slice(0, 44));
        if (!el.querySelector('svg') && !el.querySelector('.fp-fallicon')) {
          var s = document.createElement('span');
          s.className = 'fp-fallicon';
          s.innerHTML = TAG;
          el.insertBefore(s, el.firstChild);
        }
      }
      var img = aside.querySelector('img');
      var logo = img ? img.parentElement : null;
      if (logo && !logo.__fpToggle) {
        logo.__fpToggle = 1;
        logo.style.cursor = 'pointer';
        logo.title = 'Bofya kukunja / kufungua menu';
        logo.addEventListener('click', function () {
          var on = !document.body.classList.contains('fp-rail');
          document.body.classList.toggle('fp-rail', on);
          try { localStorage.setItem('fp_rail2', on ? '1' : '0'); } catch (e) {}
        });
      }
    }

    function boot() {
      enhance();
      var a = document.querySelector('aside');
      if (a) {
        try { new MutationObserver(function () { enhance(); }).observe(a, { childList: true, subtree: true }); } catch (e) {}
      }
      setInterval(enhance, 2000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
