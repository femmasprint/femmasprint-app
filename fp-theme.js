/* fp-theme.js — FemmasBot: professional Light / Dark / System theme control + a
 * language helper. The theme control drives the app's OWN toggle so the darkMode
 * state and html.fp-dark class stay in sync; persistent CSS darkens the app's light
 * surfaces so nothing can flash white on any re-render; and the saved language is
 * kept applied on a short cadence (killing the flash-of-English on reload AND
 * in-app navigation) plus a large supplementary Swahili dictionary for inner-page
 * labels (reports, filters, subtitles, column headers, forms) the app's own i18n
 * misses. */
(function () {
  var LS_MODE = 'fp_mode', LS_DARK = 'fp_dark';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    'html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
    'button[title*="Light / Dark"],button[title*="Mwanga / Giza"]{display:none !important}' +
    'html.fp-dark .fp-fd{background:#131a2b !important;background-color:#131a2b !important;' +
    'border-color:rgba(255,255,255,.07) !important;color:#e6edf7 !important}' +
    'html.fp-dark [style*="rgb(245, 248, 252)"]{background:#0a0e1a !important;background-color:#0a0e1a !important}' +
    'html.fp-dark [style*="rgb(248, 249, 251)"],html.fp-dark [style*="rgb(244, 245, 247)"],' +
    'html.fp-dark [style*="rgb(233, 243, 254)"],' +
    'html.fp-dark [style*="background:#fff"],html.fp-dark [style*="background: #fff"],' +
    'html.fp-dark [style*="background: rgb(255, 255, 255)"],html.fp-dark [style*="background:rgb(255, 255, 255)"],' +
    'html.fp-dark [style*="background: rgba(255, 255, 255"],html.fp-dark [style*="background:rgba(255, 255, 255"]' +
    '{background:#131a2b !important;background-color:#131a2b !important;border-color:rgba(255,255,255,.07) !important}' +
    'html.fp-dark [style*="color: rgb(15, 23, 42)"],html.fp-dark [style*="color:#0f172a"],' +
    'html.fp-dark [style*="color: rgb(31, 41, 55)"],html.fp-dark [style*="color: rgb(71, 85, 105)"],' +
    'html.fp-dark [style*="color: rgb(19, 49, 90)"],html.fp-dark [style*="color:#13315a"],' +
    'html.fp-dark [style*="color: rgb(47, 86, 136)"]{color:#dbe6f5 !important}' +
    '.fp-theme{display:inline-flex;align-items:center;gap:2px;background:rgba(130,150,180,.16);' +
    'border-radius:10px;padding:3px;vertical-align:middle}' +
    '.fp-theme button{all:unset;box-sizing:border-box;cursor:pointer;width:30px;height:26px;' +
    'display:flex;align-items:center;justify-content:center;border-radius:7px;color:#7d93b3;' +
    'transition:background .15s,color .15s}' +
    '.fp-theme button:hover{color:#cfe0f5}' +
    '.fp-theme button.on{background:#2e90f0;color:#fff;box-shadow:0 2px 6px rgba(46,144,240,.4)}' +
    '.fp-theme svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;' +
    'stroke-linecap:round;stroke-linejoin:round}';

  function icon(m) {
    if (m === 'light') return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    if (m === 'dark') return '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    return '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function systemDark() { return mq ? mq.matches : false; }

  function findThemeBtn() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) return btns[i];
    }
    return null;
  }

  function markLightCards(on) {
    var els = document.querySelectorAll('[style*="background"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!on) { el.classList.remove('fp-fd'); continue; }
      var m = (el.getAttribute('style') || '').match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/);
      if (!m) { el.classList.remove('fp-fd'); continue; }
      var c = m[1], rgb = c.match(/(\d+),\s*(\d+),\s*(\d+)/);
      var bright = rgb ? (+rgb[1] + +rgb[2] + +rgb[3]) > 560 : /#fff|#f[0-9a-f]|white/i.test(c);
      el.classList.toggle('fp-fd', bright);
    }
  }

  function flip(dark, animate) {
    var html = document.documentElement;
    set(LS_DARK, dark ? '1' : '0');
    if (html.classList.contains('fp-dark') === dark && !animate) return;
    var already = html.classList.contains('fp-dark') === dark;
    if (!already) {
      var b = findThemeBtn();
      if (!b) { html.classList.toggle('fp-dark', dark); }
      else { b.click(); if (html.classList.contains('fp-dark') !== dark) b.click(); }
    }
    if (!animate) return;
    if (dark) {
      var t0 = performance.now();
      (function chase() {
        markLightCards(true);
        if (performance.now() - t0 < 600) requestAnimationFrame(chase);
      })();
    } else {
      markLightCards(false);
    }
  }

  var wrap = null, booted = false;
  function paint(mode) {
    if (!wrap) return;
    [].forEach.call(wrap.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-m') === mode);
    });
  }

  function setMode(mode) {
    set(LS_MODE, mode);
    var dark = mode === 'dark' ? true : mode === 'light' ? false : systemDark();
    var isDark = document.documentElement.classList.contains('fp-dark');
    paint(mode);
    if (dark === isDark) { set(LS_DARK, dark ? '1' : '0'); if (dark) markLightCards(true); return; }
    flip(dark, booted);
  }

  function hideNatives() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) btns[i].style.setProperty('display', 'none', 'important');
    }
  }

  function build() {
    hideNatives();
    var existing = document.querySelectorAll('.fp-theme');
    if (existing.length) {
      for (var d = 1; d < existing.length; d++) { if (existing[d].parentNode) existing[d].parentNode.removeChild(existing[d]); }
      paint(get(LS_MODE) || 'system');
      return true;
    }
    var oldBtn = findThemeBtn();
    if (!oldBtn || !oldBtn.parentNode) return false;
    wrap = document.createElement('div');
    wrap.className = 'fp-theme';
    ['light', 'dark', 'system'].forEach(function (m) {
      var b = document.createElement('button');
      b.setAttribute('data-m', m);
      b.title = m.charAt(0).toUpperCase() + m.slice(1);
      b.innerHTML = icon(m);
      b.addEventListener('click', function () { setMode(m); });
      wrap.appendChild(b);
    });
    oldBtn.style.display = 'none';
    oldBtn.parentNode.insertBefore(wrap, oldBtn);
    setMode(get(LS_MODE) || 'system');
    return true;
  }

  function initMode() {
    var mode = get(LS_MODE);
    if (!mode) {
      mode = get(LS_DARK) === '1' ? 'dark' : (get(LS_DARK) === '0' ? 'light' : 'system');
      set(LS_MODE, mode);
    }
    setMode(mode);
    if (mq) {
      var onChange = function () { if (get(LS_MODE) === 'system') setMode('system'); };
      try { mq.addEventListener('change', onChange); } catch (e) { try { mq.addListener(onChange); } catch (e2) {} }
    }
  }

  function fastLang() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    var t0 = Date.now();
    var iv = setInterval(function () {
      try { if (window.FPSetLang) window.FPSetLang(lang); } catch (e) {}
      if (Date.now() - t0 > 1600) clearInterval(iv);
    }, 60);
  }

  // Supplementary Swahili for strings the app's main i18n dictionary misses across the
  // inner pages (subtitles, filter chips, report names, column headers, form labels).
  //   PHRASE_SW = distinctive multi-word strings, replaced as substrings (longest first).
  //   EXACT_SW  = short/ambiguous single words, replaced only when they are the WHOLE
  //               (trimmed) text node — so "All" never corrupts "Small", etc.
  var PHRASE_SW = [
    ['Manage customer profiles and activity', 'Simamia wasifu na shughuli za wateja'],
    ['Create a sale or payment for this customer', 'Tengeneza mauzo au malipo kwa mteja huyu'],
    ['Add a receipt or change the filters above.', 'Ongeza risiti au badilisha vichujio hapo juu.'],
    ['Try another period or status, or add a debtor.', 'Jaribu kipindi au hali nyingine, au ongeza mdaiwa.'],
    ['Search customer, receipt no. or related id', 'Tafuta mteja, namba ya risiti au kitambulisho'],
    ['Search order, customer, job or staff', 'Tafuta oda, mteja, kazi au mfanyakazi'],
    ['Search debtor by name or phone', 'Tafuta mdaiwa kwa jina au simu'],
    ['Monthly salary roster & payslips', 'Orodha ya mishahara ya mwezi'],
    ['Manual double-entry adjustments', 'Marekebisho ya kuingiza mara mbili'],
    ['Second Admin / Sales Manager', 'Msimamizi wa Pili / Meneja wa Mauzo'],
    ['Customer wise Profit & Loss', 'Faida/Hasara kwa Mteja'],
    ['Item Wise Profit & Loss', 'Faida/Hasara kwa Bidhaa'],
    ['Ledgers & account groups', 'Leja na makundi ya akaunti'],
    ['Customer payment receipts', 'Risiti za malipo ya wateja'],
    ['jobs move stage to stage', 'kazi zinapita hatua kwa hatua'],
    ['Debit / credit summary', 'Muhtasari wa deni / madai'],
    ['Shipping/Delivery Address', 'Anwani ya Kupeleka'],
    ['Daily sales & expenses', 'Mauzo na matumizi ya kila siku'],
    ['Low Stock Summary', 'Muhtasari wa Stock Ndogo'],
    ['Terms & Conditions', 'Masharti na Vigezo'],
    ['Track job progress', 'Fuatilia maendeleo ya kazi'],
    ['Delivery Details', 'Maelezo ya Usafirishaji'],
    ['Enter supplier name', 'Weka jina la muuzaji'],
    ['Enter customer name', 'Weka jina la mteja'],
    ['No transactions yet', 'Hakuna miamala bado'],
    ['Add Bank Account', 'Ongeza Akaunti ya Benki'],
    ['Billing Address', 'Anwani ya Bili'],
    ['Waiting to start', 'Zinasubiri kuanza'],
    ['Being worked on', 'Zinafanyiwa kazi'],
    ['Preview & Share', 'Hakiki & Sambaza'],
    ['Amount in Words', 'Kiasi kwa Maneno'],
    ['Invoice Number', 'Namba ya Ankara'],
    ['Invoice Date', 'Tarehe ya Ankara'],
    ['Balance Sheet', 'Karatasi ya Mizani'],
    ['Bill Wise Profit', 'Faida kwa Bili'],
    ['Stock Summary', 'Muhtasari wa Stock'],
    ['Stock Detail', 'Maelezo ya Stock'],
    ['Profit & Loss', 'Faida na Hasara'],
    ['All Customers', 'Wateja Wote'],
    ['Sales Manager', 'Meneja wa Mauzo'],
    ['Ready / done', 'Tayari / imekamilika'],
    ['Job Workflow', 'Mtiririko wa Kazi'],
    ['Phone Number', 'Namba ya Simu'],
    ['Add Customer', 'Ongeza Mteja'],
    ['Add Receipt', 'Ongeza Risiti'],
    ['Adjust Item', 'Rekebisha Bidhaa'],
    ['Out of Stock', 'Imeisha'],
    ['Bill Number', 'Namba ya Bili'],
    ['Bill Date', 'Tarehe ya Bili'],
    ['Cash Flow', 'Mtiririko wa Fedha'],
    ['Day Book', 'Daftari la Siku'],
    ['Sale Amount', 'Kiasi cha Mauzo'],
    ['Item / Stock', 'Bidhaa / Stock'],
    ['Price/Unit', 'Bei/Kipimo'],
    ['Bill To', 'Ankara Kwa']
  ];
  var EXACT_SW = {
    'All Time': 'Muda Wote', 'Custom': 'Maalum', 'All': 'Zote', 'Unpaid': 'Haijalipwa',
    'Partial': 'Kiasi', 'Overdue': 'Imepitwa', 'Category': 'Kategoria', 'Unit': 'Kipimo',
    'Admin': 'Msimamizi', 'Payment': 'Malipo', 'Email': 'Barua pepe', 'Balance': 'Salio',
    'Assigned': 'Amepewa', 'Transaction': 'Miamala', 'Statement': 'Taarifa',
    'Reputation manager': 'Meneja wa sifa'
  };
  function extraI18n() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    if (lang !== 'sw') return;
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n;
      while ((n = w.nextNode())) {
        var v = n.nodeValue; if (!v) continue;
        var t = v.trim(); if (!t || t.length > 70) continue;
        if (EXACT_SW[t] !== undefined) { n.nodeValue = v.replace(t, EXACT_SW[t]); continue; }
        var nv = v;
        for (var i = 0; i < PHRASE_SW.length; i++) {
          if (nv.indexOf(PHRASE_SW[i][0]) >= 0) nv = nv.split(PHRASE_SW[i][0]).join(PHRASE_SW[i][1]);
        }
        if (nv !== v) n.nodeValue = nv;
      }
    } catch (e) {}
  }

  // Keep the whole app in the saved language on a short cadence so navigating to a
  // new page (whose fresh English DOM the app's slow 2.5s i18n pass would otherwise
  // leave in English for a beat) is translated almost immediately.
  function keepLang() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    try { if (window.FPSetLang) window.FPSetLang(lang); } catch (e) {}
    extraI18n();
  }

  function boot() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    initMode();
    build();
    fastLang();
    extraI18n();
    setTimeout(function () { booted = true; }, 1200);
    setInterval(build, 1500);
    setInterval(keepLang, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
