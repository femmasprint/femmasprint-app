/* FEMMAS PRINT production UI fixes.
 * 1) Keep the desktop sidebar expanded.
 * 2) Keep Quick Sale payment menus above the table.
 * 3) Fit the Quick Sale Sales table inside its panel on desktop.
 * 4) Keep blank Sales rows visually clean until a client is entered.
 */
(function () {
  'use strict';

  /* ---------- one-time Quick Sale Nauli cleanup ---------- */
  try {
    var legacy = { stive:1, kwedy:1, sedekia:1, imma:1, hasan:1, ismo:1, suma:1, fadhil:1, shaibu:1 };
    var canonical = [
      { name:'Ismail Issa', price:'7000' },
      { name:'Hassan Mwesiumo', price:'7000' },
      { name:'Ismar Salim Hussein (Suma)', price:'7000' },
      { name:'Steven Mkope', price:'5000' },
      { name:'Fadhili Ally', price:'7000' },
      { name:'Emanuel W. Sese (Ima)', price:'7000' },
      { name:'Sedekia Johnson Laurent', price:'7000' },
      { name:'Henry Charles Kwedi', price:'7000' },
      { name:'Shaibu Frank Malekela', price:'7000' }
    ];

    function isLegacyNauli(r) {
      if (!r) return false;
      var nm = String(r.client || r.name || '').trim().toLowerCase();
      var rs = String(r.goods || r.reason || '').trim().toLowerCase();
      return !!(legacy[nm] && rs.indexOf('nauli') > -1);
    }

    function cleanRows(rows) {
      if (!Array.isArray(rows)) return { rows:rows, changed:false };
      var out = rows.filter(function (r) { return !isLegacyNauli(r); });
      return { rows:out, changed:out.length !== rows.length };
    }

    var cleanupChanged = false;
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
        cleanupChanged = true;
      }
    } catch (e) {
      try { localStorage.setItem('fp_daily_exp_tpl', JSON.stringify(canonical)); cleanupChanged = true; } catch (e2) {}
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
          cleanupChanged = true;
        }
      } catch (e) {}
    }

    cleanCache('fp_local_cache');
    try {
      for (var ci = 0; ci < localStorage.length; ci++) {
        var ck = localStorage.key(ci) || '';
        if (ck.indexOf('fp_local_cache_') === 0) cleanCache(ck);
      }
    } catch (e) {}

    if (cleanupChanged) {
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

  /* ---------- styles ---------- */
  try {
    var oldStyle = document.getElementById('fpProductionUiFixes');
    if (oldStyle && oldStyle.parentNode) oldStyle.parentNode.removeChild(oldStyle);

    var style = document.createElement('style');
    style.id = 'fpProductionUiFixes';
    style.textContent =
      '.fp-sec{opacity:.62;font-size:11px!important;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding-top:9px!important;pointer-events:none;cursor:default;display:block!important}' +
      'aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      'aside nav a{display:flex!important;align-items:center;width:100%!important;box-sizing:border-box}' +
      'aside>nav~*>div>div:nth-of-type(2){display:none!important}' +
      '#fpRailBtn{display:none!important}' +
      '[data-screen-label="Quick Sale"] tr.fp-qs-empty-row td:nth-child(7)>div:first-child{visibility:hidden!important}' +
      '@media (min-width:1100px){' +
        '[data-screen-label="Quick Sale"] .fp-qs-sales-scroll{overflow-x:hidden!important;overflow-y:visible!important;max-width:100%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th,[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td{min-width:0!important;max-width:none!important;box-sizing:border-box!important;font-size:10.5px!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td{overflow:hidden}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(2),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(3),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(7){overflow:visible!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit input{width:100%!important;min-width:0!important;box-sizing:border-box!important;padding-left:5px!important;padding-right:5px!important;font-size:10.5px!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th{padding-left:4px!important;padding-right:4px!important;white-space:normal!important;line-height:1.1!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(1),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(1){width:4%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(2),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(2){width:14%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(3),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(3){width:18%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(4),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(4){width:7%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(5),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(5){width:10%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(6),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(6){width:12%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(7),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(7){width:14%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(8),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(8){width:10%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(9),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(9){width:8%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(10),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th:nth-child(10){width:3%!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(6),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(8),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(9){padding-left:4px!important;padding-right:4px!important;white-space:nowrap!important;text-overflow:ellipsis!important}' +
        '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(7)>div:first-child{padding:5px 5px!important;font-size:10.5px!important;gap:2px!important}' +
      '}';
    document.head.appendChild(style);
  } catch (e) {}

  /* ---------- desktop sidebar ---------- */
  var FALL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6" fill="#8aa0c0" stroke="none"/></svg>';

  function disableRail() {
    try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
    if (document.body) document.body.classList.remove('fp-rail');
    var btn = document.getElementById('fpRailBtn');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }

  function enhanceSidebar() {
    disableRail();
    var aside = document.querySelector('aside');
    if (!aside) return;
    var items = aside.querySelectorAll('nav a,nav button');
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (!el.getAttribute('title')) {
        var label = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (label) el.setAttribute('title', label.slice(0, 48));
      }
      if (!el.querySelector('svg') && !el.querySelector('img') && !el.querySelector('.fp-fallicon')) {
        var s = document.createElement('span');
        s.className = 'fp-fallicon';
        s.innerHTML = FALL;
        el.insertBefore(s, el.firstChild);
      }
    }
  }

  /* ---------- Quick Sale table fit ---------- */
  function findSalesTable(root) {
    var tables = root ? root.querySelectorAll('table') : [];
    for (var i = 0; i < tables.length; i++) {
      var row = tables[i].querySelector('tbody tr');
      if (row && row.children && row.children.length === 10) return tables[i];
    }
    return null;
  }

  function markScrollAncestor(table, root) {
    var el = table ? table.parentElement : null;
    var fallback = el;
    while (el && el !== root) {
      try {
        var cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
        var ox = cs ? cs.overflowX : '';
        if (ox === 'auto' || ox === 'scroll') {
          el.classList.add('fp-qs-sales-scroll');
          return;
        }
      } catch (e) {}
      el = el.parentElement;
    }
    if (fallback) fallback.classList.add('fp-qs-sales-scroll');
  }

  function applyQuickSaleFit() {
    var root = document.querySelector('[data-screen-label="Quick Sale"]');
    if (!root) return;
    var table = findSalesTable(root);
    if (!table) return;
    table.classList.add('fp-qs-sales-fit');
    markScrollAncestor(table, root);

    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var client = rows[i].querySelector('input[data-qs-client]');
      if (!client) continue;
      var empty = !String(client.value || '').trim();
      rows[i].classList.toggle('fp-qs-empty-row', empty);
    }
  }

  /* ---------- Quick Sale payment popup ---------- */
  var MODES = ['Cash','Bank','Voda','Yas','Simu'];
  var COLORS = { Cash:'#16a34a', Bank:'#3496f3', Voda:'#e11d48', Yas:'#e0a400', Simu:'#8b5cf6' };
  var portal = null;
  var realMenu = null;

  function qText(el) {
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
  }

  function paymentHit(target) {
    if (!target || !target.closest || target.closest('#fpQsPaymentPortal')) return null;
    var root = target.closest('[data-screen-label="Quick Sale"]');
    if (!root) return null;
    var cell = target.closest('td');
    if (!cell || !cell.parentNode || !cell.parentNode.children) return null;
    var index = Array.prototype.indexOf.call(cell.parentNode.children, cell);
    if (index !== 6) return null;
    var trigger = cell.children && cell.children[0];
    if (!trigger || trigger.tagName !== 'DIV' || !trigger.querySelector('svg')) return null;
    if (!trigger.contains(target) && trigger !== target) return null;
    return { cell:cell, trigger:trigger };
  }

  function realOptions(cell) {
    var out = {};
    var divs = cell.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      var t = qText(d);
      if (MODES.indexOf(t) !== -1 && !d.querySelector('svg')) out[t] = d;
    }
    return out;
  }

  function findRealMenu(options, cell) {
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

    closePortal();
    realMenu = findRealMenu(options, cell);
    if (realMenu) {
      realMenu.style.setProperty('visibility', 'hidden', 'important');
      realMenu.style.setProperty('pointer-events', 'none', 'important');
      realMenu.style.setProperty('opacity', '0', 'important');
    }

    var r = trigger.getBoundingClientRect();
    var width = Math.max(120, Math.round(r.width));
    var itemH = 34;
    var menuH = available * itemH + 10;
    var vw = window.innerWidth || document.documentElement.clientWidth || 1200;
    var left = Math.max(8, Math.min(Math.round(r.left), vw - width - 8));
    var top = Math.max(8, Math.round(r.top - menuH - 6));

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
        item.style.cssText = 'display:flex;width:100%;height:' + itemH + 'px;align-items:center;gap:8px;border:0;border-radius:8px;background:#fff;padding:0 9px;font:700 12px Arial,sans-serif;color:' + COLORS[mode] + ';cursor:pointer;text-align:left;';
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

  function boot() {
    enhanceSidebar();
    applyQuickSaleFit();

    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#fpQsPaymentPortal')) return;
      var hit = paymentHit(e.target);
      if (!hit) { closePortal(); return; }
      setTimeout(function () { buildPortal(hit.cell, hit.trigger, 0); }, 0);
    }, true);

    document.addEventListener('input', function (e) {
      if (e.target && e.target.matches && e.target.matches('[data-screen-label="Quick Sale"] input[data-qs-client]')) applyQuickSaleFit();
    }, true);

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePortal(); });
    window.addEventListener('resize', function () { closePortal(); applyQuickSaleFit(); });
    window.addEventListener('scroll', function () { if (portal) closePortal(); }, true);

    if (window.MutationObserver && document.body) {
      var pending = false;
      new MutationObserver(function () {
        disableRail();
        if (pending) return;
        pending = true;
        setTimeout(function () {
          pending = false;
          applyQuickSaleFit();
        }, 40);
      }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    }

    setInterval(function () { enhanceSidebar(); applyQuickSaleFit(); }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
