/* FEMMAS PRINT — sidebar v4.3 (minimal & robust, no restructuring)
 *
 * The app's native sidebar is ALREADY sectioned (Muhtasari · Miamala · Uendeshaji ·
 * Fedha · Usimamizi · Mfumo) with every item under its heading. Earlier versions
 * replaced that with a custom collapsible accordion, which fought the app's very
 * frequent re-renders (the Arifa notification card cycles ~1/s and rebuilds the whole
 * aside). That produced the "cheza cheza" flicker, dangling ungrouped items, and
 * half-hidden section labels that looked like broken menus.
 *
 * Per the owner's choice we now DO NOT touch the menu structure at all: no grouping,
 * no hiding of section headers, no MutationObservers. We (a) give each item a hover
 * tooltip, (b) add a fallback icon where missing, (c) style section headings clearly,
 * (d) force every link to a full-width row (fixes the jumbled Usimamizi section), and
 * (e) shrink the Arifa notification card to a small static line by hiding only its
 * rotating body (which appeared/disappeared every ~1s). All additive and idempotent. */
(function () {
  try {
    var css = document.createElement('style');
    css.textContent =
      /* make the app's section headings read clearly as headings, not buttons */
      ' .fp-sec{opacity:.62;font-size:11px !important;letter-spacing:.06em;text-transform:uppercase;' +
      'font-weight:700;padding-top:9px !important;pointer-events:none;cursor:default;display:block !important}' +
      /* fallback icon shown only for items the app left without an icon */
      ' aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      /* Some sections (e.g. Usimamizi) render their links as display:inline, which makes
         them wrap into a jumbled block. Force EVERY sidebar link to be a full-width row
         so all sections look identical and clean. */
      ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
      /* The Arifa notification card (aside > nav ~ *) has 3 parts: an "Arifa (n)"
         header, a rotating notification BODY that cycled every ~1s (appearing and
         disappearing), and a "Show all" button. Hide ONLY the rotating body so the
         card shrinks to a small, STATIC "Arifa (n) · Show all" line — no more
         flicker, and the menu gets more room. Notifications stay reachable via
         "Show all". */
      ' aside > nav ~ * > div > div:nth-of-type(2){display:none !important}';
    document.head.appendChild(css);

    var FALL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6" fill="#8aa0c0" stroke="none"/></svg>';

    function looksLikeHeading(el) {
      // a nav child that holds no link/input and is just a short text label
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

      // 1) tooltips + fallback icons on the real menu items
      var items = aside.querySelectorAll('nav a, nav button');
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (!el.getAttribute('title')) {
          var label = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (label) el.setAttribute('title', label.slice(0, 48));
        }
        if (!el.querySelector('svg') && !el.querySelector('img') && !el.querySelector('.fp-fallicon')) {
          var s = document.createElement('span');
          s.className = 'fp-fallicon';
          s.innerHTML = FALL;
          el.insertBefore(s, el.firstChild);
        }
      }

      // 2) tag the app's own section headings so they read clearly (purely cosmetic).
      //    Scan direct nav children AND one level into wrapper divs (some sections, e.g.
      //    Usimamizi, are wrapped in an extra container that holds their own heading).
      var nav = aside.querySelector('nav');
      if (nav) {
        var kids = nav.children;
        for (var k = 0; k < kids.length; k++) {
          var el = kids[k];
          if (looksLikeHeading(el)) { el.classList.add('fp-sec'); continue; }
          if (el.tagName === 'DIV' && el.querySelector && el.querySelector('a,button')) {
            for (var j = 0; j < el.children.length; j++) {
              if (looksLikeHeading(el.children[j])) el.children[j].classList.add('fp-sec');
            }
          }
        }
      }
    }

    function boot() {
      enhance();
      /* light idempotent refresh only — no observers, nothing structural. */
      setInterval(enhance, 2000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
