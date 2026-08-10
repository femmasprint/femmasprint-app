/* Cloudflare Pages Function middleware — dark theme, sidebar polish, and RESPONSIVE
 * (phone + tablet) layout. Injected into the page <head> at the EDGE so it applies
 * before first paint. CSS never edits app DOM nodes. The small fpEdgeFix script only ADDS
 * its own nodes (menu burger + backdrop) and hides the mock Google widget; it never moves
 * or edits React-managed content. Fully defensive: only HTML responses are touched; any
 * error falls through.
 *
 * Breakpoint: <=1024px = phones AND tablets get the mobile-friendly layout; desktops keep
 * the full layout. */

var HEAD_CSS =
  ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
  ' aside>nav~*>div>div:nth-of-type(2){display:none !important}' +
  // ===== ROW HOVER HIGHLIGHT app-wide (light blue) — kila table, kila fomu =====
  ' main table tr:hover > td{background:#eaf3ff !important;transition:background .12s ease}' +
  ' html.fp-dark main table tr:hover > td{background:#172942 !important}' +
  ' html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  ' html.fp-dark aside{background:#13315a !important}' +
  // ===== INSTANT dark mode =====
  ' html.fp-dark [style*="background:rgb(255, 255, 255)"],html.fp-dark [style*="background: rgb(255, 255, 255)"],html.fp-dark [style*="background:rgb(255,255,255)"],html.fp-dark [style*="background: rgb(255,255,255)"],html.fp-dark [style*="background:#ffffff"],html.fp-dark [style*="background:#fff;"],html.fp-dark [style*="background: #fff"],html.fp-dark [style*="background:#fafbfc"],html.fp-dark [style*="background:#f8f9fb"],html.fp-dark [style*="background:#f4f5f7"],html.fp-dark [style*="background:#f4f7fb"],html.fp-dark [style*="background:#f8fafc"],html.fp-dark [style*="background:#f1f5f9"]{background-color:#141d31 !important}' +
  ' html.fp-dark [style*="background:#e9f3fe"],html.fp-dark [style*="background:#eff8ff"],html.fp-dark [style*="background:#eaf1fb"],html.fp-dark [style*="background:#eaf4fc"]{background-color:#15263f !important}' +
  ' html.fp-dark [style*="background:#d6ecfd"]{background-color:#1a3352 !important}' +
  ' html.fp-dark [style*="background:#f5faff"],html.fp-dark [style*="background:#f8fbff"],html.fp-dark [style*="background:#f6fbff"],html.fp-dark [style*="background:#fafbff"]{background-color:#0e1626 !important}' +
  ' html.fp-dark [style*="background:#fff7ed"],html.fp-dark [style*="background:#fffbeb"]{background-color:#2a2010 !important}' +
  ' html.fp-dark [style*="background:#ffedd5"]{background-color:#33270f !important}' +
  ' html.fp-dark [style*="background:#fff1f2"],html.fp-dark [style*="background:#fef2f2"],html.fp-dark [style*="background:#fdf2f4"]{background-color:#2a1417 !important}' +
  ' html.fp-dark [style*="background:#ffe4e6"]{background-color:#33191d !important}' +
  ' html.fp-dark [style*="background:#f0fdf4"],html.fp-dark [style*="background:#ecfdf5"]{background-color:#0f2a1b !important}' +
  ' html.fp-dark [style*="background:#fdf8e7"]{background-color:#2a2410 !important}' +
  ' html.fp-dark [style*="background:#f5f2fd"]{background-color:#201a33 !important}' +
  ' html.fp-dark [style*="color:#0f172a"],html.fp-dark [style*="color:#1f2733"],html.fp-dark [style*="color:#0f2747"]{color:#eaf1fb !important}' +
  ' html.fp-dark [style*="color:#334155"]{color:#adbeda !important}' +
  ' html.fp-dark [style*="color:#475569"],html.fp-dark [style*="color:#5b6675"]{color:#a6b8d5 !important}' +
  ' html.fp-dark [style*="color:#64748b"]{color:#7d90ae !important}' +
  ' html.fp-dark [style*="color:#94a3b8"]{color:#7a8ca9 !important}' +
  ' aside nav a{position:relative;transition:background .16s ease,color .16s ease !important}' +
  ' aside nav a:hover{background:rgba(46,144,240,.14) !important;color:#fff !important}' +
  ' aside nav a svg,aside nav a i{transition:color .16s,stroke .16s,opacity .16s}' +
  ' aside nav a:hover svg,aside nav a:hover i{color:#fff !important;stroke:#fff !important;opacity:1 !important}' +
  ' aside nav a::before{content:"";position:absolute;left:1px;top:9px;bottom:9px;width:3px;border-radius:3px;background:transparent;transition:background .16s ease}' +
  ' aside nav a:hover::before{background:#2e90f0}' +
  ' #fpLangTop{flex:none !important}' +
  ' html.fp-dark body main div[style*="linear-gradient"] button,html.fp-dark body main div[style*="linear-gradient"] label,' +
  'html:not(.fp-dark) body main div[style*="linear-gradient"] button,html:not(.fp-dark) body main div[style*="linear-gradient"] label' +
  '{background:rgba(255,255,255,.16) !important;border:1.5px solid rgba(255,255,255,.5) !important;box-shadow:none !important}' +
  ' body main div[style*="linear-gradient"] button svg,body main div[style*="linear-gradient"] label svg{stroke:#fff !important;opacity:1 !important}' +
  ' body main div[style*="linear-gradient"] button,body main div[style*="linear-gradient"] label{color:#fff !important}' +
  // ===== LIGHT-MODE variant for the premium metric tiles =====
  ' html:not(.fp-dark) main div[style*="minmax(280px"]>div[data-fpmetric]{background:linear-gradient(165deg,#ffffff,#eef4ff) !important;border-color:#e4ebf5 !important;box-shadow:0 1px 2px rgba(19,49,90,.05),0 16px 30px -22px rgba(19,49,90,.28) !important}' +
  ' html:not(.fp-dark) main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size:24px"],html:not(.fp-dark) main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size: 24px"]{color:#0f172a !important}' +
  ' html:not(.fp-dark) main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="uppercase"]{color:#5b6b85 !important}' +
  // ===== Dark mode: Quick Sale toolbar + section header bars (match rest of app) =====
  ' html.fp-dark main div:has(>div[data-qsorder="note"]) > div:first-child[style*="linear-gradient(120deg"]{background:linear-gradient(120deg,#16385f,#102845) !important}' +
  ' html.fp-dark main div[style*="minmax(330px"] > div > div:first-child{background:#15263f !important}' +
  ' html.fp-dark main div[style*="minmax(330px"] > div > div:first-child span{color:#8fc0ec !important}' +
  // ===== Design 2 (light mode): brighter-blue Quick Sale toolbar + light table header bars =====
  ' html:not(.fp-dark) main div:has(>div[data-qsorder="note"]) > div:first-child[style*="linear-gradient(120deg"]{background:linear-gradient(120deg,#3bb0ea,#1c8ed4) !important}' +
  ' html:not(.fp-dark) main div[style*="minmax(330px"] > div > div:first-child{background:#e9f3fe !important}' +
  ' html:not(.fp-dark) main div[style*="minmax(330px"] > div > div:first-child span{color:#00578d !important}' +
  // ===== INVOICE/SALE/PURCHASE FORMS FLAT: fomu ifunguke imejaa upande wa main, menu ibaki pembeni (si popup). z-index 60 (Mauzo/Matumizi/Purchase) + 70 (Invoice) =====
  ' div[style*="z-index: 60"][style*="17, 33"],div[style*="z-index: 70"][style*="17, 33"]{background:#f4f7fb !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;align-items:stretch !important;justify-content:stretch !important;padding:0 !important;left:248px !important}' +
  ' html.fp-dark div[style*="z-index: 60"][style*="17, 33"],html.fp-dark div[style*="z-index: 70"][style*="17, 33"]{background:#0a0e1a !important}' +
  ' div[style*="z-index: 60"][style*="17, 33"] > div,div[style*="z-index: 70"][style*="17, 33"] > div{max-width:100% !important;width:100% !important;max-height:100% !important;height:100% !important;border-radius:0 !important;border:none !important;box-shadow:none !important;overflow-y:auto !important}' +
  ' @media(max-width:1024px){ div[style*="z-index: 60"][style*="17, 33"],div[style*="z-index: 70"][style*="17, 33"]{left:0 !important} }' +
  // ===== Quick Sale NEW ORDER: toolbar -> tiles -> Sales -> Expenses -> chips -> Note =====
  ' main div:has(>div[data-qsorder="note"]){display:flex !important;flex-direction:column !important}' +
  ' main div:has(>div[data-qsorder="note"])>div[style*="minmax(280px"]{order:1 !important}' +
  ' main div:has(>div[data-qsorder="note"])>div[style*="minmax(330px"]{order:2 !important}' +
  ' main div:has(>div[data-qsorder="note"])>div[data-qsorder="chips"]{order:3 !important}' +
  ' main div:has(>div[data-qsorder="note"])>div[data-qsorder="note"]{order:4 !important}' +
  // The removed top banner used to push content below the sticky header; restore that gap globally.
  ' main header{margin-bottom:34px !important}' +
  // Remove the top location / WhatsApp-support banner (user request)
  ' div[data-topbanner="1"]{display:none !important}' +
  // ===== RESPONSIVE: phone & tablet (<=1024px) =====
  ' .fp-burger{display:none;position:fixed;top:10px;left:10px;z-index:2147483000;width:40px;height:40px;' +
  'border-radius:11px;background:#13315a;color:#fff;align-items:center;justify-content:center;' +
  'border:1px solid rgba(255,255,255,.18);cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35)}' +
  ' .fp-nav-backdrop{display:none}' +
  ' @media(max-width:1024px){' +
  '  main header{gap:3px !important;column-gap:3px !important}' +
  '  main header button{padding:6px 7px !important;font-size:12px !important;font-weight:600 !important;' +
  'gap:4px !important;min-height:34px}' +
  '  main header button svg{width:14px !important;height:14px !important}' +
  '  #fpLangTop{padding:0 8px !important;min-width:34px !important}' +
  '  .fp-theme{gap:1px !important;padding:2px !important}' +
  '  .fp-theme button:nth-child(3){display:none !important}' +
  '  main header button[title*="Chapa"],main header button[title*="Print"]{display:none !important}' +
  '  main div[style*="linear-gradient"] div[style*="gap: 14px"]{flex-wrap:nowrap !important;min-width:0 !important}' +
  '  main div[style*="linear-gradient"] div[style*="gap: 14px"]>div{min-width:0 !important}' +
  '  main div[style*="linear-gradient"] div[style*="gap: 10px"]{flex-wrap:nowrap !important;gap:4px !important;overflow:hidden !important}' +
  '  main div[style*="linear-gradient"] div[style*="gap: 10px"]>*{flex:0 0 auto !important}' +
  '  main div[style*="linear-gradient"] div[style*="gap: 10px"] button,main div[style*="linear-gradient"] div[style*="gap: 10px"] label{padding:6px !important}' +
  '  html,body{overflow-x:hidden !important;max-width:100vw}' +
  '  aside{position:fixed !important;left:0 !important;top:0 !important;bottom:0 !important;height:100vh !important;' +
  'z-index:1002 !important;width:274px !important;max-width:84vw;transform:translateX(-100%) !important;' +
  'transition:transform .26s ease !important;box-shadow:2px 0 26px rgba(0,0,0,.55);overflow-y:auto;overflow-x:hidden}' +
  '  body.fp-nav-open aside{transform:translateX(0) !important;z-index:1005 !important}' +
  '  main{width:100% !important;min-width:0 !important;overflow-x:hidden !important}' +
  '  main header{flex-wrap:wrap !important;height:auto !important;row-gap:8px !important;' +
  'padding-left:56px !important;align-items:center}' +
  '  main div[style*="linear-gradient"] button,main div[style*="linear-gradient"] label{font-size:0 !important;' +
  'padding:9px !important;min-width:0 !important;gap:0 !important}' +
  '  main div[style*="linear-gradient"] button svg,main div[style*="linear-gradient"] label svg{width:18px !important;height:18px !important}' +
  '  main div[style*="minmax(330px"]{display:flex !important;flex-direction:column !important;gap:12px !important}' +
  '  main div[style*="minmax(330px"]>div{width:100% !important;min-width:0 !important}' +
  '  main div[style*="repeat(5"]{display:flex !important;gap:4px !important;flex-wrap:nowrap !important}' +
  '  main div[style*="repeat(5"]>div{flex:1 1 0 !important;min-width:0 !important;padding:5px 4px !important;overflow:hidden}' +
  '  main div[style*="repeat(5"]>div *{font-size:9px !important;line-height:1.2 !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '  main div[style*="minmax(280px"]{display:flex !important;flex-wrap:wrap !important;gap:11px !important;margin-top:0 !important}' +
  '  main div[style*="minmax(280px"]>div{flex:1 1 0 !important;min-width:0 !important;padding:8px 7px !important;overflow:hidden}' +
  '  main div[style*="minmax(280px"]>div:not([data-fpmetric]) *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  // Premium metric tiles (data-fpmetric): 2-PER-ROW compact grid on mobile.
  '  main div[style*="minmax(280px"]>div[data-fpmetric]{flex:1 1 calc(50% - 6px) !important;order:0 !important;overflow:hidden !important;padding:13px 13px 0 !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] *{white-space:normal !important;overflow:visible !important;text-overflow:clip !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] svg{display:block !important;width:100% !important;height:22px !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size:24px"],main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size: 24px"]{font-size:17px !important;margin-top:6px !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="width:36px"],main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="width: 36px"]{width:30px !important;height:30px !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="uppercase"]{font-size:9px !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="border-radius:20px"],main div[style*="minmax(280px"]>div[data-fpmetric] span[style*="border-radius: 20px"]{display:none !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size:11px"],main div[style*="minmax(280px"]>div[data-fpmetric] div[style*="font-size: 11px"]{font-size:9.5px !important;margin:2px 0 7px !important}' +
  '  main div[style*="grid-template-columns"]>div{min-width:0 !important}' +
  '  main div[style*="width:"]{max-width:100% !important}' +
  '  main table{max-width:100% !important}' +
  '  .fp-burger{display:flex !important}' +
  '  .fp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000}' +
  '  body.fp-nav-open .fp-nav-backdrop{display:block}' +
  ' }';

/* fpEdgeFix: adds ONLY our own nodes (burger + backdrop), sets Swahili as the default
 * language on first visit, keeps the sidebar menu locked-open (labels visible),
 * enables double-click-to-edit on invoice rows, and hides the mock Google widget. */
var FIX_JS = `
(function () {
  try { if (!localStorage.getItem('fp_lang')) localStorage.setItem('fp_lang', 'sw'); } catch (e) {}
  /* Menu ibaki wazi (labels zionekane) kwenye kila kompyuta - zima auto-collapse ya rail */
  try { localStorage.setItem('fp_rail2', '0'); } catch (e) {}
  function ready(fn) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }
  ready(function () {
    try {
      /* --- Menu burger for phones & tablets (<=1024px, shown by CSS) ---
       * NOTE: appended to <html>, NOT <body> — the app actively removes foreign
       * nodes from <body>. A watchdog re-creates the burger if it is ever removed.
       * position:fixed works the same from <html>. */
      function mkBurger() {
        if (document.querySelector('.fp-burger')) return;
        var b = document.createElement('button');
        b.className = 'fp-burger';
        b.setAttribute('aria-label', 'Fungua menyu');
        b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';
        var bd = document.createElement('div');
        bd.className = 'fp-nav-backdrop';
        b.addEventListener('click', function (e) { e.stopPropagation(); document.body.classList.toggle('fp-nav-open'); });
        bd.addEventListener('click', function () { document.body.classList.remove('fp-nav-open'); });
        document.documentElement.appendChild(b);
        document.documentElement.appendChild(bd);
      }
      document.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('aside nav a')) {
          document.body.classList.remove('fp-nav-open');
        }
      }, true);
      mkBurger();
      setInterval(mkBurger, 2500);
      /* --- Hakikisha menu haijakwama imekunjwa (rail) - labels zionekane --- */
      function unRail() { try { if (document.body && document.body.classList.contains('fp-rail')) document.body.classList.remove('fp-rail'); } catch (e) {} }
      unRail();
      setTimeout(unRail, 800); setTimeout(unRail, 2000); setTimeout(unRail, 4000);
      /* --- Double-click kwenye row ya invoice -> fungua ku-edit (kama Vyapar) --- */
      if (!window.__fpDblEdit) {
        window.__fpDblEdit = true;
        document.addEventListener('dblclick', function (e) {
          try {
            var row = e.target && e.target.closest ? e.target.closest('tr') : null;
            if (!row || !/FP\\/INV|TAX INVOICE/.test(row.textContent)) return;
            var btn = row.querySelector('button[title="Hariri invoice"]');
            if (btn) { e.preventDefault(); btn.click(); }
          } catch (er) {}
        }, true);
      }
      /* --- Hide the mock Google Profile widget on the dashboard ---
       * Matched on 'Google Profile' (same string in EN and SW). */
      var SIB = /Low Stock|This Month|Add a widget|Bidhaa|Mwezi|Ongeza|Zinazoisha/i;
      var tmr = null;
      function hideG() {
        try {
          var divs = document.querySelectorAll('main div');
          var hit = null;
          for (var i = 0; i < divs.length; i++) {
            var t = divs[i].textContent;
            if (t.indexOf('Google Profile') !== -1 && t.length < 300) { hit = divs[i]; }
          }
          if (!hit) return;
          var n = hit;
          while (n && n.parentElement && n.parentElement.tagName !== 'MAIN' && n.parentElement.tagName !== 'BODY') {
            var p = n.parentElement, others = false;
            for (var j = 0; j < p.children.length; j++) {
              var c = p.children[j];
              if (c !== n && c.textContent.indexOf('Google Profile') === -1 && SIB.test(c.textContent)) { others = true; break; }
            }
            if (others) { if (n.style.display !== 'none') { n.style.display = 'none'; } return; }
            n = p;
          }
        } catch (e) {}
      }
      hideG();
      new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(hideG, 180); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  });
})();`;

/* fpMoreActions: adds a "More Actions" (three-dot) menu + right-click menu to every
 * transaction-list row across the app (Sale Invoices, Estimate, Proforma, Payment-In,
 * Sale Order, Delivery Challan, Sale Return, Purchase). It ONLY adds its own nodes and
 * reuses the row's existing app buttons (Print / PDF, Hariri invoice). Fully defensive. */
var MORE_JS = `
(function () {
  if (window.__fpMoreActions) return; window.__fpMoreActions = true;
  var curRow = null;

  var IC = {
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    ret:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ban:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5 5l14 14"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    printer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>'
  };
  var ACT = [
    ['eye','View / Edit','edit',0],['ret','Convert To Return','return',0],['truck','Preview Delivery Challan','challan',0],
    ['clock','Payment History','payhist',0],['ban','Cancel Invoice','cancel',1],['trash','Delete','delete',1],
    ['copy','Duplicate','dup',0],['pdf','Open PDF','openpdf',0],['eye','Preview','preview',0],
    ['printer','Print','print',0],['list','View History','hist',0]
  ];

  var st = document.createElement('style');
  st.textContent =
    '.fpMoreBtn{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;color:#64748b}' +
    '.fpMoreBtn:hover{background:rgba(46,144,240,.16);color:#185fa5}' +
    '.fpMoreBtn svg{width:17px;height:17px}' +
    ' main td button[title="Hariri invoice"]{display:none !important}' +
    '.fpFunnel{display:inline-flex;margin-left:5px;opacity:.45;vertical-align:middle;cursor:pointer}' +
    '.fpFunnel:hover{opacity:.8}' +
    '.fpMoreMenu{position:fixed;z-index:2147483600;width:226px;background:#fff;border:1px solid #d7dee8;border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.2);padding:6px;font-size:13px;color:#1f2733}' +
    'html.fp-dark .fpMoreMenu{background:#141d31;border-color:#26324a;color:#e6edf7}' +
    '.fpMoreItem{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:7px;cursor:pointer;white-space:nowrap}' +
    '.fpMoreItem:hover{background:#f1f5f9}html.fp-dark .fpMoreItem:hover{background:#1c2942}' +
    '.fpMoreItem.dg{color:#e2483d}.fpMoreItem svg{width:16px;height:16px;flex:none;opacity:.85}' +
    '.fpOv{position:fixed;inset:0;z-index:2147483500;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.fpCard{background:#fff;color:#1f2733;border-radius:12px;max-width:860px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 26px 64px rgba(0,0,0,.4)}' +
    'html.fp-dark .fpCard{background:#141d31;color:#e6edf7}' +
    '.fpCardH{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #e6ebf2;font-weight:600;font-size:16px}html.fp-dark .fpCardH{border-color:#26324a}' +
    '.fpCardB{overflow:auto}' +
    '.fpBtn{border:1px solid #cbd5e1;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:inherit}' +
    '.fpXi{cursor:pointer;font-size:22px;line-height:1;color:#94a3b8}';
  document.documentElement.appendChild(st);

  function rowData(row) {
    var d = { no:'', party:'', date:'', total:'', paid:'', bal:'', status:'' };
    try {
      var table = row.closest('table'); var heads = [];
      if (table) { var ths = table.querySelectorAll('thead th'); for (var i=0;i<ths.length;i++) heads.push((ths[i].textContent||'').toLowerCase()); }
      var tds = row.querySelectorAll('td');
      function val(keys) { for (var i=0;i<heads.length && i<tds.length;i++){ for (var k=0;k<keys.length;k++){ if (heads[i].indexOf(keys[k])>-1) return (tds[i].textContent||'').trim(); } } return ''; }
      d.no = val(['namba','invoice','no.']) || (function(){ for(var i=0;i<tds.length;i++){ var m=(tds[i].textContent||'').match(/FP\\/[A-Z]+\\/\\d+/); if(m) return m[0]; } return ''; })();
      d.party = val(['mteja','party','customer','jina','supplier','muuzaji']);
      d.date = val(['tarehe','date']); d.total = val(['jumla','amount','total']);
      d.paid = val(['imelipwa','paid','received']); d.bal = val(['salio','balance']);
      d.status = val(['hali','status']);
      var pm = (row.textContent||'').replace(/\\s/g,'').match(/(?:\\+?255|0)\\d{9}/); d.phone = pm ? pm[0] : '';
    } catch (e) {}
    return d;
  }

  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  var curDoc = null;
  function sheetHTML(d, wp){
    var stt = (d.status||''); var paidish = /paid|imelipwa/i.test(stt) && !/haija|unpaid/i.test(stt);
    var stampCol = paidish ? '#16a34a' : '#e11d48';
    var itemRow = '<tr><td style="padding:9px 10px;font-size:12px;border-bottom:1px solid #eef1f5">1</td><td style="padding:9px 10px;font-size:12px;font-weight:600;border-bottom:1px solid #eef1f5">Kazi / Huduma (Goods / Services)</td><td style="padding:9px 10px;font-size:12px;text-align:right;border-bottom:1px solid #eef1f5">1</td><td style="padding:9px 10px;font-size:12px;text-align:center;border-bottom:1px solid #eef1f5">—</td>'+(wp?'<td style="padding:9px 10px;font-size:12px;text-align:right;border-bottom:1px solid #eef1f5">'+esc(d.total||'—')+'</td><td style="padding:9px 10px;font-size:12px;text-align:right;font-weight:700;border-bottom:1px solid #eef1f5">'+esc(d.total||'—')+'</td>':'')+'</tr>';
    return '<div id="fpInvSheet" style="position:relative;overflow:hidden;background:#fff;color:#1f2733;max-width:794px;margin:0 auto;padding:36px 42px;font-family:Asap,sans-serif">'
      + '<img src="/femmas-logo-03-mqrt99vq.png" alt="" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-16deg);width:60%;opacity:.045;pointer-events:none">'
      + '<div style="display:flex;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:3px solid #13315a">'
      +   '<div style="display:flex;gap:13px;align-items:flex-start"><img src="/femmas-logo-03-mqrt99vq.png" alt="" style="width:54px;height:54px;object-fit:contain"><div><div style="font-size:20px;font-weight:800;color:#13315a">FEMMAS PRINT</div><div style="font-size:10.5px;color:#5b6675;line-height:1.7;margin-top:4px">Amani &amp; Congo Street, Jangwani, Ilala - Dar es Salaam<br>Phone: +255 658 843 344 &middot; femmasprint@gmail.com<br>TIN: 102-075-552</div></div></div>'
      +   '<div style="text-align:right"><span style="display:inline-block;padding:4px 13px;border-radius:7px;font-size:12px;font-weight:800;letter-spacing:.06em;border:2px solid '+stampCol+';color:'+stampCol+'">'+esc(stt.toUpperCase())+'</span></div>'
      + '</div>'
      + '<div style="text-align:center;font-size:21px;font-weight:800;color:#008ece;letter-spacing:.04em;padding:13px 0">Invoice</div>'
      + '<div style="display:flex;justify-content:space-between;gap:16px;font-size:12.5px">'
      +   '<div><div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:5px">Bill To</div><div style="font-size:15px;font-weight:800;color:#0f172a">'+esc(d.party||'—')+'</div></div>'
      +   '<div style="text-align:right"><div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:5px">Invoice Details</div><div style="line-height:1.9"><span style="color:#94a3b8">Invoice No.</span> <strong>'+esc(d.no||'—')+'</strong><br><span style="color:#94a3b8">Date</span> <strong>'+esc(d.date||'—')+'</strong></div></div>'
      + '</div>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:15px"><thead><tr style="background:#13315a;color:#fff;font-size:11px;text-align:left"><th style="padding:9px 10px">#</th><th style="padding:9px 10px">Item name</th><th style="padding:9px 10px;text-align:right">Quantity</th><th style="padding:9px 10px;text-align:center">Unit</th>'+(wp?'<th style="padding:9px 10px;text-align:right">Price/Unit</th><th style="padding:9px 10px;text-align:right">Amount</th>':'')+'</tr></thead><tbody>'+itemRow+'<tr><td colspan="2" style="padding:10px;font-weight:800">Total</td><td style="padding:10px;text-align:right;font-weight:800">1</td><td></td>'+(wp?'<td></td><td style="padding:10px;text-align:right;font-weight:800">'+esc(d.total||'—')+'</td>':'')+'</tr></tbody></table>'
      + (wp? '<div style="display:flex;justify-content:space-between;gap:22px;margin-top:16px"><div style="flex:1;font-size:11px;color:#1f2733;line-height:1.8"><div><strong>Payment Details:</strong><br>Account Name: Femmas Print<br>Account no: 0150322619500 (CRDB Bank)<br>Lipa: 5521084 (Tigo) / 5767888 (Voda)</div><div style="margin-top:10px"><strong>Terms:</strong> 70% advance, 30% on delivery. Valid 30 days.</div></div><div style="width:248px;font-size:12.5px"><div style="display:flex;justify-content:space-between;padding:7px 0;color:#5b6675"><span>Sub Total</span><strong style="color:#1f2733">'+esc(d.total||'—')+'</strong></div><div style="display:flex;justify-content:space-between;padding:9px 0;font-weight:800;border-top:2px solid #13315a;border-bottom:2px solid #13315a"><span>Total</span><span>'+esc(d.total||'—')+'</span></div><div style="display:flex;justify-content:space-between;padding:7px 0;color:#16a34a"><span>Received</span><strong>'+esc(d.paid||'Sh 0')+'</strong></div><div style="display:flex;justify-content:space-between;padding:7px 0;font-weight:800;color:#e11d48"><span>Balance</span><span>'+esc(d.bal||'Sh 0')+'</span></div></div></div>' : '<div style="margin-top:12px;font-size:11px;color:#5b6675">Hati ya usafirishaji — items na idadi tu (bila bei).</div>')
      + '<div style="display:flex;justify-content:flex-end;margin-top:30px"><div style="text-align:center;width:190px"><img src="/femmas-signature.png" alt="" style="height:42px;object-fit:contain;display:block;margin:0 auto -2px;mix-blend-mode:multiply"><div style="border-top:1.5px solid #13315a;padding-top:6px;font-size:11px;color:#5b6675">For <strong style="color:#13315a">FEMMAS PRINT</strong><br>Authorized Signatory</div></div></div>'
      + '<div style="font-size:10.5px;color:#5b6675;padding-top:14px;margin-top:12px;text-align:center;border-top:1px dashed #d6dae0">Umefurahia huduma yetu? <strong style="color:#13315a">Tuandikie review kwenye Google</strong> — tafuta <strong>Femmas Print</strong> kwenye Google Maps &#9733;</div>'
      + '</div>';
  }
  function printSheet(){
    var sheet = document.getElementById('fpInvSheet'); if(!sheet) return;
    var old = document.getElementById('fpPrintArea'); if(old) old.remove();
    var area = document.createElement('div'); area.id='fpPrintArea'; area.innerHTML = sheet.outerHTML;
    if(!document.getElementById('fpPrintStyle')){ var ps=document.createElement('style'); ps.id='fpPrintStyle'; ps.textContent='@media print{ body{display:none !important} .fpOv{display:none !important} #fpPrintArea{display:block !important} #fpPrintArea #fpInvSheet{box-shadow:none !important;max-width:100% !important} }'; document.head.appendChild(ps); }
    document.documentElement.appendChild(area);
    setTimeout(function(){ try{ window.print(); }catch(e){} setTimeout(function(){ var a=document.getElementById('fpPrintArea'); if(a)a.remove(); }, 900); }, 120);
  }
  function downloadSheet(d){
    var sheet=document.getElementById('fpInvSheet'); if(!sheet) return;
    var html='<!doctype html><html><head><meta charset="utf-8"><title>Invoice '+esc(d.no||'')+'</title></head><body style="margin:0;background:#fff;display:flex;justify-content:center;padding:20px">'+sheet.outerHTML+'</body></html>';
    var blob=new Blob([html],{type:'text/html'}); var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='Invoice_'+String((d.no||'FP')).replace(/[^A-Za-z0-9]+/g,'-')+'.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
  }
  function pdfbar(){ return '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 18px;border-top:1px solid #e6ebf2"><span class="fpBtn fpDoPrint" style="border-color:#f0997b;color:#d85a30">Open PDF</span><span class="fpBtn fpDoPrint" style="border-color:#85b7eb;color:#185fa5">Print</span><span class="fpBtn fpDoPrint" style="border-color:#9fe1cb;color:#0f6e56">Save PDF</span><span class="fpBtn fpDoEmail" style="border-color:#cbd5e1;color:#334155">Email PDF</span><span class="fpBtn fpDoShare" style="border-color:#25d366;background:#25d366;color:#fff">Sambaza WhatsApp</span><span class="fpBtn fpClose" style="border-color:#e2483d;color:#e2483d">Close</span></div>'; }
  function normPhone(s){ var x=String(s||'').replace(/[^0-9]/g,''); if(!x) return ''; if(x.charAt(0)==='0') x='255'+x.slice(1); else if(x.slice(0,3)!=='255' && x.length<=9) x='255'+x; return x; }
  function shareText(d){ var L=['FEMMAS PRINT','Invoice '+(d.no||'')+'  |  '+(d.date||''),'']; var nm=(d.party||'').replace(/(?:\\+?255|0)\\d{9}.*/,'').trim(); if(nm) L.push('Bill To: '+nm); L.push('Total: '+(d.total||'')); if(d.paid && d.paid!=='Sh 0') L.push('Received: '+d.paid); if(d.bal && d.bal!=='Sh 0') L.push('Balance: '+d.bal); L.push(''); L.push('Malipo: CRDB 0150322619500 (Femmas Print)'); L.push('Lipa: 5521084 (Tigo) / 5767888 (Voda)'); L.push('Asante kwa biashara!'); L.push(''); L.push('Umefurahia huduma? Tuandikie review Google: https://www.google.com/maps?cid=9015672156949326110'); return L.join('\\n'); }
  function loadH2C(cb){ if(window.html2canvas) return cb(window.html2canvas); var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload=function(){cb(window.html2canvas);}; s.onerror=function(){cb(null);}; document.head.appendChild(s); }
  function shareInvoice(d){
    var text=shareText(d); var phone=normPhone(d.phone||'');
    function waFallback(){ window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(text), '_blank'); }
    var sheet=document.getElementById('fpInvSheet');
    if(!sheet || !navigator.share){ waFallback(); return; }
    loadH2C(function(h2c){
      if(!h2c){ waFallback(); return; }
      try {
        h2c(sheet,{scale:2,backgroundColor:'#ffffff',useCORS:true}).then(function(canvas){
          canvas.toBlob(function(blob){
            if(!blob){ waFallback(); return; }
            var file=new File([blob],'Invoice_'+String(d.no||'FP').replace(/[^A-Za-z0-9]+/g,'-')+'.png',{type:'image/png'});
            if(navigator.canShare && navigator.canShare({files:[file]})){
              navigator.share({files:[file],title:'FEMMAS PRINT Invoice',text:text}).catch(function(){ waFallback(); });
            } else {
              var u=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=u; a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(u);},5000); waFallback();
            }
          },'image/png');
        }).catch(function(){ waFallback(); });
      } catch(e){ waFallback(); }
    });
  }

  var ov = null;
  function closeModal(){ if (ov){ ov.remove(); ov=null; } }
  function openModal(title, bodyHtml, footHtml){
    closeModal();
    ov = document.createElement('div'); ov.className='fpOv';
    ov.innerHTML = '<div class="fpCard"><div class="fpCardH">'+title+'<span class="fpXi fpClose">&times;</span></div><div class="fpCardB">'+bodyHtml+'</div>'+(footHtml||'')+'</div>';
    ov.addEventListener('click', function(e){ if (e.target===ov || e.target.closest('.fpClose')){ closeModal(); return; } if (e.target.closest('.fpDoPrint')){ printSheet(); } else if (e.target.closest('.fpDoEmail')){ downloadSheet(curDoc||{}); } else if (e.target.closest('.fpDoShare')){ shareInvoice(curDoc||{}); } });
    document.documentElement.appendChild(ov);
  }

  function soon(name){ openModal(name, '<div style="padding:20px;font-size:14px;line-height:1.6">Kitendo hiki (<b>'+name+'</b>) kinaunganishwa na backend kwa usalama ili kisiharibu invoice zako halisi. Kinakuja hatua inayofuata.</div>', '<div style="display:flex;justify-content:flex-end;padding:12px 18px;border-top:1px solid #e6ebf2"><span class="fpBtn fpClose">Sawa</span></div>'); }

  function doAction(row, kind){
    curRow = row; var d = rowData(row); curDoc = d;
    if (kind==='edit'){ var eb=row.querySelector('button[title="Hariri invoice"]'); if(eb) eb.click(); }
    else if (kind==='preview' || kind==='print' || kind==='openpdf'){ openModal('Invoice', sheetHTML(d,true), pdfbar()); }
    else if (kind==='challan'){ openModal('Delivery Challan', sheetHTML(d,false), pdfbar()); }
    else if (kind==='payhist'){ openModal('Payment History', '<div style="padding:18px 20px;font-size:14px;line-height:1.9">Imelipwa (Received): <b>'+esc(d.paid||d.total||'—')+'</b><br>Salio (Balance): '+esc(d.bal||'—')+'<br>Hali: '+esc(d.status||'—')+'</div>', '<div style="display:flex;justify-content:flex-end;padding:12px 18px;border-top:1px solid #e6ebf2"><span class="fpBtn fpClose">CLOSE</span></div>'); }
    else { soon(({'return':'Convert To Return','cancel':'Cancel Invoice','delete':'Delete','dup':'Duplicate','hist':'View History'})[kind]||'Kitendo'); }
  }

  var menuEl = null;
  function closeMenu(){ if (menuEl){ menuEl.remove(); menuEl=null; } }
  function openMenu(row, x, y){
    closeMenu();
    menuEl = document.createElement('div'); menuEl.className='fpMoreMenu';
    menuEl.innerHTML = ACT.map(function(a){ return '<div class="fpMoreItem'+(a[3]?' dg':'')+'" data-k="'+a[2]+'">'+IC[a[0]]+'<span>'+a[1]+'</span></div>'; }).join('');
    menuEl.addEventListener('click', function(e){ var it=e.target.closest('.fpMoreItem'); if(!it) return; e.stopPropagation(); closeMenu(); doAction(row, it.getAttribute('data-k')); });
    document.documentElement.appendChild(menuEl);
    var w=menuEl.offsetWidth||226, h=menuEl.offsetHeight||360;
    var L = Math.min(x, window.innerWidth-w-8); if(L<8)L=8;
    var Tp = y; if (Tp+h > window.innerHeight-8) Tp = Math.max(8, y-h);
    menuEl.style.left = L+'px'; menuEl.style.top = Tp+'px';
  }

  function isRow(row){ return row && (row.querySelector('button[title="Hariri invoice"]') || row.querySelector('button[title="Print / PDF"]')); }

  var FUNNEL = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>';
  function addFunnels(){
    try {
      var tables = document.querySelectorAll('main table');
      for (var t=0;t<tables.length;t++){
        var tb = tables[t];
        if (!tb.querySelector('button[title="Print / PDF"]')) continue;
        var ths = tb.querySelectorAll('thead th');
        for (var i=0;i<ths.length-1;i++){
          if (ths[i].querySelector('.fpFunnel')) continue;
          var tx = (ths[i].textContent||'').trim(); if(!tx) continue;
          var f = document.createElement('span'); f.className='fpFunnel'; f.innerHTML=FUNNEL;
          ths[i].appendChild(f);
        }
      }
    } catch (e) {}
  }

  function enhance(){
    var btns = document.querySelectorAll('button[title="Print / PDF"], button[title="Hariri invoice"]');
    for (var i=0;i<btns.length;i++){
      var cell = btns[i].closest('td'); if(!cell) continue;
      if (cell.querySelector('.fpMoreBtn')) continue;
      var row = btns[i].closest('tr'); if(!row) continue;
      var holder = btns[i].parentElement || cell;
      var mb = document.createElement('span');
      mb.className='fpMoreBtn'; mb.setAttribute('title','More Actions'); mb.innerHTML=IC.dots;
      holder.appendChild(mb);
    }
    addFunnels();
  }

  document.addEventListener('click', function(e){ var mb=e.target && e.target.closest ? e.target.closest('.fpMoreBtn') : null; if(mb){ e.preventDefault(); e.stopPropagation(); var row=mb.closest('tr'); if(row){ var rc=mb.getBoundingClientRect(); openMenu(row, rc.right-226, rc.bottom+4); } return; } if(!e.target.closest('.fpMoreMenu')) closeMenu(); }, true);
  document.addEventListener('contextmenu', function(e){ var row=e.target && e.target.closest ? e.target.closest('tr') : null; if(isRow(row)){ e.preventDefault(); openMenu(row, e.clientX, e.clientY); } }, true);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeMenu(); closeModal(); } });
  window.addEventListener('scroll', closeMenu, true);

  var t=null;
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  ready(function(){ enhance(); new MutationObserver(function(){ clearTimeout(t); t=setTimeout(enhance,180); }).observe(document.body,{childList:true,subtree:true}); setInterval(enhance,3000); });
})();`;

export async function onRequest(context) {
  const response = await context.next();
  try {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append('<style id="fpEdgeDark">' + HEAD_CSS + '</style>', { html: true });
          el.append('<script id="fpEdgeFix">' + FIX_JS + '</scr' + 'ipt>', { html: true });
          el.append('<script id="fpMoreActions">' + MORE_JS + '</scr' + 'ipt>', { html: true });
          el.append('<script id="fpTheme" src="/fp-theme.js" defer></scr' + 'ipt>', { html: true });
          el.append('<script id="fpInvSkin" src="/fp-invoice-skin.js" defer></scr' + 'ipt>', { html: true });
        }
      })
      .transform(response);
  } catch (e) {
    return response; // never break the page
  }
}
