/* FEMMAS PRINT — sidebar enhancer v2
 * 1) fp logo (top) toggles collapse/expand (body.fp-rail).
 * 2) every nav item gets a tooltip (title); items without an icon get a fallback icon.
 * 3) the flat 25-item menu is grouped into a FEW main menus, each collapsible (accordion):
 *      Home + Quick Sale stay standalone at the top, then:
 *      Mauzo · Manunuzi & Bidhaa · Uzalishaji · Fedha & Ripoti · Wafanyakazi · Mfumo
 *    Legacy section dividers are hidden and kept hidden through the framework's re-renders.
 * The app's sidebar node is stable, so we build the groups once and keep them tidy with observers.
 */
(function () {
  try {
    var css = document.createElement('style');
    css.textContent =
      '#fpRailBtn{display:none !important}' +
      ' aside img{cursor:pointer}' +
      ' body:not(.fp-rail) aside .fp-fallicon{display:none !important}' +
      ' body.fp-rail aside .fp-fallicon{font-size:0 !important;display:flex !important;align-items:center;justify-content:center;width:100% !important}' +
      ' body.fp-rail aside .fp-fallicon svg{width:20px !important;height:20px !important}' +
      /* group styles */
      ' .fp-grp-hdr{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:9px;cursor:pointer;color:#c2d0e3;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;user-select:none}' +
      ' .fp-grp-hdr:hover{background:rgba(46,144,240,.14);color:#fff}' +
      ' .fp-grp-hdr .fp-chev{margin-left:auto;transition:transform .2s}' +
      ' .fp-grp.open > .fp-grp-hdr .fp-chev{transform:rotate(90deg)}' +
      ' .fp-grp-body{display:none;flex-direction:column;gap:1px;padding-left:10px;margin:1px 0 6px}' +
      ' .fp-grp.open > .fp-grp-body{display:flex}' +
      ' .fp-grp-body > a, .fp-grp-body > button{width:100% !important}' +
      ' body.fp-rail .fp-grp-body{display:none !important}' +
      ' body.fp-rail .fp-grp-hdr > span:not(.fp-gi){font-size:0 !important}' +
      ' body.fp-rail .fp-grp-hdr .fp-chev{display:none !important}';
    document.head.appendChild(css);

    var FALL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
    var I = {
      cart: 'M3 3h2l2.4 12h9.2L20 7H6',
      box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
      factory: 'M2 20h20V9l-6 4V9l-6 4V4H2z',
      chart: 'M3 3v18h18M7 14l3-3 3 3 5-6',
      people: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87',
      gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14 3h-4l-.8 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L3 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1L10 21h4l.8-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.07-.33.1-.66.1-1z'
    };
    function svg(p) { return '<svg class="fp-gi" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2" style="flex:none"><path d="' + p + '"/></svg>'; }
    var CHEV = '<svg class="fp-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2.4"><path d="M9 18l6-6-6-6"/></svg>';

    var GROUPS = [
      { id: 'sales', name: 'Mauzo', ic: I.cart, m: ['sale', 'customer', 'debtor', 'madeni', 'receipt', 'risiti'] },
      { id: 'inv', name: 'Manunuzi & Bidhaa', ic: I.box, m: ['item', 'bidhaa', 'bei &', 'majina', 'purchase', 'expense', 'wauzaji', 'supplier'] },
      { id: 'prod', name: 'Uzalishaji', ic: I.factory, m: ['production', 'delivery'] },
      { id: 'fin', name: 'Fedha & Ripoti', ic: I.chart, m: ['cash', 'bank', 'accounting', 'report', 'ripoti', 'grow your'] },
      { id: 'staff', name: 'Wafanyakazi', ic: I.people, m: ['mahudhurio', 'attendance', 'watumiaji', 'users', 'payroll', 'mfanyakazi'] },
      { id: 'sys', name: 'Mfumo', ic: I.gear, m: ['femmasbot', 'sync', 'share', 'backup', 'utilities', 'settings', 'mipangilio'] }
    ];
    var DIVS = ['transactions', 'operations', 'money', 'system', 'management', 'overview'];

    function groupFor(label) {
      label = label.toLowerCase();
      if (/^home/.test(label) || /^quick sale/.test(label)) return null;
      for (var i = 0; i < GROUPS.length; i++) {
        for (var j = 0; j < GROUPS[i].m.length; j++) {
          if (label.indexOf(GROUPS[i].m[j]) >= 0) return GROUPS[i].id;
        }
      }
      return 'sys';
    }

    function hideDividers(nav) {
      var kids = nav.children;
      for (var i = 0; i < kids.length; i++) {
        var ch = kids[i];
        if (ch.classList && ch.classList.contains('fp-grp')) continue;
        if (ch.tagName === 'A' || ch.tagName === 'BUTTON') continue;
        if (ch.querySelector && ch.querySelector('a,button')) continue; /* keep containers with real links (e.g. Home wrapper) */
        var tx = (ch.textContent || '').trim().toLowerCase();
        if (DIVS.indexOf(tx) >= 0 && ch.style.display !== 'none') {
          ch.style.setProperty('display', 'none', 'important');
        }
      }
    }

    function buildGroups(nav) {
      if (nav.getAttribute('data-fpgrouped')) return;
      var links = [];
      var all = nav.querySelectorAll('a,button');
      for (var i = 0; i < all.length; i++) {
        var tx = (all[i].textContent || '').trim().toLowerCase();
        if (tx && tx.indexOf('search') !== 0 && tx.indexOf('show all') !== 0) links.push(all[i]);
      }
      if (links.length < 6) return; /* not fully rendered yet */

      var homeLink = null, qsLink = null;
      links.forEach(function (el) {
        var t = (el.textContent || '').trim();
        if (/^home/i.test(t)) homeLink = el;
        else if (/^quick sale/i.test(t)) qsLink = el;
      });

      var containers = {};
      GROUPS.forEach(function (g) {
        var box = document.createElement('div');
        box.className = 'fp-grp';
        box.setAttribute('data-gid', g.id);
        var hdr = document.createElement('div');
        hdr.className = 'fp-grp-hdr';
        hdr.title = g.name;
        hdr.innerHTML = svg(g.ic) + '<span>' + g.name + '</span>' + CHEV;
        var body = document.createElement('div');
        body.className = 'fp-grp-body';
        hdr.addEventListener('click', function () {
          if (document.body.classList.contains('fp-rail')) {
            document.body.classList.remove('fp-rail');
            try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
          }
          box.classList.toggle('open');
          try { localStorage.setItem('fpg_' + g.id, box.classList.contains('open') ? '1' : '0'); } catch (e) {}
        });
        box.appendChild(hdr);
        box.appendChild(body);
        containers[g.id] = box;
      });

      links.forEach(function (el) {
        if (el === homeLink || el === qsLink) return;
        var gid = groupFor((el.textContent || '').replace(/\s+/g, ' ').trim());
        if (containers[gid]) containers[gid].querySelector('.fp-grp-body').appendChild(el);
      });

      GROUPS.forEach(function (g) { nav.appendChild(containers[g.id]); });

      /* Quick Sale sits right after Home at the top */
      if (homeLink && qsLink) homeLink.insertAdjacentElement('afterend', qsLink);

      /* restore open/closed state (default: all closed) */
      GROUPS.forEach(function (g) {
        var was;
        try { was = localStorage.getItem('fpg_' + g.id); } catch (e) {}
        if (was === '1') containers[g.id].classList.add('open');
      });

      nav.setAttribute('data-fpgrouped', '1');
    }

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
          s.innerHTML = FALL;
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
      var nav = aside.querySelector('nav');
      if (nav) {
        buildGroups(nav);
        hideDividers(nav);
        if (!nav.__fpDivObs) {
          try {
            var obs = new MutationObserver(function () { hideDividers(nav); });
            obs.observe(nav, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
            nav.__fpDivObs = obs;
          } catch (e) {}
        }
      }
    }

    function boot() {
      enhance();
      var a = document.querySelector('aside');
      if (a) { try { new MutationObserver(function () { enhance(); }).observe(a, { childList: true, subtree: true }); } catch (e) {} }
      setInterval(enhance, 2000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
