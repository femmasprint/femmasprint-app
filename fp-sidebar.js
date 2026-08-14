/* FEMMAS PRINT production UI fixes — stable Quick Sale version */
(function () {
  'use strict';

  var CANONICAL_NAMES = {
    'ismail issa':1,
    'hassan mwesiumo':1,
    'ismar salim hussein (suma)':1,
    'steven mkope':1,
    'fadhili ally':1,
    'emanuel w. sese (ima)':1,
    'sedekia johnson laurent':1,
    'henry charles kwedi':1,
    'shaibu frank malekela':1
  };
  var LEGACY = { stive:1, kwedy:1, sedekia:1, imma:1, hasan:1, ismo:1, suma:1, fadhil:1, shaibu:1 };

  function nameOf(r) {
    return String((r && (r.client || r.name || r.Name)) || '').trim().toLowerCase();
  }
  function reasonOf(r) {
    return String((r && (r.goods || r.reason || r.Reason || r.item)) || '').trim().toLowerCase();
  }
  function isNauli(r) {
    return reasonOf(r).indexOf('nauli') !== -1;
  }

  function sanitizeRows(rows) {
    if (!Array.isArray(rows)) return { rows:rows, changed:false };
    var seen = {};
    var out = [];
    var changed = false;

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r || typeof r !== 'object') { out.push(r); continue; }

      var nm = nameOf(r);
      if (LEGACY[nm] && isNauli(r)) { changed = true; continue; }

      var pm = String(r.payMode || r.PayMode || '').trim().toLowerCase();
      if (pm === 'mobile money' || pm === 'simu pay') {
        if ('payMode' in r || !('PayMode' in r)) r.payMode = 'Simu';
        else r.PayMode = 'Simu';
        changed = true;
      }

      if (CANONICAL_NAMES[nm] && isNauli(r)) {
        if (seen[nm]) { changed = true; continue; }
        seen[nm] = 1;
      }
      out.push(r);
    }

    return { rows:out, changed:changed || out.length !== rows.length };
  }

  function repairStorageOnce() {
    var marker = 'fp_qs_stable_repair_20260814_v1';
    try {
      if (sessionStorage.getItem(marker) === '1') return;
      sessionStorage.setItem(marker, '1');
    } catch (e) {}

    setTimeout(function () {
      var changed = false;

      function cleanKey(key) {
        try {
          var raw = localStorage.getItem(key);
          if (!raw) return;
          var c = JSON.parse(raw);
          if (!c || typeof c !== 'object') return;
          var localChanged = false;

          if (Array.isArray(c.qsExpenses)) {
            var a = sanitizeRows(c.qsExpenses);
            if (a.changed) { c.qsExpenses = a.rows; localChanged = true; }
          }

          if (c.qsStore && typeof c.qsStore === 'object') {
            Object.keys(c.qsStore).forEach(function (d) {
              var day = c.qsStore[d];
              if (!day || typeof day !== 'object' || !Array.isArray(day.expenses)) return;
              var b = sanitizeRows(day.expenses);
              if (b.changed) { day.expenses = b.rows; localChanged = true; }
            });
          }

          if (localChanged) {
            localStorage.setItem(key, JSON.stringify(c));
            changed = true;
          }
        } catch (e) {}
      }

      cleanKey('fp_local_cache');
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i) || '';
          if (key.indexOf('fp_local_cache_') === 0) cleanKey(key);
        }
      } catch (e) {}

      if (changed) setTimeout(function () { location.reload(); }, 120);
    }, 1200);
  }

  var style = document.createElement('style');
  style.id = 'fpProductionUiFixes';
  style.textContent =
    '#fpRailBtn{display:none!important}' +
    '[data-screen-label="Quick Sale"] tr.fp-qs-empty-row td:nth-child(7)>div:first-child{visibility:hidden!important}' +
    '[data-screen-label="Quick Sale"] tr.fp-qs-exp-empty-row td:nth-child(7)>div:first-child{visibility:hidden!important}' +
    '@media (min-width:1100px){' +
      '[data-screen-label="Quick Sale"] .fp-qs-sales-scroll{overflow-x:hidden!important;overflow-y:visible!important;max-width:100%!important}' +
      '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important}' +
      '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit th,[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td{min-width:0!important;box-sizing:border-box!important;font-size:10.5px!important}' +
      '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td{overflow:hidden}' +
      '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(2),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(3),[data-screen-label="Quick Sale"] table.fp-qs-sales-fit td:nth-child(7){overflow:visible!important}' +
      '[data-screen-label="Quick Sale"] table.fp-qs-sales-fit input{width:100%!important;min-width:0!important;box-sizing:border-box!important;padding-left:5px!important;padding-right:5px!important;font-size:10.5px!important}' +
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
    '}';
  document.head.appendChild(style);

  function disableRail() {
    try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
    if (document.body) document.body.classList.remove('fp-rail');
    var btn = document.getElementById('fpRailBtn');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }

  function findTable(root, count) {
    var tables = root ? root.querySelectorAll('table') : [];
    for (var i = 0; i < tables.length; i++) {
      var row = tables[i].querySelector('tbody tr');
      if (row && row.children && row.children.length === count) return tables[i];
    }
    return null;
  }

  function markScroll(table, root) {
    var el = table ? table.parentElement : null;
    var fallback = el;
    while (el && el !== root) {
      try {
        var ox = window.getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') { el.classList.add('fp-qs-sales-scroll'); return; }
      } catch (e) {}
      el = el.parentElement;
    }
    if (fallback) fallback.classList.add('fp-qs-sales-scroll');
  }

  function txt(el) {
    return String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  }

  function setButtonText(button, label) {
    if (!button) return;
    for (var i = 0; i < button.childNodes.length; i++) {
      var n = button.childNodes[i];
      if (n.nodeType === 3 && String(n.nodeValue || '').trim()) { n.nodeValue = label; return; }
    }
  }

  function applyQuickSaleUi() {
    disableRail();
    var root = document.querySelector('[data-screen-label="Quick Sale"]');
    if (!root) return;

    var sales = findTable(root, 10);
    if (sales) {
      sales.classList.add('fp-qs-sales-fit');
      markScroll(sales, root);
      var sr = sales.querySelectorAll('tbody tr');
      for (var i = 0; i < sr.length; i++) {
        var client = sr[i].querySelector('input[data-qs-client]');
        if (!client) continue;
        sr[i].classList.toggle('fp-qs-empty-row', !String(client.value || '').trim());
        var spm = sr[i].children[6] && sr[i].children[6].children[0];
        if (spm && (txt(spm) === 'Simu' || txt(spm) === 'Mobile Money')) setButtonText(spm, 'Simu Pay');
      }
    }

    var expenses = findTable(root, 8);
    if (expenses) {
      var er = expenses.querySelectorAll('tbody tr');
      for (var j = 0; j < er.length; j++) {
        var nameInput = er[j].querySelector('td:nth-child(2) input');
        if (!nameInput) continue;
        var empty = !String(nameInput.value || '').trim();
        er[j].classList.toggle('fp-qs-exp-empty-row', empty);
        var epm = er[j].children[6] && er[j].children[6].children[0];
        if (!empty && epm && (txt(epm) === 'Simu' || txt(epm) === 'Mobile Money')) setButtonText(epm, 'Simu Pay');
      }
    }
  }

  var MODES = ['Cash','Bank','Voda','Yas','Simu'];
  var COLORS = { Cash:'#16a34a', Bank:'#3496f3', Voda:'#e11d48', Yas:'#e0a400', Simu:'#8b5cf6' };
  var LABELS = { Cash:'Cash', Bank:'Bank', Voda:'Voda', Yas:'Yas', Simu:'Simu Pay' };
  var portal = null;
  var realMenu = null;

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
    if (Array.prototype.indexOf.call(cell.parentNode.children, cell) !== 6) return null;
    if (cell.parentNode.classList.contains('fp-qs-empty-row') || cell.parentNode.classList.contains('fp-qs-exp-empty-row')) return null;
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
      var t = txt(d);
      if (t === 'Simu Pay') t = 'Simu';
      if (MODES.indexOf(t) !== -1 && !d.querySelector('svg')) out[t] = d;
    }
    return out;
  }

  function findRealMenu(options, cell) {
    var first = null;
    for (var i = 0; i < MODES.length; i++) if (options[MODES[i]]) { first = options[MODES[i]]; break; }
    if (!first) return null;
    var p = first.parentNode;
    while (p && p !== cell) {
      var all = true;
      for (var j = 0; j < MODES.length; j++) if (options[MODES[j]] && !p.contains(options[MODES[j]])) { all = false; break; }
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
    portal.style.cssText = 'position:fixed;left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;z-index:2147483640;background:#fff;border:1px solid rgba(46,144,240,.28);border-radius:12px;box-shadow:0 18px 46px rgba(19,49,90,.34);padding:5px;box-sizing:border-box;';

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
        label.textContent = LABELS[mode] || mode;
        item.appendChild(dot);
        item.appendChild(label);
        item.onmouseenter = function () { item.style.background = '#eef5fd'; };
        item.onmouseleave = function () { item.style.background = '#fff'; };
        item.onmousedown = function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          try { real.click(); } catch (e) { try { real.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); } catch (e2) {} }
          closePortal();
          setTimeout(applyQuickSaleUi, 0);
        };
        portal.appendChild(item);
      })(MODES[m]);
    }
    document.body.appendChild(portal);
  }

  function boot() {
    applyQuickSaleUi();
    repairStorageOnce();

    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#fpQsPaymentPortal')) return;
      var hit = paymentHit(e.target);
      if (!hit) { closePortal(); return; }
      setTimeout(function () { buildPortal(hit.cell, hit.trigger, 0); }, 0);
    }, true);

    document.addEventListener('input', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-screen-label="Quick Sale"]')) setTimeout(applyQuickSaleUi, 0);
    }, true);

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePortal(); });
    window.addEventListener('resize', function () { closePortal(); applyQuickSaleUi(); });
    window.addEventListener('scroll', function () { if (portal) closePortal(); }, true);

    if (window.MutationObserver && document.body) {
      var pending = false;
      new MutationObserver(function () {
        disableRail();
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; applyQuickSaleUi(); }, 40);
      }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    }

    /* UI-only refresh. No periodic localStorage mutation here. */
    setInterval(function () {
      disableRail();
      applyQuickSaleUi();
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
