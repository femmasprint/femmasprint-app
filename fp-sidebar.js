/* FEMMAS PRINT — sidebar v6 (safe minimal, no restructuring).
 *
 * IMPORTANT LESSON: an external script must NOT move the app's own menu nodes. The app
 * is React-based; relocating its <a> nodes into custom group containers breaks React's
 * reconciliation ("Failed to execute 'removeChild' on 'Node'") and blanks the whole app.
 * So we do NOT restructure the menu here. A collapsible "accordion" sidebar has to be
 * built INTO the app's own source (native), not patched from outside.
 *
 * What this safe layer does: tooltips, a fallback icon where the app left none, clear
 * section headings, full-width rows (fixes the jumbled Usimamizi section), and shrinks
 * the Arifa notification card to a compact static line. All additive and idempotent —
 * it never moves or removes an app node, so it can't crash the app. */
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

    function looksLikeHeading(el) {
      if (!el || el.nodeType !== 1) return false;
      var tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT') return false;
      if (el.querySelector && el.querySelector('a,button,input,textarea,select,svg,img')) return false;
      var tx = (el.textContent || '').trim();
      return tx.length >= 2 && tx.length <= 26;
    }

    function enhance() {
      var aside = document.querySelector('aside');
      if (!aside) return;
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
