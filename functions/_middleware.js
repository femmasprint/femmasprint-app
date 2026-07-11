/* Cloudflare Pages Function middleware — dark theme, sidebar polish, and RESPONSIVE
 * (phone + tablet) layout. CSS ONLY: injected into the page <head> at the EDGE so it applies
 * before first paint. It never inserts, moves, or edits an app DOM node, so it cannot crash
 * the React app. Fully defensive: only HTML responses are touched; any error falls through.
 *
 * Breakpoint: <=1024px = phones AND tablets get the mobile-friendly layout; desktops keep
 * the full layout. */

var HEAD_CSS =
  ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
  ' aside>nav~*>div>div:nth-of-type(2){display:none !important}' +
  ' html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  ' html.fp-dark aside{background:#13315a !important}' +
  // ===== INSTANT dark mode =====
  // Darken the app's common light BACKGROUNDS via static CSS so the moment html.fp-dark is set
  // they are already dark — no ~0.2s light "sweep". IMPORTANT: every selector below is scoped
  // to "background..." so it only matches a background colour, NOT text colour.
  ' html.fp-dark [style*="background:rgb(255, 255, 255)"],html.fp-dark [style*="background: rgb(255, 255, 255)"],html.fp-dark [style*="background:rgb(255,255,255)"],html.fp-dark [style*="background: rgb(255,255,255)"],html.fp-dark [style*="background:#ffffff"],html.fp-dark [style*="background:#fff;"],html.fp-dark [style*="background: #fff"],html.fp-dark [style*="background:#fafbfc"],html.fp-dark [style*="background:#f8f9fb"],html.fp-dark [style*="background:#f4f5f7"],html.fp-dark [style*="background:#f4f7fb"],html.fp-dark [style*="background:#f8fafc"],html.fp-dark [style*="background:#f1f5f9"]{background-color:#141d31 !important}' +
  ' html.fp-dark [style*="background:#e9f3fe"],html.fp-dark [style*="background:#eff8ff"],html.fp-dark [style*="background:#eaf1fb"],html.fp-dark [style*="background:#eaf4fc"]{background-color:#15263f !important}' +
  ' html.fp-dark [style*="background:#d6ecfd"]{background-color:#1a3352 !important}' +
  ' html.fp-dark [style*="background:#f5faff"],html.fp-dark [style*="background:#f8fbff"],html.fp-dark [style*="background:#f6fbff"],html.fp-dark [style*="background:#fafbff"]{background-color:#0e1626 !important}' +
  ' html.fp-dark [style*="background:#fff7ed"],html.fp-dark [style*="background:#fffbeb"]{background-color:#2a2010 !important}' +
  ' html.fp-dark [style*="background:#ffedd5"]{background-color:#33270f !important}' +
  ' html.fp-dark [style*="background:#fff1f2"],html.fp-dark [style*="background:#fef2f2"]{background-color:#2a1417 !important}' +
  ' html.fp-dark [style*="background:#ffe4e6"]{background-color:#33191d !important}' +
  ' html.fp-dark [style*="background:#f0fdf4"],html.fp-dark [style*="background:#ecfdf5"]{background-color:#0f2a1b !important}' +
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
  '  div[data-topbanner="1"]{gap:4px 10px !important;row-gap:3px !important;padding:8px 16px 8px 68px !important;align-items:center !important;justify-content:flex-start !important;margin-left:0 !important;margin-right:0 !important;width:100% !important;max-width:none !important;box-sizing:border-box !important}' +
  '  div[data-topbanner="1"]>img{margin-right:4px !important}' +
  '  div[data-topbanner="1"]>div:empty{display:none !important}' +
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
  '  main div[style*="minmax(330px"]{display:flex !important;overflow-x:auto !important;' +
  'scroll-snap-type:x mandatory;gap:12px !important;scrollbar-width:none}' +
  '  main div[style*="minmax(330px"]::-webkit-scrollbar{display:none}' +
  '  main div[style*="minmax(330px"]>div{flex:0 0 88% !important;scroll-snap-align:start;' +
  'min-width:0 !important;max-height:64vh !important;overflow:auto !important;-webkit-overflow-scrolling:touch}' +
  '  main div[style*="repeat(5"]{display:flex !important;gap:4px !important;flex-wrap:nowrap !important}' +
  '  main div[style*="repeat(5"]>div{flex:1 1 0 !important;min-width:0 !important;padding:5px 4px !important;overflow:hidden}' +
  '  main div[style*="repeat(5"]>div *{font-size:9px !important;line-height:1.2 !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '  main div[style*="minmax(280px"]{display:flex !important;flex-wrap:wrap !important;gap:11px !important}' +
  '  main div[style*="minmax(280px"]>div{flex:1 1 0 !important;min-width:0 !important;padding:8px 7px !important;overflow:hidden}' +
  '  main div[style*="minmax(280px"]>div:last-child{flex:1 1 100% !important;order:9 !important}' +
  '  main div[style*="minmax(280px"]>div:not(:last-child) *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  // Premium metric tiles (marked data-fpmetric): STACK full-width; never clip the money value.
  '  main div[style*="minmax(280px"]>div[data-fpmetric]{flex:1 1 100% !important;order:0 !important;overflow:hidden !important;padding:16px 18px 0 !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] *{white-space:normal !important;overflow:visible !important;text-overflow:clip !important}' +
  '  main div[style*="minmax(280px"]>div[data-fpmetric] svg{display:block !important;width:100% !important}' +
  '  main div[style*="grid-template-columns"]>div{min-width:0 !important}' +
  '  main div[style*="width:"]{max-width:100% !important}' +
  '  main div[style*="flex"]{flex-wrap:wrap !important}' +
  '  main table{max-width:100% !important}' +
  '  .fp-burger{display:flex !important}' +
  '  .fp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000}' +
  '  body.fp-nav-open .fp-nav-backdrop{display:block}' +
  ' }';

export async function onRequest(context) {
  const response = await context.next();
  try {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append('<style id="fpEdgeDark">' + HEAD_CSS + '</style>', { html: true });
        }
      })
      .transform(response);
  } catch (e) {
    return response; // never break the page
  }
}
