/* FEMMAS PRINT — one-time Quick Sale Nauli cleanup.
 * Keeps only the full staff names and removes the old short aliases from browser cache.
 */
(function () {
  try {
    var legacy = { stive:1, kwedy:1, sedekia:1, imma:1, hasan:1, ismo:1, suma:1, fadhil:1, shaibu:1 };
    var canonical = [
      { name: 'Ismail Issa', price: '7000' },
      { name: 'Hassan Mwesiumo', price: '7000' },
      { name: 'Ismar Salim Hussein (Suma)', price: '7000' },
      { name: 'Steven Mkope', price: '5000' },
      { name: 'Fadhili Ally', price: '7000' },
      { name: 'Emanuel W. Sese (Ima)', price: '7000' },
      { name: 'Sedekia Johnson Laurent', price: '7000' },
      { name: 'Henry Charles Kwedi', price: '7000' },
      { name: 'Shaibu Frank Malekela', price: '7000' }
    ];

    function isLegacyNauli(r) {
      if (!r) return false;
      var nm = String(r.client || r.name || '').trim().toLowerCase();
      var rs = String(r.goods || r.reason || '').trim().toLowerCase();
      return !!(legacy[nm] && rs.indexOf('nauli') > -1);
    }

    function cleanRows(rows) {
      if (!Array.isArray(rows)) return { rows: rows, changed: false };
      var out = rows.filter(function (r) { return !isLegacyNauli(r); });
      return { rows: out, changed: out.length !== rows.length };
    }

    var changed = false;

    try {
      var tplRaw = localStorage.getItem('fp_daily_exp_tpl');
      var tpl = tplRaw ? JSON.parse(tplRaw) : [];
      var filtered = Array.isArray(tpl) ? tpl.filter(function (x) {
        var k = String((x && x.name) || '').trim().toLowerCase();
        return !legacy[k];
      }) : [];
      var needCanonical = filtered.length !== canonical.length || canonical.some(function (x) {
        return !filtered.some(function (y) { return String(y && y.name || '').trim().toLowerCase() === x.name.toLowerCase(); });
      });
      if (needCanonical || (Array.isArray(tpl) && filtered.length !== tpl.length)) {
        localStorage.setItem('fp_daily_exp_tpl', JSON.stringify(canonical));
        changed = true;
      }
    } catch (e) {
      try { localStorage.setItem('fp_daily_exp_tpl', JSON.stringify(canonical)); changed = true; } catch (e2) {}
    }

    function cleanCacheKey(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return;
        var c = JSON.parse(raw);
        if (!c || typeof c !== 'object') return;
        var localChanged = false;
        if (Array.isArray(c.qsExpenses)) {
          var a = cleanRows(c.qsExpenses);
          if (a.changed) { c.qsExpenses = a.rows; localChanged = true; }
        }
        if (c.qsStore && typeof c.qsStore === 'object') {
          Object.keys(c.qsStore).forEach(function (d) {
            var day = c.qsStore[d];
            if (day && Array.isArray(day.expenses)) {
              var b = cleanRows(day.expenses);
              if (b.changed) { day.expenses = b.rows; localChanged = true; }
            }
          });
        }
        if (localChanged) {
          localStorage.setItem(key, JSON.stringify(c));
          changed = true;
        }
      } catch (e) {}
    }

    cleanCacheKey('fp_local_cache');
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i) || '';
        if (key.indexOf('fp_local_cache_') === 0) cleanCacheKey(key);
      }
    } catch (e) {}

    if (changed) {
      try {
        if (sessionStorage.getItem('fp_nauli_cleanup_reload') !== '1') {
          sessionStorage.setItem('fp_nauli_cleanup_reload', '1');
          setTimeout(function () { location.reload(); }, 50);
        }
      } catch (e) {}
    } else {
      try { sessionStorage.removeItem('fp_nauli_cleanup_reload'); } catch (e) {}
    }
  } catch (e) {}
})();

/* FEMMAS PRINT — sidebar v10 (safe minimal, no duplicate hamburger).
 *
 * Never moves/removes an app node (that crashes React). It adds: tooltips, a fallback
 * icon where the app left none, clear section headings, and full-width rows.
 *
 * NOTE (v10): the app's OWN header menu button already opens the sidebar as a drawer
 * (body.fp-drawer). Earlier versions ALSO added a separate floating hamburger, which
 * overlapped the native one and looked like two burgers. That floating button is now
 * removed — we rely on the app's native menu button only. */
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

    // v10: clean up any floating hamburger/backdrop that an older cached sidebar may
    // have added, so a stale version never leaves a duplicate burger behind.
    function removeLegacyBurger() {
      var b = document.querySelectorAll('.fp-burger, .fp-nav-backdrop');
      for (var i = 0; i < b.length; i++) { if (b[i] && b[i].parentNode) b[i].parentNode.removeChild(b[i]); }
    }

    function enhance() {
      removeLegacyBurger();
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
