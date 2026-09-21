/* fp-theme.js — FEMMAS APP light-only Base44 visual bridge.
 * Dark mode is intentionally removed. Real app data, routes, permissions and handlers stay unchanged.
 */
(function () {
  "use strict";

  var LIGHT_CSS =
    "html{color-scheme:light!important;background:#F6F8FA!important}" +
    "body{background:#F6F8FA!important}" +
    ".fp-theme,.fp-skin-theme,button[title*='Light / Dark'],button[title*='Mwanga / Giza']," +
    "button[aria-label*='Light / Dark'],button[aria-label*='Mwanga / Giza']{display:none!important}";

  function injectLightCss() {
    if (document.getElementById("fp-light-only")) return;
    var st = document.createElement("style");
    st.id = "fp-light-only";
    st.textContent = LIGHT_CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function forceLightOnly() {
    document.documentElement.classList.remove("fp-dark");
    try {
      localStorage.setItem("fp_mode", "light");
      localStorage.setItem("fp_dark", "0");
    } catch (e) {}

    var buttons = document.querySelectorAll("button,[role='button']");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var title = ((b.getAttribute("title") || "") + " " + (b.getAttribute("aria-label") || "")).toLowerCase();
      var label = (b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(title) ||
          /^(dark mode|light mode|system theme|giza|mwanga)$/.test(label)) {
        b.style.setProperty("display", "none", "important");
        b.setAttribute("aria-hidden", "true");
        b.tabIndex = -1;
      }
    }

    var generated = document.querySelectorAll(".fp-theme,.fp-skin-theme");
    for (var j = 0; j < generated.length; j++) {
      generated[j].style.setProperty("display", "none", "important");
      generated[j].setAttribute("aria-hidden", "true");
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
    injectLightCss();
    forceLightOnly();
    fastLang();
    extraI18n();
    setInterval(forceLightOnly, 900);
    setInterval(keepLang, 650);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
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
      "--fp-page:#F6F8FA;",
      "--fp-surface:#FFFFFF;",
      "--fp-surface-strong:#FFFFFF;",
      "--fp-surface-soft:#F2F5F8;",
      "--fp-text:#15233B;",
      "--fp-muted:#66758A;",
      "--fp-line:#DEE5EC;",
      "--fp-shadow-raised:0 4px 14px rgba(15,23,42,.08);",
      "--fp-shadow-soft:0 2px 9px rgba(15,23,42,.07);",
      "--fp-shadow-inset:none;",
      "--fp-focus:0 0 0 3px rgba(51,153,255,.24);",
    "}",
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

    "aside.fp-v3-sidebar{background:#1D3560!important;border-right:1px solid #2D4D7A!important;box-shadow:none!important;}",
    "aside.fp-v3-sidebar img[src*='femmas-logo']{display:block!important;opacity:1!important;visibility:visible!important;object-fit:contain!important;}",
    "aside.fp-v3-sidebar a,aside.fp-v3-sidebar button{transition:background .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease;}",
    "aside.fp-v3-sidebar a:hover,aside.fp-v3-sidebar button:hover{background:rgba(51,153,255,.13)!important;color:#fff!important;transform:translateX(2px);}",
    "aside.fp-v3-sidebar .fp-v3-active,aside.fp-v3-sidebar [aria-current='page']{background:var(--fp-brand-gradient)!important;color:#fff!important;box-shadow:0 8px 20px rgba(51,153,255,.25)!important;}",

    "#fp-main>[data-topbanner='1']{display:none!important;}",
    "#fp-main>.fp-v3-topbar{background:#FFFFFF!important;color:#15233B!important;border:0!important;border-bottom:1px solid #DEE5EC!important;box-shadow:none!important;min-height:58px!important;height:auto!important;overflow:visible!important;line-height:normal!important;padding-top:8px!important;padding-bottom:8px!important;flex-wrap:wrap!important;}",
    "#fp-main>.fp-v3-topbar *{text-overflow:clip;}",
    "#fp-main>.fp-v3-topbar h1,#fp-main>.fp-v3-topbar h2,#fp-main>.fp-v3-topbar h3,#fp-main>.fp-v3-topbar span,#fp-main>.fp-v3-topbar p{line-height:1.25!important;overflow:visible!important;}",
    "#fp-main>.fp-v3-topbar input{background:#F6F8FA!important;color:#15233B!important;border:1px solid #DEE5EC!important;box-shadow:none!important;}",
    "#fp-main>.fp-v3-topbar input::placeholder{color:#7588A2!important;}",
    "#fp-main>.fp-v3-topbar button,#fp-main>.fp-v3-topbar a{color:#2D4D7A;}",

    "#fp-main :is(input:not([type='checkbox']):not([type='radio']),select,textarea){background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:9px!important;box-shadow:none!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;}",
    "#fp-main :is(input,select,textarea):focus{border-color:#3399FF!important;outline:none!important;box-shadow:var(--fp-shadow-inset),var(--fp-focus)!important;}",
    "#fp-main :is(input,textarea)::placeholder{color:var(--fp-muted)!important;opacity:.88;}",
    "#fp-main label{color:var(--fp-text);}",
    "#fp-main small,#fp-main [style*='color:#94a3b8'],#fp-main [style*='color: #94a3b8']{color:var(--fp-muted)!important;}",

    "#fp-main button,#fp-main [role='button']{border-radius:12px;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;}",
    "#fp-main button:hover,#fp-main [role='button']:hover{filter:brightness(1.035);}",
    "#fp-main button:active,#fp-main [role='button']:active{transform:translateY(1px) scale(.985);box-shadow:none!important;}",
    "#fp-main .fp-v3-primary,#fp-main button[data-primary='1'],#fp-main button[style*='background:#008ece'],#fp-main button[style*='background: #008ece'],#fp-main a[style*='background:#008ece']{background:var(--fp-brand-gradient)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 20px rgba(51,153,255,.24)!important;}",
    "#fp-main button[disabled],#fp-main [aria-disabled='true']{opacity:.58!important;filter:saturate(.65);cursor:not-allowed!important;}",

    "#fp-main :is(section,article,form,[role='dialog'])[style*='background:#fff'],#fp-main :is(section,article,form,[role='dialog'])[style*='background: #fff'],#fp-main :is(section,article,form,[role='dialog'])[style*='background:white']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 4px 14px rgba(15,23,42,.08)!important;}",
    "#fp-main [data-widget-col],#fp-main .fp-v3-card{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;box-shadow:0 4px 14px rgba(15,23,42,.08)!important;}",
    "#fp-main [style*='background:#fff'][style*='border-radius:16px'],#fp-main [style*='background: #fff'][style*='border-radius:16px'],#fp-main [style*='background:#ffffff'][style*='border-radius:16px'],#fp-main [style*='background:#fff'][style*='border-radius:18px'],#fp-main [style*='background:#fff'][style*='border-radius:20px']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 2px 9px rgba(15,23,42,.07)!important;}",
    "#fp-main table{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-radius:12px!important;overflow:hidden!important;border-collapse:separate!important;border-spacing:0!important;box-shadow:0 2px 9px rgba(15,23,42,.07)!important;}",
    "#fp-main th{background:rgba(19,49,90,.07)!important;color:#13315A!important;border-color:var(--fp-line)!important;}",
    "#fp-main td{color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",
    "#fp-main tr:hover td{background:rgba(51,153,255,.055)!important;}",

    "#fp-main [role='dialog'],#fp-main .modal,#fp-main [class*='modal']{color:var(--fp-text)!important;}",
    "#fp-main [role='dialog']>div,#fp-main .modal>div,#fp-main [class*='modal-content']{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 24px 70px rgba(7,21,38,.32)!important;}",

    ".fp-lang-switch{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;min-width:62px!important;height:40px!important;padding:0 11px!important;border:1px solid rgba(255,255,255,.42)!important;border-radius:9px!important;background:rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:inset 1px 1px 0 rgba(255,255,255,.30),0 6px 15px rgba(7,21,38,.14)!important;backdrop-filter:blur(9px);font-weight:800!important;cursor:pointer!important;}",
    ".fp-lang-switch svg{width:17px;height:17px;stroke:currentColor;flex:none;}",
    ".fp-lang-switch:focus-visible{outline:none;box-shadow:var(--fp-focus),0 6px 15px rgba(7,21,38,.18)!important;}",

    ".fb-logo{background-image:url('./femmas-logo-03-mqrt99vq.png')!important;background-color:#fff!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;}",
    ".fb-launcher,.fb-send,.fb-primary{background:var(--fp-brand-gradient)!important;box-shadow:0 10px 26px rgba(51,153,255,.28)!important;}",
    ".fb-panel,.fb-window,.fb-card{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 22px 58px rgba(7,21,38,.30)!important;}",
    ".fb-input,.fb-panel input,.fb-panel textarea{background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:none!important;}",

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
      "#fp-main>.fp-v3-topbar{top:0!important;padding:8px 10px!important;}",
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
    "#fpSkin #fpTotInner,#fpSkin #fpTableWrap{background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:12px!important;box-shadow:0 4px 14px rgba(15,23,42,.08)!important;}",
    "#fpSkin #fpTotInner{padding:15px!important;}",
    "#fpSkin #fpTableWrap{overflow:auto!important;}",
    "#fpSkin #fpTableWrap table{width:100%!important;background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-collapse:separate!important;border-spacing:0!important;}",
    "#fpSkin #fpTableWrap thead,#fpSkin #fpTableWrap th{background:rgba(19,49,90,.075)!important;color:#13315A!important;border-color:var(--fp-line)!important;}",
    "#fpSkin #fpTableWrap td{background:transparent!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;}",
    "#fpSkin #fpTableWrap tr:hover td{background:rgba(51,153,255,.06)!important;}",
    "#fpSkin :is(.fpSort,.fpr,.fpPeriod,.fpCal,.fpFirms,.fpUsers,.fpClear,.fpFocusSearch,.fpChart,.fpXls,.fpbtn){background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;border-radius:9px!important;box-shadow:0 2px 9px rgba(15,23,42,.07)!important;}",
    "#fpSkin :is(.fpPrint,.fpShare){background:var(--fp-brand-gradient)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 20px rgba(51,153,255,.24)!important;}",
    "#fpSkin :is(.fpmm,.fpmi){background:var(--fp-surface-strong)!important;color:var(--fp-text)!important;border-color:var(--fp-line)!important;box-shadow:0 18px 45px rgba(7,21,38,.25)!important;}",
    "#fpSkin :is(input,select,textarea){background:var(--fp-surface-soft)!important;color:var(--fp-text)!important;border:1px solid var(--fp-line)!important;border-radius:11px!important;box-shadow:none!important;}",
    "#fpSkin :is(input,select,textarea):focus{border-color:#3399FF!important;outline:none!important;box-shadow:var(--fp-shadow-inset),var(--fp-focus)!important;}",


    "#fpSkin #fpSheet{background:#fff!important;color:#1F2733!important;}",
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

    var arrow = "";
    var arrowMatch = core.match(/\s*([▼▾])$/);
    if (arrowMatch) {
      arrow = " " + arrowMatch[1];
      core = core.slice(0, arrowMatch.index).trim();
    }
    if (map[core] !== undefined) return raw.replace(trimmed, plus + map[core] + arrow);

    var output = raw;
    if (lang === "sw") {
      output = output.replace(/^\s*Received:/i, function (m) { return m.replace(/Received/i, "Imepokelewa"); });
      output = output.replace(/\|\s*Balance:/i, "| Salio:");
      output = output.replace(/Panga\s*\(sort\)/gi, "Panga");
      output = output.replace(/Leo\s*\(Today\)/gi, "Leo");
      output = output.replace(/Zimeonyeshwa\s+invoice\s+(\d+)\s+kati\s+ya\s+jumla\s+(\d+)\s*·\s*bonyeza\s+kichwa\s+cha\s+safu\s+Panga/gi,
        "Zimeonyeshwa ankara $1 kati ya jumla $2 · bonyeza kichwa cha safu kupanga");
    } else {
      output = output.replace(/^\s*Imepokelewa:/i, function (m) { return m.replace(/Imepokelewa/i, "Received"); });
      output = output.replace(/\|\s*Salio:/i, "| Balance:");
      output = output.replace(/^\s*Panga\s*$/i, "Sort");
      output = output.replace(/Leo\s*\(Today\)/gi, "Today");
      output = output.replace(/Zimeonyeshwa\s+(?:invoice|ankara)\s+(\d+)\s+kati\s+ya\s+jumla\s+(\d+)\s*·\s*bonyeza\s+kichwa\s+cha\s+safu\s+(?:kupanga|Panga(?:\s*\(sort\))?)/gi,
        "Showing $1 invoices out of $2 · click a column heading to sort");
    }
    return output;
  }

  function isSafeInvoiceLabel(node) {
    var parent = node && node.parentElement;
    if (!parent) return false;
    if (parent.closest("#fpSheet")) return false;
    var row = parent.closest(".fpr");
    if (!row) return true;
    var cell = parent.closest("td");
    if (!cell) return false;
    return cell.cellIndex === 3 || cell.cellIndex === 4 || cell.cellIndex === 7 || cell.cellIndex === 8;
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
        if (!isSafeInvoiceLabel(nodes[i])) continue;
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


/* FEMMAS LIGHT-ONLY BASE44 OVERRIDE 2026-09-21 */
(function(){
  "use strict";
  var id="fp-light-only-base44-20260921";
  var css=[
    "html{color-scheme:light!important;background:#f6f8fa!important}",
    "html.fp-dark{color-scheme:light!important}",
    "html.fp-dark,html.fp-dark body,body{background:#f6f8fa!important;color:#15233b!important}",
    ".fp-theme,.fp-skin-theme,button[title*='Light / Dark'],button[title*='Mwanga / Giza'],button[aria-label*='Light / Dark'],button[aria-label*='Mwanga / Giza']{display:none!important;visibility:hidden!important}",
    "aside.fp-v3-sidebar{background:#1d3560!important;border-right:1px solid #2d4d7a!important;box-shadow:none!important}",
    "aside.fp-v3-sidebar a,aside.fp-v3-sidebar button{border-radius:7px!important}",
    "aside.fp-v3-sidebar a:hover,aside.fp-v3-sidebar button:hover{background:rgba(59,163,232,.12)!important;color:#fff!important;transform:none!important}",
    "aside.fp-v3-sidebar .fp-v3-active,aside.fp-v3-sidebar [aria-current='page']{background:rgba(59,163,232,.18)!important;color:#3ba3e8!important;border-left:2px solid #3ba3e8!important;box-shadow:none!important}",
    "#fp-main{background:#f6f8fa!important;color:#15233b!important}",
    "#fp-main>[data-topbanner='1']{display:none!important}",
    "#fp-main>.fp-v3-topbar{top:0!important;background:#fff!important;color:#15233b!important;border:0!important;border-bottom:1px solid #dee5ec!important;box-shadow:none!important;min-height:58px!important;padding:8px 12px!important}",
    "#fp-main>.fp-v3-topbar button,#fp-main>.fp-v3-topbar a{color:#2d4d7a!important}",
    "#fp-main>.fp-v3-topbar input{background:#f7f9fb!important;color:#15233b!important;border:1px solid #dee5ec!important;box-shadow:none!important;border-radius:9px!important}",
    "#fp-main :is(input:not([type='checkbox']):not([type='radio']),select,textarea){background:#fff!important;color:#15233b!important;border:1px solid #dfe6ed!important;border-radius:9px!important;box-shadow:none!important}",
    "#fp-main :is(input,select,textarea):focus{border-color:#3ba3e8!important;box-shadow:0 0 0 3px rgba(59,163,232,.13)!important}",
    "#fp-main table{background:#fff!important;color:#15233b!important;border:1px solid #e2e8ef!important;border-radius:12px!important;box-shadow:0 4px 14px rgba(15,23,42,.06)!important}",
    "#fp-main th{background:#f4f7fa!important;color:#2d4d7a!important}",
    "#fp-main td{color:#15233b!important}",
    "#fp-main [data-widget-col],#fp-main .fp-v3-card,#fp-main section[style*='border-radius'],#fp-main article[style*='border-radius']{background:#fff!important;border-color:#e2e8ef!important;box-shadow:0 4px 14px rgba(15,23,42,.06)!important}",
    "#fp-main button,#fp-main [role='button']{border-radius:8px!important}",
    "#fp-main .fp-v3-primary,#fp-main button[data-primary='1']{background:#3ba3e8!important;color:#fff!important;box-shadow:none!important}",
    ".fp-lang-switch{background:#f7fbff!important;color:#2d4d7a!important;border:1px solid #cfe0ef!important;box-shadow:none!important;border-radius:9px!important;height:36px!important}",
    "html.fp-dark #fp-main [style*='background:#fff'],html.fp-dark #fp-main [style*='background: #fff'],html.fp-dark #fp-main [style*='background:#ffffff'],html.fp-dark #fp-main [style*='background: white']{background:#fff!important;color:#15233b!important;border-color:#e2e8ef!important}",
    "html.fp-dark #fp-main [style*='color:#1F2937'],html.fp-dark #fp-main [style*='color:#111827'],html.fp-dark #fp-main [style*='color:#0f172a'],html.fp-dark #fp-main [style*='color: #1F2937']{color:#15233b!important}",
    "#fpSkin{background:#f6f8fa!important;color:#15233b!important}",
    "#fpSkin>div:first-child{background:#fff!important;color:#15233b!important;border-bottom:1px solid #dee5ec!important;box-shadow:none!important}",
    "#fpSkin .fpPrintList,#fpSkin .fpTopMenu{color:#2d4d7a!important}",
    "#fpSkin .fpAdd,#fpSkin .fpAddP{background:#3ba3e8!important;color:#fff!important;border-color:#3ba3e8!important;box-shadow:none!important}",
    "#fpSkin #fpTotInner,#fpSkin #fpTableWrap{background:#fff!important;color:#15233b!important;border:1px solid #e2e8ef!important;box-shadow:0 4px 14px rgba(15,23,42,.06)!important}",
    "@media(max-width:700px){#fp-main>.fp-v3-topbar{padding:8px 10px!important}}"
  ].join("");
  function apply(){
    try{localStorage.setItem("fp_mode","light");localStorage.setItem("fp_dark","0")}catch(e){}
    document.documentElement.classList.remove("fp-dark");
    var s=document.getElementById(id);
    if(!s){s=document.createElement("style");s.id=id;s.textContent=css;(document.head||document.documentElement).appendChild(s)}
    var els=document.querySelectorAll(".fp-theme,.fp-skin-theme,button,[role='button']");
    for(var i=0;i<els.length;i++){
      var el=els[i], t=((el.getAttribute&&el.getAttribute("title"))||"")+" "+((el.getAttribute&&el.getAttribute("aria-label"))||"");
      if(el.classList&& (el.classList.contains("fp-theme")||el.classList.contains("fp-skin-theme")) || /Light\s*\/\s*Dark|Mwanga\s*\/\s*Giza/i.test(t)){
        el.style.setProperty("display","none","important");
        el.setAttribute("aria-hidden","true");
      }
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply);else apply();
  new MutationObserver(function(){requestAnimationFrame(apply)}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(apply,1200);
})();


/* FEMMAS LEGACY TOP ROW CLEANUP 2026-09-21 */
(function(){
  "use strict";
  var labels={
    "company":1,"help":1,"versions":1,"shortcuts":1,
    "msaada wa whatsapp":1,"whatsapp help":1
  };
  function norm(v){return String(v||"").replace(/\s+/g," ").trim().toLowerCase()}
  function clean(){
    var main=document.getElementById("fp-main");
    if(!main)return;
    var legacy=main.querySelector("[data-topbanner='1']");
    if(legacy) legacy.style.setProperty("display","none","important");

    var top=main.querySelector(":scope > header, :scope > .fp-v3-topbar");
    if(!top)return;
    var candidates=top.querySelectorAll("a,button,[role='button'],span,div");
    for(var i=0;i<candidates.length;i++){
      var el=candidates[i], t=norm(el.textContent);
      if(labels[t]){
        el.style.setProperty("display","none","important");
        continue;
      }
      if(/^\+?255[\d\s-]{7,}$/.test(t) || /^0\d{8,9}$/.test(t)){
        el.style.setProperty("display","none","important");
        continue;
      }
      if(t==="mauzo" && (el.tagName==="A" || el.tagName==="BUTTON" || el.getAttribute("role")==="button")){
        var href=(el.getAttribute("href")||"").toLowerCase();
        var cls=(el.className||"").toString().toLowerCase();
        if(!/sale-invoices|quick-sale|invoice/.test(href+" "+cls)){
          el.style.setProperty("display","none","important");
        }
      }
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",clean);else clean();
  new MutationObserver(function(){requestAnimationFrame(clean)}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(clean,1500);
})();
