/* FEMMAS PRINT — sidebar v9 (safe minimal + hamburger mobile drawer toggle).
 *
 * Never moves/removes an app node (that crashes React). It adds: tooltips, a fallback
 * icon where the app left none, clear section headings, full-width rows, a compact Arifa
 * card, and — for phones/tablets — a hamburger button that opens the sidebar as a
 * drawer, plus a click on the app's own fp logo (inside the drawer) to close it. The
 * responsive CSS lives in the edge <head> injection; this only adds the button/backdrop
 * and toggles a body class. */
(function () {
  try {
    var css = document.createElement('style');
    css.textContent =
      ' .fp-sec{opacity:.62;font-size:11px !important;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding-top:9px !important;pointer-events:none;cursor:default;display:block !important}' +
      ' aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
      ' aside > nav ~ * > div > div:nth-of-type(2){display:none !important}';
    document.head.appendChild(css);

    var FALL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6" fill="#8aa0c0" stroke="none"/></svg>';
    var BURGER = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>';

    function looksLikeHeading(el) {
      if (!el || el.nodeType !== 1) return false;
      var tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT') return false;
      if (el.querySelector && el.querySelector('a,button,input,textarea,select,svg,img')) return false;
      var tx = (el.textContent || '').trim();
      return tx.length >= 2 && tx.length <= 26;
    }

    function toggleNav(e) { if (e) { e.preventDefault(); e.stopPropagation(); } document.body.classList.toggle('fp-nav-open'); }

    // Mobile drawer: our own hamburger button opens it; the app's own fp logo (inside
    // the drawer) closes it; a backdrop and any nav-link tap also close it. All additive.
    function addMobileNav(aside) {
      if (!document.querySelector('.fp-burger')) {
        var b = document.createElement('button');
        b.className = 'fp-burger'; b.setAttribute('aria-label', 'Menu'); b.type = 'button';
        b.innerHTML = BURGER;
        var bd = document.createElement('div'); bd.className = 'fp-nav-backdrop';
        b.addEventListener('click', toggleNav);
        bd.addEventListener('click', function () { document.body.classList.remove('fp-nav-open'); });
        document.addEventListener('click', function (e) {
          var a = e.target && e.target.closest && e.target.closest('aside nav a');
          if (a) document.body.classList.remove('fp-nav-open');
        });
        document.body.appendChild(bd);
        document.body.appendChild(b);
      }
      // make the app's own fp logo close the drawer when tapped (no node moved)
      var img = aside.querySelector('img');
      var logo = img ? (img.parentElement) : null;
      if (logo && !logo.__fpTog) {
        logo.__fpTog = 1; logo.style.cursor = 'pointer';
        logo.addEventListener('click', function () { document.body.classList.remove('fp-nav-open'); });
      }
    }

    function enhance() {
      var aside = document.querySelector('aside');
      if (!aside) return;
      addMobileNav(aside);
      var items = aside.querySelectorAll('nav a, nav button');
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (!el.getAttribute('title')) {
          var label = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (label) el.setAttribute('title', label.slice(0, 48));
        }
        if (!el.querySelector('svg') && !el.querySelector('img') && !el.querySelector('.fp-fallicon')) {
          var s = document.createElement('span'); s.className = 'fp-fallicon'; s.innerHTML = FALL;
          el.insertBefore(s, el.firstChild);
        }
      }
      var nav = aside.querySelector('nav');
      if (nav) {
        var kids = nav.children;
        for (var k = 0; k < kids.length; k++) {
          var el2 = kids[k];
          if (looksLikeHeading(el2)) { el2.classList.add('fp-sec'); continue; }
          if (el2.tagName === 'DIV' && el2.querySelector && el2.querySelector('a,button')) {
            for (var j = 0; j < el2.children.length; j++) {
              if (looksLikeHeading(el2.children[j])) el2.children[j].classList.add('fp-sec');
            }
          }
        }
      }
    }

    function boot() { enhance(); setInterval(enhance, 2000); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
