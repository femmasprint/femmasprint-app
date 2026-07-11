/* Cloudflare Pages Function middleware — dark theme, sidebar polish, RESPONSIVE
 * (phone/tablet) layout, a SELF-HEALING language toggle, and mobile swipe-pager dots.
 * All injected into the page <head> at the EDGE so it applies before first paint and
 * never moves/removes an app node (so it can't crash the React app). Fully defensive:
 * only HTML responses are touched; any error falls through untouched.
 *
 * MOBILE TILE-ROW RULE (reusable across pages): a row of small tiles/cards that the app
 * lays out with `grid-template-columns:repeat(N,1fr)` (or minmax variants) wraps its last
 * tile onto a new line on a narrow phone. The fix pattern is always the same — turn the
 * container into a single flex row (`display:flex;flex-wrap:nowrap`) with each tile
 * `flex:1 1 0;min-width:0`, and shrink the inner text so N tiles fit one clean line. Apply
 * this same pattern when tidying other pages for mobile. */

var HEAD_CSS =
  ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
  ' aside>nav~*>div>div:nth-of-type(2){display:none !important}' +
  ' html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  ' html.fp-dark aside{background:#13315a !important}' +
  ' aside nav a{position:relative;transition:background .16s ease,color .16s ease !important}' +
  ' aside nav a:hover{background:rgba(46,144,240,.14) !important;color:#fff !important}' +
  ' aside nav a svg,aside nav a i{transition:color .16s,stroke .16s,opacity .16s}' +
  ' aside nav a:hover svg,aside nav a:hover i{color:#fff !important;stroke:#fff !important;opacity:1 !important}' +
  ' aside nav a::before{content:"";position:absolute;left:1px;top:9px;bottom:9px;width:3px;border-radius:3px;background:transparent;transition:background .16s ease}' +
  ' aside nav a:hover::before{background:#2e90f0}' +
  ' #fpLangTop{flex:none !important}' +
  ' #fp-dots{display:none}' +
  // ===== RESPONSIVE: phone & small tablet =====
  ' .fp-burger{display:none;position:fixed;top:10px;left:10px;z-index:2147483000;width:40px;height:40px;' +
  'border-radius:11px;background:#13315a;color:#fff;align-items:center;justify-content:center;' +
  'border:1px solid rgba(255,255,255,.18);cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35)}' +
  ' .fp-nav-backdrop{display:none}' +
  ' @media(max-width:820px){' +
  '  html,body{overflow-x:hidden !important;max-width:100vw}' +
  '  aside{position:fixed !important;left:0 !important;top:0 !important;bottom:0 !important;height:100vh !important;' +
  'z-index:2147482000 !important;width:274px !important;max-width:84vw;transform:translateX(-100%) !important;' +
  'transition:transform .26s ease !important;box-shadow:2px 0 26px rgba(0,0,0,.55);overflow-y:auto;overflow-x:hidden}' +
  '  body.fp-nav-open aside{transform:translateX(0) !important}' +
  '  main{width:100% !important;min-width:0 !important;overflow-x:hidden !important}' +
  '  main header{flex-wrap:wrap !important;height:auto !important;row-gap:8px !important;' +
  'padding-left:56px !important;align-items:center}' +
  '  #fp-dots{display:flex !important}' +
  // Quick Sale Sales/Expenses (auto-fit minmax(330px..)) becomes a horizontal SWIPE PAGER.
  // Each panel is 88% wide so the NEXT panel peeks at the edge (a built-in "swipe me" hint),
  // and capped in height so a short Sales panel doesn't leave a big empty gap before the
  // summary below (the taller Expenses panel just scrolls internally). Dots (added by JS
  // below) sit under it as an explicit swipe indicator.
  '  main div[style*="minmax(330px"]{display:flex !important;overflow-x:auto !important;' +
  'scroll-snap-type:x mandatory;gap:12px !important;scrollbar-width:none}' +
  '  main div[style*="minmax(330px"]::-webkit-scrollbar{display:none}' +
  '  main div[style*="minmax(330px"]>div{flex:0 0 88% !important;scroll-snap-align:start;' +
  'min-width:0 !important;max-height:64vh !important;overflow:auto !important;-webkit-overflow-scrolling:touch}' +
  // 5 payment tiles (Cash/Bank/Voda/Yas/Simu) -> one compact flex row.
  '  main div[style*="repeat(5"]{display:flex !important;gap:4px !important;flex-wrap:nowrap !important}' +
  '  main div[style*="repeat(5"]>div{flex:1 1 0 !important;min-width:0 !important;padding:5px 4px !important;overflow:hidden}' +
  '  main div[style*="repeat(5"]>div *{font-size:9px !important;line-height:1.2 !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  // Bottom summary: 3 tiles (Total Sales/Expenses/Cash in Hand) on one row, Note full-width below.
  '  main div[style*="minmax(280px"]{display:flex !important;flex-wrap:wrap !important;gap:6px !important}' +
  '  main div[style*="minmax(280px"]>div{flex:1 1 0 !important;min-width:0 !important;padding:8px 7px !important;overflow:hidden}' +
  '  main div[style*="minmax(280px"]>div:last-child{flex:1 1 100% !important;order:9 !important}' +
  '  main div[style*="minmax(280px"]>div:not(:last-child) *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  // generic: other grids relax their fixed column min so children can shrink
  '  main div[style*="grid-template-columns"]>div{min-width:0 !important}' +
  '  main div[style*="width:"]{max-width:100% !important}' +
  '  main div[style*="flex"]{flex-wrap:wrap !important}' +
  '  main table{max-width:100% !important}' +
  '  .fp-burger{display:flex !important}' +
  '  .fp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147481000}' +
  '  body.fp-nav-open .fp-nav-backdrop{display:block}' +
  ' }';

/* Self-healing SW/EN language toggle (anchored to the theme button by a language-independent
 * match, so it survives i18n title translation + React re-renders). */
var LANG_JS =
  "(function(){try{" +
  "function cur(){try{return localStorage.getItem('fp_lang')||'sw';}catch(e){return 'sw';}}" +
  "function findTheme(){var b=document.querySelectorAll('header button');for(var i=0;i<b.length;i++){var t=b[i].getAttribute('title')||'';if(/giza|mwanga|dark|light/i.test(t))return b[i];}return null;}" +
  "function paint(box){var l=cur();var k=box.children;for(var i=0;i<k.length;i++){var on=k[i].getAttribute('data-l')===l;k[i].style.cssText='padding:4px 9px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1;'+(on?'background:#2e90f0;color:#fff;':'background:transparent;color:#5b7197;');}}" +
  "function ensure(){if(!window.FPSetLang)return;var box=document.getElementById('fpLangTop');if(box){paint(box);return;}var tb=findTheme();if(!tb||!tb.parentNode)return;box=document.createElement('div');box.id='fpLangTop';box.style.cssText='display:flex;gap:3px;padding:3px;background:#eef2f7;border:1px solid #e3e6eb;border-radius:11px;height:40px;box-sizing:border-box;align-items:center;flex:none;margin:0 2px';['sw','en'].forEach(function(l){var d=document.createElement('div');d.setAttribute('data-l',l);d.textContent=l.toUpperCase();d.addEventListener('click',function(){try{window.FPSetLang(l);}catch(e){}paint(box);});box.appendChild(d);});tb.parentNode.insertBefore(box,tb);paint(box);}" +
  "setInterval(ensure,1500);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();" +
  "}catch(e){}})();";

/* Mobile swipe-pager dots for Quick Sale (Sales / Expenses). Adds a small dots bar right
 * after the pager and keeps the active dot (a blue pill) synced to the scroll position;
 * tapping a dot scrolls to that panel. Only on phones; self-heals if a re-render drops it;
 * removed on desktop. */
var DOTS_JS =
  "(function(){try{" +
  "function mm(){return window.matchMedia('(max-width:820px)').matches;}" +
  "function sync(p,dots){var w=p.children[0].offsetWidth+12;var idx=Math.round(p.scrollLeft/w);var k=dots.children;for(var i=0;i<k.length;i++){var on=i===idx;k[i].style.background=on?'#2e90f0':'#c3ccd8';k[i].style.width=on?'22px':'8px';k[i].style.borderRadius=on?'5px':'50%';}}" +
  "function tick(){var p=document.querySelector('main div[style*=\"minmax(330px\"]');var ex=document.getElementById('fp-dots');if(!mm()||!p||p.children.length<2){if(ex)ex.remove();return;}if(ex&&ex.__p===p){sync(p,ex);return;}if(ex)ex.remove();var dots=document.createElement('div');dots.id='fp-dots';dots.__p=p;dots.style.cssText='display:flex;justify-content:center;align-items:center;gap:7px;padding:9px 0 3px';for(var i=0;i<p.children.length;i++){(function(i){var dot=document.createElement('div');dot.style.cssText='width:8px;height:8px;border-radius:50%;background:#c3ccd8;transition:all .2s ease;cursor:pointer';dot.addEventListener('click',function(){p.scrollTo({left:i*(p.children[0].offsetWidth+12),behavior:'smooth'});});dots.appendChild(dot);})(i);}p.parentNode.insertBefore(dots,p.nextSibling);p.addEventListener('scroll',function(){sync(p,dots);},{passive:true});sync(p,dots);}" +
  "setInterval(tick,800);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();" +
  "}catch(e){}})();";

export async function onRequest(context) {
  const response = await context.next();
  try {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append('<style id="fpEdgeDark">' + HEAD_CSS + '</style>', { html: true });
          el.append('<script id="fpEdgeLang">' + LANG_JS + '</script>', { html: true });
          el.append('<script id="fpEdgeDots">' + DOTS_JS + '</script>', { html: true });
        }
      })
      .transform(response);
  } catch (e) {
    return response; // never break the page
  }
}
