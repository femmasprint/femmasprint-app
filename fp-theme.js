/* fp-theme.js — FemmasBot: Light / Dark / System theme control + language helper.
 * Drives the app's own toggle so darkMode state and the html.fp-dark class agree;
 * persistent CSS darkens the app's light surfaces so nothing flashes white on any
 * re-render; the CSS is injected the instant this (deferred) script runs — before the
 * app mounts on a reload — so even the sidebar can't flash light for a frame; and the
 * saved language is kept applied on a short cadence with a large supplementary Swahili
 * dictionary for inner-page labels the app's own i18n misses. */
(function () {
  var LS_MODE = 'fp_mode', LS_DARK = 'fp_dark';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    'html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
    /* Pin the sidebar to its dark colour so it can never flash light for a frame on a
       dark-mode reload (its dark bg is a state-driven inline style that paints a beat late). */
    'html.fp-dark aside{background:#13315a !important}' +
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

  // Inject the theme CSS IMMEDIATELY (synchronously, the moment this deferred script
  // executes — before the app mounts on a reload), not on DOMContentLoaded, so the dark
  // rules (especially the sidebar) are in place before the first paint. No flash.
  function injectCss() {
    if (document.getElementById('fpThemeCss')) return;
    var st = document.createElement('style'); st.id = 'fpThemeCss'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  injectCss();

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

  var PHRASE_SW = [
    ['Manage customer profiles and activity', 'Simamia wasifu na shughuli za wateja'],
    ['Create a sale or payment for this customer', 'Tengeneza mauzo au malipo kwa mteja huyu'],
    ['Add a receipt or change the filters above.', 'Ongeza risiti au badilisha vichujio hapo juu.'],
    ['Try another period or status, or add a debtor.', 'Jaribu kipindi au hali nyingine, au ongeza mdaiwa.'],
    ['Search customer, receipt no. or related id', 'Tafuta mteja, namba ya risiti au kitambulisho'],
    ['Search order, customer, job or staff', 'Tafuta oda, mteja, kazi au mfanyakazi'],
    ['Search debtor by name or phone', 'Tafuta mdaiwa kwa jina au simu'],
    ['Search Customer Name', 'Tafuta Jina la Mteja'],
    ['Search Item by Name', 'Tafuta Bidhaa kwa Jina'],
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
      var ins = document.querySelectorAll('input[placeholder],textarea[placeholder]');
      for (var k = 0; k < ins.length; k++) {
        var p = ins[k].getAttribute('placeholder'); if (!p || p.length > 70) continue;
        var pt = p.trim(); if (!pt) continue;
        var np = p;
        if (EXACT_SW[pt] !== undefined) np = p.replace(pt, EXACT_SW[pt]);
        else { for (var q = 0; q < PHRASE_SW.length; q++) { if (np.indexOf(PHRASE_SW[q][0]) >= 0) np = np.split(PHRASE_SW[q][0]).join(PHRASE_SW[q][1]); } }
        if (np !== p) ins[k].setAttribute('placeholder', np);
      }
    } catch (e) {}
  }

  function keepLang() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    try { if (window.FPSetLang) window.FPSetLang(lang); } catch (e) {}
    extraI18n();
  }

  function boot() {
    injectCss();
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


/* FEMMAS APP V3 BRAND THEME
 * Global tactile/neumorphic presentation layer for the real FEMMAS PRINT app.
 * Visual-only: preserves routes, handlers, API calls, permissions, stored data and invoice templates.
 */
(function () {
  "use strict";

  var STYLE_ID = "fp-v3-brand-theme";
  var LOGO_SRC = "./femmas-logo-03-mqrt99vq.png";
  var css = [
    ":root{",
      "--fp-logo-navy:#13315A;",
      "--fp-logo-blue:#3399FF;",
      "--fp-brand-gradient:linear-gradient(135deg,#13315A 0%,#1D568F 52%,#3399FF 100%);",
      "--fp-page:#EEF3F8;",
      "--fp-surface:#F4F7FA;",
      "--fp-surface-strong:#FFFFFF;",
      "--fp-surface-soft:#E9EFF5;",
      "--fp-text:#15233A;",
      "--fp-muted:#6F8098;",
      "--fp-line:rgba(19,49,90,.12);",
      "--fp-shadow-raised:9px 9px 22px rgba(19,49,90,.11),-9px -9px 22px rgba(255,255,255,.92);",
      "--fp-shadow-soft:5px 5px 14px rgba(19,49,90,.10),-5px -5px 14px rgba(255,255,255,.88);",
      "--fp-shadow-inset:inset 4px 4px 10px rgba(19,49,90,.10),inset -4px -4px 10px rgba(255,255,255,.86);",
      "--fp-focus:0 0 0 3px rgba(51,153,255,.24);",
    "}",
    "html.fp-dark{",
      "--fp-page:#071526;",
      "--fp-surface:#0D1E33;",
      "--fp-surface-strong:#122844;",
      "--fp-surface-soft:#10243D;",
      "--fp-text:#F4F8FD;",
      "--fp-muted:#A9BAD0;",
      "--fp-line:rgba(151,190,235,.15);",
      "--fp-shadow-raised:9px 9px 22px rgba(0,5,14,.48),-7px -7px 20px rgba(39,72,108,.22);",
      "--fp-shadow-soft:5px 5px 14px rgba(0,5,14,.42),-4px -4px 13px rgba(39,72,108,.18);",
      "--fp-shadow-inset:inset 4px 4px 10px rgba(0,5,14,.48),inset -4px -4px 10px rgba(42,78,117,.19);",
      "--fp-focus:0 0 0 3px rgba(51,153,255,.34);",
    "}",

    "html,body{background:var(--fp-page)!important;color:var(--fp-text)!important;}",
    "body>div[style*='min-height:100vh'],#fp-main{background:var(--fp-page)!important;color:var(--fp-text)!important;transition:background .25s ease,color .25s ease;}",
    "#fp-main{min-width:0!important;overflow-x:hidden!important;}",

    "aside.fp-v3-sidebar{background:linear-gradient(180deg,#102A4D 0%,#13315A 64%,#0D2748 100%)!important;border-right:1px solid rgba(51,153,255,.18)!important;box-shadow:12px 0 30px rgba(7,21,38,.14)!important;}",
    "aside.fp-v3-sidebar img[src*='femmas-logo']{display:block!important;opacity:1!important;visibility:visible!important;object-fit:contain!important;}",
    "aside.fp-v3-sidebar a,aside.fp-v3-sidebar button{transition:background .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease;}",
    "aside.fp-v3-sidebar a:hover,aside.fp-v3-sidebar button:hover{background:rgba(51,153,255,.13)!important;color:#fff!important;transform:translateX(2px);}",
    "aside.fp-v3-sidebar .fp-v3-active,aside.fp-v3-sidebar [aria-current='page']{background:var(--fp-brand-gradient)!important;color:#fff!important;box-shadow:0 8px 20px rgba(51,153,255,.25)!important;}",

    "#fp-main>[data-topbanner='1']{background:#13315A!important;color:#DCEAFF!important;border-bottom:1px solid rgba(51,153,255,.28)!important;min-height:34px!important;height:auto!important;overflow:visible!important;line-height:1.35!important;}",
    "#fp-main>.fp-v3-topbar{background:var(--fp-brand-gradient)!important;color:#fff!important;border:0!important;box-shadow:0 12px 30px rgba(19,49,90,.22)!important;min-height:74px!important;height:auto!important;overflow:visible!important;line-height:normal!important;padding-top:11px!important;padding-bottom:11px!important;flex-wrap:wrap!important;}",
    "#fp-main>.fp-v3-topbar *{text-overflow:clip;}",
    "#fp-main>.fp-v3-topbar h1,#fp-main>.fp-v3-topbar h2,#fp-main>.fp-v3-topbar h3,#fp-main>.fp-v3-topbar span,#fp-main>.fp-v3-topbar p{line-height:1.25!important;overflow:visible!important;}",
    "#fp-main>.fp-v3-topbar input{background:rgba(255,255,255,.94)!important;color:#13315A!important;border:1px solid rgba(255,255,255,.58)!important;box-shadow:inset 2px 2px 7px rgba(19,49,90,.10),0 5px 14px rgba(7,21,38,.12)!important;}",
    "#fp-main>.fp-v3-topbar input::placeholder{color:#7588A2!important;}",
    "#fp-main>.fp-v3-topbar button,#fp-main>.fp-v3-topbar a{color:#fff;}",

    "#fp-main :is(input:not([type='checkbox']):not([type='radio']),select,textarea){background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:12px!important;box-shadow:var(--fp-shadow-inset)!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;}",
    "#fp-main :is(input,select,textarea):focus{border-color:#3399FF!important;outline:none!important;box-shadow:var(--fp-shadow-inset),var(--fp-focus)!important;}",
    "#fp-main :is(input,textarea)::placeholder{color:var(--fp-muted)!important;opacity:.88;}",
    "#fp-main label{color:var(--fp-text);}",
    "#fp-main small,#fp-main [style*='color:#94a3b8'],#fp-main [style*='color: #94a3b8']{color:var(--fp-muted)!important;}",

    "#fp-main button,#fp-main [role='button']{border-radius:12px;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;}",
    "#fp-main button:hover,#fp-main [role='button']:hover{filter:brightness(1.035);}",
    "#fp-main button:active,#fp-main [role='button']:active{transform:translateY(1px) scale(.985);box-shadow:var(--fp-shadow-inset)!important;}",
    "#fp-main .fp-v3-primary,#fp-main button[data-primary='1'],#fp-main button[style*='background:#008ece'],#fp-main button[style*='background: #008ece'],#fp-main a[style*='background:#008ece']{background:var(--fp-brand-gradient)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 20px rgba(51,153,255,.24)!important;}",
    "#fp-main button[disabled],#fp-main [aria-disabled='true']{opacity:.58!important;filter:saturate(.65);cursor:not-allowed!important;}",

    "#fp-main :is(section,article,form,[role='dialog'])[style*='background:#fff'],#fp-main :is(section,article,form,[role='dialog'])[style*='background: #fff'],#fp-main :is(section,article,form,[role='dialog'])[style*='background:white']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:var(--fp-shadow-raised)!important;}",
    "#fp-main [data-widget-col],#fp-main .fp-v3-card{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;box-shadow:var(--fp-shadow-raised)!important;}",
    "#fp-main [style*='background:#fff'][style*='border-radius:16px'],#fp-main [style*='background: #fff'][style*='border-radius:16px'],#fp-main [style*='background:#ffffff'][style*='border-radius:16px'],#fp-main [style*='background:#fff'][style*='border-radius:18px'],#fp-main [style*='background:#fff'][style*='border-radius:20px']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:var(--fp-shadow-soft)!important;}",
    "#fp-main table{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-radius:16px!important;overflow:hidden!important;border-collapse:separate!important;border-spacing:0!important;box-shadow:var(--fp-shadow-soft)!important;}",
    "#fp-main th{background:rgba(19,49,90,.07)!important;color:#13315A!important;border-color:var(--fp-line)!important;}",
    "html.fp-dark #fp-main th{background:rgba(51,153,255,.10)!important;color:#DCEAFF!important;}",
    "#fp-main td{color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",
    "#fp-main tr:hover td{background:rgba(51,153,255,.055)!important;}",

    "#fp-main [role='dialog'],#fp-main .modal,#fp-main [class*='modal']{color:var(--fp-text)!important;}",
    "#fp-main [role='dialog']>div,#fp-main .modal>div,#fp-main [class*='modal-content']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 24px 70px rgba(7,21,38,.32)!important;}",
    "html.fp-dark #fp-main [style*='background:#fff'],html.fp-dark #fp-main [style*='background: #fff'],html.fp-dark #fp-main [style*='background:#ffffff'],html.fp-dark #fp-main [style*='background: white']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",
    "html.fp-dark #fp-main [style*='color:#1F2937'],html.fp-dark #fp-main [style*='color:#111827'],html.fp-dark #fp-main [style*='color:#0f172a'],html.fp-dark #fp-main [style*='color: #1F2937']{color:var(--fp-text)!important;}",

    ".fp-lang-switch{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;min-width:62px!important;height:40px!important;padding:0 11px!important;border:1px solid rgba(255,255,255,.42)!important;border-radius:12px!important;background:rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.30),0 6px 15px rgba(7,21,38,.14)!important;backdrop-filter:blur(9px);font-weight:800!important;cursor:pointer!important;}",
    ".fp-lang-switch svg{width:17px;height:17px;stroke:currentColor;flex:none;}",
    ".fp-lang-switch:focus-visible{outline:none;box-shadow:var(--fp-focus),0 6px 15px rgba(7,21,38,.18)!important;}",

    ".fb-logo{background-image:url('./femmas-logo-03-mqrt99vq.png')!important;background-color:#fff!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;}",
    ".fb-launcher,.fb-send,.fb-primary{background:var(--fp-brand-gradient)!important;box-shadow:0 10px 26px rgba(51,153,255,.28)!important;}",
    ".fb-panel,.fb-window,.fb-card{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 22px 58px rgba(7,21,38,.30)!important;}",
    ".fb-input,.fb-panel input,.fb-panel textarea{background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:var(--fp-shadow-inset)!important;}",

    "#fp-main .invoice-preview,#fp-main [class*='invoice-preview'],#fp-main [data-invoice-template],#fp-main .print-area{box-shadow:none!important;}",
    "@media print{.fp-lang-switch,.fp-theme,.fb-launcher,.fb-panel{display:none!important;}#fp-main .invoice-preview,#fp-main [data-invoice-template],#fp-main .print-area{background:#fff!important;color:#111!important;box-shadow:none!important;}}",

    "@keyframes fpV3CardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
    "@keyframes fpV3CountPulse{0%{transform:translateY(2px);opacity:.65}100%{transform:translateY(0);opacity:1}}",
    "#fp-main .fp-v3-enter{animation:fpV3CardIn .42s cubic-bezier(.2,.75,.3,1) both;}",
    "#fp-main .fp-v3-counted{animation:fpV3CountPulse .34s ease both;}",

    "@media(max-width:900px){",
      "#fp-main>.fp-v3-topbar{padding-left:14px!important;padding-right:14px!important;min-height:68px!important;gap:8px!important;}",
      "#fp-main>.fp-v3-topbar>div:first-child{min-width:180px;max-width:none!important;flex:1 1 240px!important;}",
      ".fp-lang-switch{height:38px!important;min-width:58px!important;padding:0 9px!important;}",
    "}",
    "@media(max-width:600px){",
      "#fp-main>.fp-v3-topbar{top:34px!important;padding:9px 10px!important;}",
      "#fp-main>.fp-v3-topbar>div:first-child{order:2;flex-basis:100%!important;width:100%!important;}",
      "#fp-main>.fp-v3-topbar input{width:100%!important;}",
      "#fp-main table{display:block!important;max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch;}",
      "#fp-main :is(input,select,textarea){max-width:100%!important;}",
    "}",
    "@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important;}}"
  ].join("");

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureRealLogo() {
    var aside = document.querySelector("aside");
    if (!aside) return;
    aside.classList.add("fp-v3-sidebar");
    var logo = aside.querySelector("img[src*='femmas-logo']");
    if (!logo) {
      var host = aside.querySelector("div");
      if (!host) return;
      logo = document.createElement("img");
      logo.src = LOGO_SRC;
      logo.alt = "Femmas Print";
      logo.setAttribute("data-fp-real-logo", "1");
      logo.style.cssText = "display:block;width:40px;height:40px;object-fit:contain;flex:none;";
      host.insertBefore(logo, host.firstChild);
    }
    logo.style.display = "block";
    logo.style.opacity = "1";
    logo.style.visibility = "visible";
  }

  function markStructure() {
    var main = document.getElementById("fp-main");
    if (!main) return;
    var headers = main.querySelectorAll(":scope > header");
    for (var i = 0; i < headers.length; i++) headers[i].classList.add("fp-v3-topbar");

    var navItems = document.querySelectorAll("aside a,aside button");
    for (var n = 0; n < navItems.length; n++) {
      var item = navItems[n];
      var style = (item.getAttribute("style") || "").toLowerCase();
      if (item.getAttribute("aria-current") === "page" || style.indexOf("#008ece") > -1 || style.indexOf("51,153,255") > -1 || style.indexOf("46,144,240") > -1) {
        item.classList.add("fp-v3-active");
      } else {
        item.classList.remove("fp-v3-active");
      }
    }

    var likelyCards = main.querySelectorAll("[data-widget-col],section[style*='border-radius'],article[style*='border-radius']");
    for (var c = 0; c < likelyCards.length; c++) {
      likelyCards[c].classList.add("fp-v3-enter");
    }

    var primary = main.querySelectorAll("button");
    for (var p = 0; p < primary.length; p++) {
      var label = (primary[p].textContent || "").trim().toLowerCase();
      if (/^(\+?\s*(sale|purchase|quick sale|new|add|save|submit|create|mauzo|manunuzi|hifadhi|ongeza))\b/.test(label)) {
        primary[p].classList.add("fp-v3-primary");
      }
    }
  }

  function ensureLanguageSwitch() {
    var main = document.getElementById("fp-main");
    if (!main) return;
    var topbar = main.querySelector(":scope > header");
    if (!topbar || topbar.querySelector(".fp-lang-switch")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "fp-lang-switch";
    button.setAttribute("aria-label", "Badili lugha / Switch language");
    button.title = "Badili lugha / Switch language";
    var lang = "sw";
    try { lang = localStorage.getItem("fp_lang") || "sw"; } catch (e) {}
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></svg>' +
      '<span>' + (lang === "sw" ? "SW" : "EN") + "</span>";
    button.addEventListener("click", function () {
      var current = "sw";
      try { current = localStorage.getItem("fp_lang") || "sw"; } catch (e) {}
      var next = current === "sw" ? "en" : "sw";
      try { localStorage.setItem("fp_lang", next); } catch (e) {}
      if (typeof window.FPSetLang === "function") window.FPSetLang(next);
      button.querySelector("span").textContent = next === "sw" ? "SW" : "EN";
      window.setTimeout(function () { window.location.reload(); }, 90);
    });

    var theme = topbar.querySelector(".fp-theme");
    if (theme) topbar.insertBefore(button, theme);
    else topbar.appendChild(button);
  }

  function animateRealNumbers() {
    var main = document.getElementById("fp-main");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var nodes = main.querySelectorAll(
      "[data-kpi-value],[style*='font-size:25px'],[style*='font-size: 25px'],[style*='font-size:28px'],[style*='font-size: 28px'],[style*='font-size:32px'],[style*='font-size: 32px']"
    );
    for (var i = 0; i < nodes.length; i++) {
      (function (el) {
        if (el.dataset.fpCounted === "1" || el.children.length) return;
        var raw = (el.textContent || "").trim();
        var match = raw.match(/-?[\d,.]+/);
        if (!match) return;
        var target = Number(match[0].replace(/,/g, ""));
        if (!isFinite(target) || Math.abs(target) < 2) return;
        el.dataset.fpCounted = "1";
        var decimals = (match[0].split(".")[1] || "").length;
        var startAt = performance.now();
        var duration = 650;
        function tick(now) {
          var t = Math.min(1, (now - startAt) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          var value = target * eased;
          var rendered = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
          el.textContent = raw.replace(match[0], rendered);
          if (t < 1) requestAnimationFrame(tick);
          else {
            el.textContent = raw;
            el.classList.add("fp-v3-counted");
          }
        }
        requestAnimationFrame(tick);
      })(nodes[i]);
    }
  }

  function enhance() {
    addStyles();
    ensureRealLogo();
    markStructure();
    ensureLanguageSwitch();
    animateRealNumbers();
  }

  var scheduled = false;
  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      enhance();
    });
  }

  function boot() {
    enhance();
    var observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", scheduleEnhance);
    window.addEventListener("popstate", scheduleEnhance);
    setInterval(enhance, 2200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();


/* FEMMAS APP V3 PRINT AND TOPBAR GUARD
 * Keeps existing printable invoice documents visually untouched and prevents
 * compact top rows from clipping text in either language.
 */
(function () {
  var id = "fp-v3-print-topbar-guard";
  if (document.getElementById(id)) return;
  var style = document.createElement("style");
  style.id = id;
  style.textContent = [
    "#fp-main>[data-topbanner='1'],#fp-main>[data-topbanner='1'] *{line-height:1.4!important;max-height:none!important;overflow:visible!important;}",
    "#fp-main>.fp-v3-topbar{max-height:none!important;}",
    "#fp-main>.fp-v3-topbar :is(h1,h2,h3,p,[data-title]){white-space:normal!important;max-height:none!important;overflow:visible!important;padding-top:1px!important;padding-bottom:1px!important;}",

    "#fp-main .fp-printable{background:#fff!important;color:#111827!important;box-shadow:none!important;}",
    "html.fp-dark #fp-main .fp-printable{background:#fff!important;color:#111827!important;}",
    "html.fp-dark #fp-main .fp-printable [style*='background:#fff'],html.fp-dark #fp-main .fp-printable [style*='background: #fff'],html.fp-dark #fp-main .fp-printable [style*='background:#ffffff']{background:#fff!important;}",
    "html.fp-dark #fp-main .fp-printable [style*='color:#1F2937'],html.fp-dark #fp-main .fp-printable [style*='color:#111827'],html.fp-dark #fp-main .fp-printable [style*='color:#0f172a']{color:#111827!important;}",
    "#fp-main .fp-printable table{background:#fff!important;color:#111827!important;box-shadow:none!important;border-radius:0!important;}",
    "#fp-main .fp-printable th,#fp-main .fp-printable td{color:#111827!important;background:transparent!important;}",

    "@media print{",
      "html,body,#fp-main{background:#fff!important;color:#111827!important;}",
      "#fp-main .fp-printable,#fp-main .fp-printable *{text-shadow:none!important;filter:none!important;}",
      "#fp-main .fp-printable{background:#fff!important;color:#111827!important;border-radius:0!important;box-shadow:none!important;}",
      "#fp-main .fp-printable :is(input,select,textarea){background:transparent!important;color:#111827!important;border:none!important;border-radius:0!important;box-shadow:none!important;}",
      "#fp-main .fp-printable table{display:table!important;background:#fff!important;color:#111827!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important;}",
      "#fp-main .fp-printable thead{display:table-header-group!important;}",
      "#fp-main .fp-printable tbody{display:table-row-group!important;}",
      "#fp-main .fp-printable tr{display:table-row!important;}",
      "#fp-main .fp-printable th,#fp-main .fp-printable td{display:table-cell!important;background:transparent!important;color:#111827!important;}",
    "}"
  ].join("");
  document.head.appendChild(style);
})();


/* FEMMAS APP V3 INVOICE LIST SKIN
 * Brings the live Sales Invoices list overlay into the same logo-led theme.
 * The A4 document surface (#fpSheet / #fpPrintArea) is deliberately excluded.
 */
(function () {
  "use strict";
  var STYLE_ID = "fp-v3-invoice-list-skin";
  var css = [
    "#fpSkin{background:var(--fp-page)!important;color:var(--fp-text)!important;font-family:'Plus Jakarta Sans',system-ui,sans-serif!important;}",
    "#fpSkin>div:first-child{position:sticky!important;top:0!important;z-index:15!important;min-height:62px!important;height:auto!important;overflow:visible!important;flex-wrap:wrap!important;background:var(--fp-brand-gradient)!important;color:#fff!important;border-bottom:0!important;box-shadow:0 12px 30px rgba(19,49,90,.22)!important;}",
    "#fpSkin>div:first-child>div:first-child{background:rgba(255,255,255,.94)!important;border:1px solid rgba(255,255,255,.45)!important;box-shadow:inset 2px 2px 7px rgba(19,49,90,.10),0 5px 14px rgba(7,21,38,.13)!important;}",
    "#fpSkin #fpSearch{background:transparent!important;color:#13315A!important;box-shadow:none!important;border:none!important;}",
    "#fpSkin #fpSearch::placeholder{color:#71839B!important;}",
    "#fpSkin .fpAdd,#fpSkin .fpAddP{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:7px 14px!important;border:1px solid rgba(255,255,255,.42)!important;border-radius:999px!important;background:rgba(255,255,255,.15)!important;color:#fff!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.28),0 6px 15px rgba(7,21,38,.14)!important;backdrop-filter:blur(8px);}",
    "#fpSkin>div:not(:first-child) .fpAdd,#fpSkin>div:not(:first-child) .fpAddP{background:var(--fp-brand-gradient)!important;border-color:transparent!important;color:#fff!important;box-shadow:0 8px 20px rgba(51,153,255,.24)!important;}",
    "#fpSkin .fpAddPlus{background:rgba(255,255,255,.16)!important;color:#fff!important;border:1px solid rgba(255,255,255,.38)!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.26)!important;}",
    "#fpSkin .fpPrintList,#fpSkin .fpTopMenu{color:#fff!important;}",
    "#fpSkin .fpPrintList svg{stroke:currentColor!important;}",
    "#fpSkin .fpTopMenu>svg[fill]{fill:currentColor!important;}",
    "#fpSkin .fpTopMenu>svg[stroke]{stroke:currentColor!important;}",

    "#fpSkin .fpTitleSwitch{color:var(--fp-text)!important;}",
    "#fpSkin #fpTotInner,#fpSkin #fpTableWrap{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:16px!important;box-shadow:var(--fp-shadow-raised)!important;}",
    "#fpSkin #fpTotInner{padding:15px!important;}",
    "#fpSkin #fpTableWrap{overflow:auto!important;}",
    "#fpSkin #fpTableWrap table{width:100%!important;background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-collapse:separate!important;border-spacing:0!important;}",
    "#fpSkin #fpTableWrap thead,#fpSkin #fpTableWrap th{background:rgba(19,49,90,.075)!important;color:#13315A!important;border-color:var(--fp-line)!important;}",
    "#fpSkin #fpTableWrap td{background:transparent!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",
    "#fpSkin #fpTableWrap tr:hover td{background:rgba(51,153,255,.06)!important;}",
    "#fpSkin :is(.fpSort,.fpr,.fpPeriod,.fpCal,.fpFirms,.fpUsers,.fpClear,.fpFocusSearch,.fpChart,.fpXls,.fpbtn){background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;border-radius:12px!important;box-shadow:var(--fp-shadow-soft)!important;}",
    "#fpSkin :is(.fpPrint,.fpShare){background:var(--fp-brand-gradient)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 20px rgba(51,153,255,.24)!important;}",
    "#fpSkin :is(.fpmm,.fpmi){background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 18px 45px rgba(7,21,38,.25)!important;}",
    "#fpSkin :is(input,select,textarea){background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:11px!important;box-shadow:var(--fp-shadow-inset)!important;}",
    "#fpSkin :is(input,select,textarea):focus{border-color:#3399FF!important;outline:none!important;box-shadow:var(--fp-shadow-inset),var(--fp-focus)!important;}",

    "html.fp-dark #fpSkin #fpTableWrap thead,html.fp-dark #fpSkin #fpTableWrap th{background:rgba(51,153,255,.11)!important;color:#DCEAFF!important;}",
    "html.fp-dark #fpSkin [style*='color:#1f2733'],html.fp-dark #fpSkin [style*='color:#334155'],html.fp-dark #fpSkin [style*='color:#0f172a']{color:var(--fp-text)!important;}",
    "html.fp-dark #fpSkin [style*='background:#fff'],html.fp-dark #fpSkin [style*='background: #fff'],html.fp-dark #fpSkin [style*='background:#f4f6f9'],html.fp-dark #fpSkin [style*='background:#f1f5f9'],html.fp-dark #fpSkin [style*='background:#eef2f7']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",

    "#fpSkin #fpSheet{background:#fff!important;color:#1F2733!important;}",
    "html.fp-dark #fpSkin #fpSheet{background:#fff!important;color:#1F2733!important;}",
    "html.fp-dark #fpSkin #fpSheet [style*='background:#fff'],html.fp-dark #fpSkin #fpSheet [style*='background: #fff']{background:#fff!important;}",
    "html.fp-dark #fpSkin #fpSheet [style*='color:#1f2733'],html.fp-dark #fpSkin #fpSheet [style*='color:#334155'],html.fp-dark #fpSkin #fpSheet [style*='color:#0f172a']{color:#1F2733!important;}",
    "#fpPrintArea,#fpPrintArea #fpSheet{background:#fff!important;color:#1F2733!important;box-shadow:none!important;}",

    ".fp-skin-utility{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;height:34px!important;min-width:38px!important;padding:0 9px!important;border:1px solid rgba(255,255,255,.40)!important;border-radius:11px!important;background:rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.28),0 6px 15px rgba(7,21,38,.14)!important;cursor:pointer!important;backdrop-filter:blur(8px);font:800 11px system-ui,sans-serif!important;}",
    ".fp-skin-utility svg{width:16px;height:16px;stroke:currentColor;fill:none;flex:none;}",

    "@media(max-width:700px){",
      "#fpSkin>div:first-child{padding:9px 10px!important;gap:7px!important;}",
      "#fpSkin>div:first-child>div:first-child{order:2!important;flex:1 0 100%!important;max-width:none!important;width:100%!important;}",
      "#fpSkin>div:first-child>div:nth-child(2){display:none!important;}",
      "#fpSkin .fpAdd,#fpSkin .fpAddP{font-size:11px!important;padding:6px 10px!important;}",
      "#fpSkin #fpTableWrap{max-width:100%!important;-webkit-overflow-scrolling:touch;}",
    "}",
    "@media print{#fpSkin{display:none!important;}#fpPrintArea,#fpPrintArea #fpSheet{display:block!important;background:#fff!important;color:#1F2733!important;box-shadow:none!important;}}"
  ].join("");

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function globeIcon() {
    return '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></svg>';
  }

  function themeIcon() {
    return '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.3 8.3 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"></path></svg>';
  }

  function addSkinControls() {
    var skin = document.getElementById("fpSkin");
    if (!skin) return;
    var toolbar = skin.firstElementChild;
    if (!toolbar) return;

    if (!toolbar.querySelector(".fp-skin-lang")) {
      var langButton = document.createElement("button");
      langButton.type = "button";
      langButton.className = "fp-skin-utility fp-skin-lang";
      var lang = "sw";
      try { lang = localStorage.getItem("fp_lang") || "sw"; } catch (e) {}
      langButton.innerHTML = globeIcon() + "<span>" + (lang === "sw" ? "SW" : "EN") + "</span>";
      langButton.title = "Badili lugha / Switch language";
      langButton.setAttribute("aria-label", langButton.title);
      langButton.addEventListener("click", function () {
        var current = "sw";
        try { current = localStorage.getItem("fp_lang") || "sw"; } catch (e) {}
        var next = current === "sw" ? "en" : "sw";
        try { localStorage.setItem("fp_lang", next); } catch (e) {}
        if (typeof window.FPSetLang === "function") window.FPSetLang(next);
        window.setTimeout(function () { window.location.reload(); }, 90);
      });
      var printButton = toolbar.querySelector(".fpPrintList");
      toolbar.insertBefore(langButton, printButton || null);
    }

    if (!toolbar.querySelector(".fp-skin-theme")) {
      var themeButton = document.createElement("button");
      themeButton.type = "button";
      themeButton.className = "fp-skin-utility fp-skin-theme";
      themeButton.innerHTML = themeIcon();
      themeButton.title = "Mwanga / Giza";
      themeButton.setAttribute("aria-label", themeButton.title);
      themeButton.addEventListener("click", function () {
        var next = document.documentElement.classList.contains("fp-dark") ? "light" : "dark";
        var nativeControl = document.querySelector('.fp-theme button[data-m="' + next + '"]');
        if (nativeControl) nativeControl.click();
        else {
          try {
            localStorage.setItem("fp_mode", next);
            localStorage.setItem("fp_dark", next === "dark" ? "1" : "0");
          } catch (e) {}
          document.documentElement.classList.toggle("fp-dark", next === "dark");
        }
      });
      var printList = toolbar.querySelector(".fpPrintList");
      toolbar.insertBefore(themeButton, printList || null);
    }
  }

  function boot() {
    injectStyles();
    addSkinControls();
    new MutationObserver(function () { requestAnimationFrame(addSkinControls); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setInterval(addSkinControls, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();


/* FEMMAS APP V3 INVOICE LANGUAGE GUARD
 * Keeps the separately-mounted live invoice list entirely in the selected
 * language. Business data, customer names and document contents are untouched.
 */
(function () {
  "use strict";
  var pairs = [
    ["Search Transactions","Tafuta Miamala"],
    ["Add Sale","Mauzo"],
    ["Add Purchase","Manunuzi"],
    ["Add More","Ongeza Zaidi"],
    ["Sale Invoices","Ankara za Mauzo"],
    ["Filter by :","Chuja kwa:"],
    ["Filter by:","Chuja kwa:"],
    ["To","Hadi"],
    ["All Firms","Biashara Zote"],
    ["All Users","Watumiaji Wote"],
    ["Clear","Futa"],
    ["Transactions","Miamala"],
    ["Total Sales Amount","Jumla ya Mauzo"],
    ["Received","Imepokelewa"],
    ["Balance","Salio"],
    ["Date","Tarehe"],
    ["Invoice no","Namba ya Ankara"],
    ["Party Name","Jina la Mteja"],
    ["Transaction","Muamala"],
    ["Payment Type","Aina ya Malipo"],
    ["Amount","Kiasi"],
    ["Status","Hali"],
    ["Actions","Vitendo"],
    ["Print","Chapa"],
    ["Share","Sambaza"],
    ["More Actions","Vitendo Zaidi"],
    ["Sort","Panga"],
    ["Summary","Muhtasari"],
    ["Refresh","Onyesha upya"],
    ["Export Excel (CSV)","Pakua Excel (CSV)"],
    ["Print list","Chapa orodha"],
    ["Today","Leo"],
    ["This Month","Mwezi Huu"],
    ["Last Month","Mwezi Uliopita"],
    ["This Quarter","Robo Hii"],
    ["This Year","Mwaka Huu"],
    ["All Sale Invoices","Ankara Zote za Mauzo"],
    ["All","Zote"],
    ["Choose period","Chagua kipindi"],
    ["Open calendar","Fungua kalenda"],
    ["Filter by firm","Chuja kwa biashara"],
    ["Filter by user","Chuja kwa mtumiaji"],
    ["Remove filters","Ondoa vichujio"],
    ["Change type","Badilisha aina"],
    ["Paid","Imelipwa"],
    ["Unpaid","Haijalipwa"],
    ["Cash","Taslimu"],
    ["Sale","Mauzo"]
  ];

  function maps() {
    var sw = {}, en = {};
    for (var i = 0; i < pairs.length; i++) {
      sw[pairs[i][0]] = pairs[i][1];
      en[pairs[i][1]] = pairs[i][0];
    }
    return { sw: sw, en: en };
  }

  function selectedLanguage() {
    try { return localStorage.getItem("fp_lang") || "sw"; } catch (e) { return "sw"; }
  }

  function translateValue(raw, map, lang) {
    if (!raw) return raw;
    var trimmed = raw.replace(/\s+/g, " ").trim();
    var plus = "";
    var core = trimmed;
    if (core.charAt(0) === "+") { plus = "+ "; core = core.slice(1).trim(); }
    if (map[core] !== undefined) return raw.replace(trimmed, plus + map[core]);

    var output = raw;
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      if (output.indexOf(keys[i]) > -1) output = output.split(keys[i]).join(map[keys[i]]);
    }

    if (lang === "sw") {
      output = output.replace(/Panga\s*\(sort\)/gi, "Panga");
      output = output.replace(/Leo\s*\(Today\)/gi, "Leo");
      output = output.replace(/Zimeonyeshwa\s+invoice\s+(\d+)\s+kati\s+ya\s+jumla\s+(\d+)\s*·\s*bonyeza\s+kichwa\s+cha\s+safu\s+Panga/gi,
        "Zimeonyeshwa ankara $1 kati ya jumla $2 · bonyeza kichwa cha safu kupanga");
    } else {
      output = output.replace(/Leo\s*\(Today\)/gi, "Today");
      output = output.replace(/Zimeonyeshwa\s+(?:invoice|ankara)\s+(\d+)\s+kati\s+ya\s+jumla\s+(\d+)\s*·\s*bonyeza\s+kichwa\s+cha\s+safu\s+(?:kupanga|Panga(?:\s*\(sort\))?)/gi,
        "Showing $1 invoices out of $2 · click a column heading to sort");
    }
    return output;
  }

  function applyInvoiceLanguage() {
    var skin = document.getElementById("fpSkin");
    if (!skin) return;
    var lang = selectedLanguage();
    var all = maps();
    var map = lang === "sw" ? all.sw : all.en;

    try {
      var walker = document.createTreeWalker(skin, NodeFilter.SHOW_TEXT, null, false);
      var node, nodes = [];
      while ((node = walker.nextNode())) nodes.push(node);
      for (var i = 0; i < nodes.length; i++) {
        var current = nodes[i].nodeValue;
        var translated = translateValue(current, map, lang);
        if (translated !== current) nodes[i].nodeValue = translated;
      }

      var attrs = skin.querySelectorAll("[placeholder],[title],[aria-label]");
      for (var a = 0; a < attrs.length; a++) {
        ["placeholder","title","aria-label"].forEach(function (name) {
          var value = attrs[a].getAttribute(name);
          if (!value) return;
          var translated = translateValue(value, map, lang);
          if (translated !== value) attrs[a].setAttribute(name, translated);
        });
      }
    } catch (e) {}
  }

  function boot() {
    applyInvoiceLanguage();
    new MutationObserver(function () { requestAnimationFrame(applyInvoiceLanguage); })
      .observe(document.documentElement, { childList: true, subtree: true });
    setInterval(applyInvoiceLanguage, 850);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
