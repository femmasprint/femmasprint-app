/* FEMMAS PRINT — sidebar v5.1.
 *
 * DEFAULT (everyone): the clean minimal enhancement — tooltips, fallback icons, clear
 * section headings, full-width rows, and the compact static Arifa card. Nothing risky.
 *
 * OPT-IN PREVIEW ("Accordion Navy", the owner's chosen design): grouped, collapsible
 * sub-menus. Enabled only when the visitor opts in with ?sb=acc (persisted), so live
 * customers are unaffected while the owner reviews it. ?sb=off turns it back off.
 * The flat menu is hidden until the accordion is built (anti-flicker); leftover native
 * section dividers are hidden via CSS (so app re-renders can't bring them back); and a
 * guarded observer rebuilds the groups if the app re-renders. Once approved this becomes
 * the default and the anti-flicker is moved to the edge for zero flash. */
(function () {
  try {
    var q = location.search || '';
    try {
      if (q.indexOf('sb=acc') >= 0) localStorage.setItem('fp_sidebar', 'accordion');
      else if (q.indexOf('sb=off') >= 0) localStorage.setItem('fp_sidebar', 'off');
    } catch (e) {}
    var ACC = false;
    try { ACC = localStorage.getItem('fp_sidebar') === 'accordion'; } catch (e) {}

    var FALL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8aa0c0" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6" fill="#8aa0c0" stroke="none"/></svg>';

    var baseCss =
      ' .fp-sec{opacity:.62;font-size:11px !important;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding-top:9px !important;pointer-events:none;cursor:default;display:block !important}' +
      ' aside .fp-fallicon{display:inline-flex;align-items:center;flex:none;margin-right:2px}' +
      ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
      ' aside > nav ~ * > div > div:nth-of-type(2){display:none !important}';

    var accCss =
      ' aside nav:not(.fp-acc-ready){opacity:0}' +
      ' aside nav.fp-acc-ready{opacity:1;transition:opacity .18s ease}' +
      /* once the accordion is built, the ONLY divs that should remain are our groups;
         every other direct-child div is a leftover native section label -> hide it.
         CSS so app re-renders that re-add them are hidden instantly, no flicker. */
      ' aside nav.fp-acc-ready > div:not(.fp-grp){display:none !important}' +
      ' .fp-grp-hdr{display:flex;align-items:center;gap:11px;padding:9px 12px;margin:1px 6px;border-radius:9px;cursor:pointer;color:#c3d2e8;font-size:13.5px;user-select:none;transition:background .15s,color .15s}' +
      ' .fp-grp-hdr:hover{background:rgba(46,144,240,.12);color:#fff}' +
      ' .fp-grp-hdr .fp-gi{width:18px;height:18px;flex:none;stroke:#7f97bd}' +
      ' .fp-grp-hdr .fp-nm{flex:1}' +
      ' .fp-grp-hdr .fp-chev{width:15px;height:15px;flex:none;stroke:#7f97bd;transition:transform .2s}' +
      ' .fp-grp.open > .fp-grp-hdr .fp-chev{transform:rotate(180deg)}' +
      ' .fp-grp-body{max-height:0;overflow:hidden;transition:max-height .26s ease}' +
      ' .fp-grp.open > .fp-grp-body{max-height:520px}' +
      ' .fp-grp-body > a,.fp-grp-body > button{padding-left:40px !important;width:100% !important}';

    var st = document.createElement('style');
    st.textContent = baseCss + (ACC ? accCss : '');
    document.head.appendChild(st);

    function looksLikeHeading(el) {
      if (!el || el.nodeType !== 1) return false;
      var tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT') return false;
      if (el.querySelector && el.querySelector('a,button,input,textarea,select,svg,img')) return false;
      var tx = (el.textContent || '').trim();
      return tx.length >= 2 && tx.length <= 26;
    }
    function decorate(aside) {
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
    }

    function enhanceMinimal() {
      var aside = document.querySelector('aside'); if (!aside) return;
      decorate(aside);
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

    var I = {
      cart: 'M3 3h2l2.4 12h9.2L20 7H6', box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
      factory: 'M2 20h20V9l-6 4V9l-6 4V4H2z', chart: 'M3 3v18h18M7 14l3-3 3 3 5-6',
      people: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87',
      gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14 3h-4l-.8 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L3 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1L10 21h4l.8-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.07-.33.1-.66.1-1z'
    };
    function svg(p, cls) { return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + p + '"/></svg>'; }
    var CHEV = '<svg class="fp-chev" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    var GROUPS = [
      { id: 'sales', name: 'Mauzo', ic: I.cart, m: ['sale', 'customer', 'debtor', 'madeni', 'receipt', 'risiti', 'wateja', 'wadaiwa'] },
      { id: 'inv', name: 'Manunuzi & Bidhaa', ic: I.box, m: ['item', 'bidhaa', 'bei &', 'majina', 'purchase', 'expense', 'wauzaji', 'supplier', 'manunuzi', 'matumizi'] },
      { id: 'prod', name: 'Uzalishaji', ic: I.factory, m: ['production', 'delivery', 'uzalishaji', 'usafirishaji', 'usafrishaji'] },
      { id: 'fin', name: 'Fedha & Ripoti', ic: I.chart, m: ['cash', 'bank', 'accounting', 'report', 'ripoti', 'grow your', 'benki', 'uhasibu', 'kuza', 'daybook', 'fedha na'] },
      { id: 'staff', name: 'Wafanyakazi', ic: I.people, m: ['mahudhurio', 'attendance', 'watumiaji', 'users', 'payroll', 'mfanyakazi', 'wafanyakazi', 'roles'] },
      { id: 'sys', name: 'Mfumo', ic: I.gear, m: ['femmasbot', 'sync', 'share', 'backup', 'utilities', 'settings', 'mipangilio', 'zana', 'sawazisha', 'hifadhi', 'rejesha'] }
    ];
    function isStandalone(l) { return /^home\b/.test(l) || /^nyumbani\b/.test(l) || /^quick sale/.test(l) || /^mauzo ya haraka/.test(l); }
    function isNoise(l) { return l.indexOf('search') === 0 || l.indexOf('tafuta') === 0 || l.indexOf('show all') === 0 || l.indexOf('onyesha') === 0; }
    function groupFor(l) {
      l = l.toLowerCase(); if (isStandalone(l)) return null;
      for (var i = 0; i < GROUPS.length; i++) for (var j = 0; j < GROUPS[i].m.length; j++) if (l.indexOf(GROUPS[i].m[j]) >= 0) return GROUPS[i].id;
      return 'sys';
    }
    function needsRegroup(nav) {
      var all = nav.querySelectorAll('a,button'), content = 0, ungrouped = 0;
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].textContent || '').trim().toLowerCase(); if (!t || isNoise(t)) continue;
        content++; if (isStandalone(t)) continue;
        if (!all[i].closest('.fp-grp-body')) ungrouped++;
      }
      if (content < 6) return false;
      if (!nav.querySelector('.fp-grp')) return true;
      return ungrouped > 0;
    }
    function buildGroups(nav) {
      var old = nav.querySelectorAll('.fp-grp'); for (var i = 0; i < old.length; i++) old[i].remove();
      var links = [], all = nav.querySelectorAll('a,button'), seen = {};
      for (var a = 0; a < all.length; a++) {
        var tx = (all[a].textContent || '').replace(/\s+/g, ' ').trim(), lc = tx.toLowerCase();
        if (!tx || isNoise(lc) || seen[lc]) continue; seen[lc] = 1; links.push(all[a]);
      }
      if (links.length < 6) return;
      var home = null, qs = null;
      links.forEach(function (el) { var t = (el.textContent || '').trim().toLowerCase(); if (/^home\b/.test(t) || /^nyumbani\b/.test(t)) home = el; else if (/^quick sale/.test(t) || /^mauzo ya haraka/.test(t)) qs = el; });
      var boxes = {};
      GROUPS.forEach(function (g) {
        var box = document.createElement('div'); box.className = 'fp-grp'; box.setAttribute('data-gid', g.id);
        var hdr = document.createElement('div'); hdr.className = 'fp-grp-hdr'; hdr.title = g.name;
        hdr.innerHTML = svg(g.ic, 'fp-gi') + '<span class="fp-nm">' + g.name + '</span>' + CHEV;
        var body = document.createElement('div'); body.className = 'fp-grp-body';
        hdr.addEventListener('click', function () { box.classList.toggle('open'); try { localStorage.setItem('fpg_' + g.id, box.classList.contains('open') ? '1' : '0'); } catch (e) {} });
        box.appendChild(hdr); box.appendChild(body); boxes[g.id] = box;
      });
      links.forEach(function (el) { if (el === home || el === qs) return; var gid = groupFor((el.textContent || '').replace(/\s+/g, ' ').trim()); if (boxes[gid]) boxes[gid].querySelector('.fp-grp-body').appendChild(el); });
      GROUPS.forEach(function (g) { nav.appendChild(boxes[g.id]); });
      if (home && qs) home.insertAdjacentElement('afterend', qs);
      GROUPS.forEach(function (g) { var was; try { was = localStorage.getItem('fpg_' + g.id); } catch (e) {} if (was === '1') boxes[g.id].classList.add('open'); });
      nav.classList.add('fp-acc-ready');
    }
    var obs = null, OPT = { childList: true, subtree: true };
    function syncAcc() {
      var aside = document.querySelector('aside'); if (!aside) return;
      var nav = aside.querySelector('nav'); if (!nav) return;
      if (obs) obs.disconnect();
      try { decorate(aside); if (needsRegroup(nav)) buildGroups(nav); nav.classList.add('fp-acc-ready'); } catch (e) {}
      if (obs) { try { obs.observe(document.body, OPT); } catch (e) {} }
    }

    function boot() {
      if (ACC) {
        syncAcc();
        try { obs = new MutationObserver(syncAcc); obs.observe(document.body, OPT); } catch (e) {}
        setInterval(syncAcc, 1500);
        setTimeout(function () { var n = document.querySelector('aside nav'); if (n) n.classList.add('fp-acc-ready'); }, 2500);
      } else {
        enhanceMinimal();
        setInterval(enhanceMinimal, 2000);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  } catch (e) { /* noop */ }
})();
