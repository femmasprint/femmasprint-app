/* FEMMAS PRINT — one-time Quick Sale Nauli cleanup. */
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
      var rawTpl = localStorage.getItem('fp_daily_exp_tpl');
      var tpl = rawTpl ? JSON.parse(rawTpl) : [];
      var filtered = Array.isArray(tpl) ? tpl.filter(function (x) {
        return !legacy[String((x && x.name) || '').trim().toLowerCase()];
      }) : [];
      var needCanonical = filtered.length !== canonical.length || canonical.some(function (x) {
        return !filtered.some(function (y) {
          return String((y && y.name) || '').trim().toLowerCase() === x.name.toLowerCase();
        });
      });
      if (needCanonical || (Array.isArray(tpl) && filtered.length !== tpl.length)) {
        localStorage.setItem('fp_daily_exp_tpl', JSON.stringify(canonical));
        changed = true;
      }
    } catch (e) {
      try { localStorage.setItem('fp_daily_exp_tpl', JSON.stringify(canonical)); changed = true; } catch (e2) {}
    }

    function cleanCache(key) {
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

    cleanCache('fp_local_cache');
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i) || '';
        if (key.indexOf('fp_local_cache_') === 0) cleanCache(key);
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

/* FEMMAS PRINT — desktop sidebar stays expanded. */
(function () {
  try {
    var css = document.createElement('style');
    css.id = 'fpSidebarPermanent';
    css.textContent =
      '.fp-sec{opacity:.62;font-size:11px!important;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding-top:9px!important;pointer-events:none;cursor:default;display:block!important}' +
      'aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      'aside nav a{display:flex!important;align-items:center;width:100%!important;box-sizing:border-box}' +
      'aside>nav~*>div>div:nth-of-type(2){display:none!important}' +
      '#fpRailBtn{display:none!important}';
    document.head.appendChild(css);

    var FALL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6" fill="#8aa0c0" stroke="none"/></svg>';

    function heading(el) {
      if (!el || el.nodeType !== 1) return false;
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'INPUT') return false;
      if (el.querySelector && el.querySelector('a,button,input,textarea,select,svg,img')) return false;
      var tx = (el.textContent || '').trim();
      return tx.length >= 2 && tx.length <= 26;
    }

    function disableRail() {
      try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
      if (document.body) document.body.classList.remove('fp-rail');
      var btn = document.getElementById('fpRailBtn');
      if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    }

    function enhance() {
      disableRail();
      var aside = document.querySelector('aside');
      if (!aside) return;
      var items = aside.querySelectorAll('nav a,nav button');
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
      if (!nav) return;
      for (var k = 0; k < nav.children.length; k++) {
        var child = nav.children[k];
        if (heading(child)) child.classList.add('fp-sec');
      }
    }

    function boot() {
      enhance();
      if (window.MutationObserver && document.body) {
        new MutationObserver(function () { disableRail(); }).observe(document.body, { attributes:true, attributeFilter:['class'] });
      }
      setInterval(enhance, 2000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) {}
})();

/* FEMMAS PRINT — Quick Sale Payment Mode popup v3.
 * IMPORTANT: the visible payment menu is appended directly to document.body and is
 * ALWAYS positioned ABOVE the clicked Payment Mode field. It is never rendered inside
 * the table/scroll container, so bottom rows cannot clip Cash/Bank/Voda/Yas/Simu. */
(function () {
  try {
    var MODES = ['Cash', 'Bank', 'Voda', 'Yas', 'Simu'];
    var COLORS = { Cash:'#16a34a', Bank:'#3496f3', Voda:'#e11d48', Yas:'#e0a400', Simu:'#8b5cf6' };
    var portal = null;
    var realMenu = null;
    var lastCell = null;
    var lastTrigger = null;

    function text(el) {
      return String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    }

    function closePortal() {
      if (portal && portal.parentNode) portal.parentNode.removeChild(portal);
      portal = null;
      if (realMenu) {
        try {
          realMenu.style.removeProperty('visibility');
          realMenu.style.removeProperty('pointer-events');
          realMenu.style.removeProperty('opacity');
        } catch (e) {}
      }
      realMenu = null;
      lastCell = null;
      lastTrigger = null;
    }

    function paymentHit(target) {
      if (!target || !target.closest) return null;
      if (target.closest('#fpQsPaymentPortal')) return null;
      var root = target.closest('[data-screen-label="Quick Sale"]');
      if (!root) return null;
      var cell = target.closest('td');
      if (!cell || !cell.parentNode || !cell.parentNode.children) return null;
      var index = Array.prototype.indexOf.call(cell.parentNode.children, cell);
      if (index !== 6) return null;
      var direct = cell.children && cell.children[0];
      if (!direct || direct.tagName !== 'DIV' || !direct.querySelector('svg')) return null;
      if (!direct.contains(target) && direct !== target) return null;
      return { cell:cell, trigger:direct };
    }

    function realOptions(cell) {
      var out = {};
      var divs = cell.querySelectorAll('div');
      for (var i = 0; i < divs.length; i++) {
        var d = divs[i];
        var t = text(d);
        if (MODES.indexOf(t) !== -1 && !d.querySelector('svg')) out[t] = d;
      }
      return out;
    }

    function commonMenu(options, cell) {
      var first = null;
      for (var i = 0; i < MODES.length; i++) {
        if (options[MODES[i]]) { first = options[MODES[i]]; break; }
      }
      if (!first) return null;
      var p = first.parentNode;
      while (p && p !== cell) {
        var all = true;
        for (var j = 0; j < MODES.length; j++) {
          if (options[MODES[j]] && !p.contains(options[MODES[j]])) { all = false; break; }
        }
        if (all) return p;
        p = p.parentNode;
      }
      return first.parentNode;
    }

    function buildPortal(cell, trigger, attempt) {
      if (!document.body || !document.documentElement.contains(trigger)) return;
      var options = realOptions(cell);
      var available = 0;
      for (var i = 0; i < MODES.length; i++) if (options[MODES[i]]) available++;
      if (available < 2) {
        if ((attempt || 0) < 14) setTimeout(function () { buildPortal(cell, trigger, (attempt || 0) + 1); }, 20);
        return;
      }

      if (portal && portal.parentNode) portal.parentNode.removeChild(portal);
      portal = null;
      realMenu = commonMenu(options, cell);
      if (realMenu) {
        realMenu.style.setProperty('visibility', 'hidden', 'important');
        realMenu.style.setProperty('pointer-events', 'none', 'important');
        realMenu.style.setProperty('opacity', '0', 'important');
      }

      var r = trigger.getBoundingClientRect();
      var width = Math.max(132, Math.round(r.width));
      var itemH = 36;
      var menuH = available * itemH + 10;
      var vw = window.innerWidth || document.documentElement.clientWidth || 1200;
      var left = Math.max(8, Math.min(Math.round(r.left), vw - width - 8));
      var top = Math.round(r.top - menuH - 6);  // ALWAYS ABOVE THE FIELD
      if (top < 8) top = 8;

      portal = document.createElement('div');
      portal.id = 'fpQsPaymentPortal';
      portal.setAttribute('role', 'menu');
      portal.style.cssText = 'position:fixed;left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;z-index:2147483640;background:#fff;border:1px solid rgba(46,144,240,.28);border-radius:12px;box-shadow:0 18px 46px rgba(19,49,90,.34);padding:5px;box-sizing:border-box;overflow:visible;';

      for (var m = 0; m < MODES.length; m++) {
        (function (mode) {
          var real = options[mode];
          if (!real) return;
          var item = document.createElement('button');
          item.type = 'button';
          item.setAttribute('role', 'menuitem');
          item.style.cssText = 'display:flex;width:100%;height:' + itemH + 'px;align-items:center;gap:8px;border:0;border-radius:8px;background:#fff;padding:0 10px;font:700 12px Arial,sans-serif;color:' + COLORS[mode] + ';cursor:pointer;text-align:left;';
          var dot = document.createElement('span');
          dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + COLORS[mode] + ';flex:none;';
          var label = document.createElement('span');
          label.textContent = mode;
          item.appendChild(dot);
          item.appendChild(label);
          item.onmouseenter = function () { item.style.background = '#eef5fd'; };
          item.onmouseleave = function () { item.style.background = '#fff'; };
          item.onmousedown = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            try { real.click(); }
            catch (e) {
              try { real.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); } catch (e2) {}
            }
            closePortal();
          };
          portal.appendChild(item);
        })(MODES[m]);
      }
      document.body.appendChild(portal);
    }

    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#fpQsPaymentPortal')) return;
      var hit = paymentHit(e.target);
      if (!hit) {
        closePortal();
        return;
      }
      lastCell = hit.cell;
      lastTrigger = hit.trigger;
      setTimeout(function () { buildPortal(lastCell, lastTrigger, 0); }, 0);
    }, true);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePortal();
    });
    window.addEventListener('resize', closePortal);
    window.addEventListener('scroll', function () {
      if (portal) closePortal();
    }, true);
  } catch (e) {}
})();
