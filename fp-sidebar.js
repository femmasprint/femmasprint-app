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

/* FEMMAS PRINT — sidebar v11.
 * Desktop sidebar is permanently expanded. The legacy fp-rail auto-collapse mode is
 * disabled and its saved preference is reset, while the native mobile drawer remains.
 * Never moves/removes React-owned app nodes. */
(function () {
  try {
    var css = document.createElement('style');
    css.id = 'fpSidebarV11';
    css.textContent =
      ' .fp-sec{opacity:.62;font-size:11px !important;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding-top:9px !important;pointer-events:none;cursor:default;display:block !important}' +
      ' aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
      ' aside > nav ~ * > div > div:nth-of-type(2){display:none !important}' +
      ' #fpRailBtn{display:none !important}';
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

    function disableLegacyRail() {
      try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
      if (document.body && document.body.classList.contains('fp-rail')) {
        document.body.classList.remove('fp-rail');
      }
      var railBtn = document.getElementById('fpRailBtn');
      if (railBtn && railBtn.parentNode) railBtn.parentNode.removeChild(railBtn);
    }

    function removeLegacyBurger() {
      var b = document.querySelectorAll('.fp-burger, .fp-nav-backdrop');
      for (var i = 0; i < b.length; i++) {
        if (b[i] && b[i].parentNode) b[i].parentNode.removeChild(b[i]);
      }
    }

    function enhance() {
      disableLegacyRail();
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
          var s = document.createElement('span');
          s.className = 'fp-fallicon';
          s.innerHTML = FALL;
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

    function boot() {
      disableLegacyRail();
      enhance();

      if (window.MutationObserver && document.body) {
        var observer = new MutationObserver(function (mutations) {
          for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'class') {
              disableLegacyRail();
              break;
            }
          }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }

      setInterval(enhance, 2000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();

/* FEMMAS PRINT — Quick Sale payment-mode dropdown fix.
 * The sales/expenses tables use horizontal scrolling, which clips an absolutely
 * positioned payment menu near the bottom rows. Move the open menu to the viewport
 * layer and automatically open it above the field when there is not enough room below. */
(function () {
  try {
    var MODES = ['Cash', 'Bank', 'Voda', 'Yas', 'Simu'];
    var pending = false;

    function text(el) {
      return String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    }

    function isModeButton(el) {
      if (!el || el.tagName !== 'DIV') return false;
      var t = text(el);
      return MODES.indexOf(t) !== -1 && !!el.querySelector('svg');
    }

    function findMenu(cell) {
      var marked = cell.querySelector('[data-fp-qs-paymenu="1"]');
      if (marked) return marked;
      var divs = cell.querySelectorAll('div');
      for (var i = 0; i < divs.length; i++) {
        var d = divs[i];
        var s = d.getAttribute('style') || '';
        var t = text(d);
        if (s.indexOf('position:absolute') !== -1 && t.indexOf('Cash') !== -1 && t.indexOf('Bank') !== -1 && t.indexOf('Voda') !== -1) {
          d.setAttribute('data-fp-qs-paymenu', '1');
          return d;
        }
      }
      return null;
    }

    function findButton(cell, menu) {
      var divs = cell.querySelectorAll('div');
      for (var i = 0; i < divs.length; i++) {
        var d = divs[i];
        if (d === menu || (menu && menu.contains(d))) continue;
        if (isModeButton(d)) return d;
      }
      return null;
    }

    function place(cell) {
      var menu = findMenu(cell);
      if (!menu || !menu.getClientRects || menu.getClientRects().length === 0) return;
      var btn = findButton(cell, menu);
      if (!btn || !btn.getBoundingClientRect) return;

      var r = btn.getBoundingClientRect();
      var menuHeight = menu.offsetHeight || 190;
      var width = Math.max(104, Math.round(r.width));
      var vw = window.innerWidth || document.documentElement.clientWidth || 1200;
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      var left = Math.round(r.left);
      if (left + width > vw - 8) left = Math.max(8, vw - width - 8);

      var below = vh - r.bottom;
      var openDown = below >= menuHeight + 10;
      var top = openDown ? Math.round(r.bottom + 4) : Math.round(r.top - menuHeight - 4);
      if (top < 8) top = 8;
      if (top + menuHeight > vh - 8) top = Math.max(8, vh - menuHeight - 8);

      menu.style.setProperty('position', 'fixed', 'important');
      menu.style.setProperty('left', left + 'px', 'important');
      menu.style.setProperty('right', 'auto', 'important');
      menu.style.setProperty('top', top + 'px', 'important');
      menu.style.setProperty('bottom', 'auto', 'important');
      menu.style.setProperty('margin-top', '0', 'important');
      menu.style.setProperty('margin-bottom', '0', 'important');
      menu.style.setProperty('width', width + 'px', 'important');
      menu.style.setProperty('z-index', '2147482500', 'important');
      menu.style.setProperty('max-height', Math.max(120, vh - 16) + 'px', 'important');
      menu.style.setProperty('overflow-y', 'auto', 'important');
    }

    function repair() {
      pending = false;
      var root = document.querySelector('[data-screen-label="Quick Sale"]');
      if (!root) return;
      var rows = root.querySelectorAll('table tbody tr');
      for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].children;
        if (!cells || cells.length < 7) continue;
        place(cells[6]);
      }
    }

    function schedule() {
      if (pending) return;
      pending = true;
      var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
      raf(repair);
    }

    function boot() {
      document.addEventListener('click', function (e) {
        var t = e && e.target;
        if (!t || !t.closest || !t.closest('[data-screen-label="Quick Sale"]')) return;
        setTimeout(schedule, 0);
        setTimeout(schedule, 40);
      }, true);

      window.addEventListener('resize', schedule);
      window.addEventListener('scroll', schedule, true);

      if (window.MutationObserver && document.body) {
        var observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
      }

      schedule();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
