/* Cloudflare Pages Function middleware — dark theme, sidebar polish, RESPONSIVE
 * (phone/tablet) layout, a single-button language toggle, and mobile swipe-pager dots.
 * All injected into the page <head> at the EDGE so it applies before first paint and
 * never moves/removes an app node (so it can't crash the React app). Fully defensive:
 * only HTML responses are touched; any error falls through untouched.
 *
 * MOBILE TILE-ROW RULE (reusable across pages): a row of small tiles/cards that the app
 * lays out with `grid-template-columns:repeat(N,1fr)` (or minmax variants) wraps its last
 * tile onto a new line on a narrow phone. The fix pattern is always the same — turn the
 * container into a single flex row (`display:flex;flex-wrap:nowrap`) with each tile
 * `flex:1 1 0;min-width:0`, and shrink the inner text so N tiles fit one clean line. */

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
  ' #fpLangTop{display:none !important}' +
  ' #fpLang1{flex:none !important}' +
  ' #fp-dots{display:none}' +
  // ===== RESPONSIVE: phone & small tablet =====
  ' .fp-burger{display:none;position:fixed;top:10px;left:10px;z-index:2147483000;width:40px;height:40px;' +
  'border-radius:11px;background:#13315a;color:#fff;align-items:center;justify-content:center;' +
  'border:1px solid rgba(255,255,255,.18);cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35)}' +
  ' .fp-nav-backdrop{display:none}' +
  ' @media(max-width:900px){' +
  // compact header buttons (Add Sale/Purchase, theme, print) so they take less width
  '  main header button{padding:7px 11px !important;font-size:12px !important;font-weight:600 !important;' +
  'gap:5px !important;min-height:36px}' +
  '  main header button svg{width:14px !important;height:14px !important}' +
  ' }' +
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
  '  main div[style*="minmax(330px"]{display:flex !important;overflow-x:auto !important;' +
  'scroll-snap-type:x mandatory;gap:12px !important;scrollbar-width:none}' +
  '  main div[style*="minmax(330px"]::-webkit-scrollbar{display:none}' +
  '  main div[style*="minmax(330px"]>div{flex:0 0 88% !important;scroll-snap-align:start;' +
  'min-width:0 !important;max-height:64vh !important;overflow:auto !important;-webkit-overflow-scrolling:touch}' +
  '  main div[style*="repeat(5"]{display:flex !important;gap:4px !important;flex-wrap:nowrap !important}' +
  '  main div[style*="repeat(5"]>div{flex:1 1 0 !important;min-width:0 !important;padding:5px 4px !important;overflow:hidden}' +
  '  main div[style*="repeat(5"]>div *{font-size:9px !important;line-height:1.2 !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '  main div[style*="minmax(280px"]{display:flex !important;flex-wrap:wrap !important;gap:6px !important}' +
  '  main div[style*="minmax(280px"]>div{flex:1 1 0 !important;min-width:0 !important;padding:8px 7px !important;overflow:hidden}' +
  '  main div[style*="minmax(280px"]>div:last-child{flex:1 1 100% !important;order:9 !important}' +
  '  main div[style*="minmax(280px"]>div:not(:last-child) *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '  main div[style*="grid-template-columns"]>div{min-width:0 !important}' +
  '  main div[style*="width:"]{max-width:100% !important}' +
  '  main div[style*="flex"]{flex-wrap:wrap !important}' +
  '  main table{max-width:100% !important}' +
  '  .fp-burger{display:flex !important}' +
  '  .fp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147481000}' +
  '  body.fp-nav-open .fp-nav-backdrop{display:block}' +
  ' }';

/* Single-button SW/EN language toggle. The app's own 2-pill toggle (#fpLangTop) had two
 * painters fighting over its active/inactive pill styles ~20x/second, flickering the whole
 * header. We hide it (CSS above) and add ONE self-owned button (#fpLang1) that shows the
 * current language and switches on tap via the app's window.FPSetLang. One label, painted
 * once, updated only when the language actually changes — no flicker, less space. */
var LANG_JS =
  "(function(){try{" +
  "function cur(){try{return (localStorage.getItem('fp_lang')||'sw').toUpperCase();}catch(e){return 'SW';}}" +
  "function findTheme(){var b=document.querySelectorAll('header button');for(var i=0;i<b.length;i++){var t=b[i].getAttribute('title')||'';if(/giza|mwanga|dark|light/i.test(t))return b[i];}return null;}" +
  "function ensure(){if(!window.FPSetLang)return;var b=document.getElementById('fpLang1');if(b){var c=cur();if(b.textContent!==c)b.textContent=c;return;}var tb=findTheme();if(!tb||!tb.parentNode)return;b=document.createElement('button');b.id='fpLang1';b.type='button';b.setAttribute('aria-label','Language');b.style.cssText='height:36px;min-width:46px;padding:0 12px;border-radius:10px;border:1px solid rgba(130,150,180,.5);background:transparent;color:#2e90f0;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex:none;margin:0 2px';b.textContent=cur();b.addEventListener('click',function(){var nl=(cur()==='SW')?'en':'sw';try{window.FPSetLang(nl);}catch(e){}b.textContent=nl.toUpperCase();});tb.parentNode.insertBefore(b,tb);}" +
  "setInterval(ensure,1800);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();" +
  "}catch(e){}})();";

/* Mobile swipe-pager dots for Quick Sale (Sales / Expenses). */
var DOTS_JS =
  "(function(){try{" +
  "function mm(){return window.matchMedia('(max-width:820px)').matches;}" +
  "function sync(p,dots){var w=p.children[0].offsetWidth+12;var idx=Math.round(p.scrollLeft/w);var k=dots.children;for(var i=0;i<k.length;i++){var on=i===idx;k[i].style.background=on?'#2e90f0':'#c3ccd8';k[i].style.width=on?'22px':'8px';k[i].style.borderRadius=on?'5px':'50%';}}" +
  "function tick(){var p=document.querySelector('main div[style*=\"minmax(330px\"]');var ex=document.getElementById('fp-dots');if(!mm()||!p||p.children.length<2){if(ex)ex.remove();return;}if(ex&&ex.__p===p){sync(p,ex);return;}if(ex)ex.remove();var dots=document.createElement('div');dots.id='fp-dots';dots.__p=p;dots.style.cssText='display:flex;justify-content:center;align-items:center;gap:7px;padding:9px 0 3px';for(var i=0;i<p.children.length;i++){(function(i){var dot=document.createElement('div');dot.style.cssText='width:8px;height:8px;border-radius:50%;background:#c3ccd8;transition:all .2s ease;cursor:pointer';dot.addEventListener('click',function(){p.scrollTo({left:i*(p.children[0].offsetWidth+12),behavior:'smooth'});});dots.appendChild(dot);})(i);}p.parentNode.insertBefore(dots,p.nextSibling);p.addEventListener('scroll',function(){sync(p,dots);},{passive:true});sync(p,dots);}" +
  "setInterval(tick,900);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();" +
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
