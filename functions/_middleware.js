/* Cloudflare Pages Function middleware — dark theme, sidebar polish, RESPONSIVE
 * (phone/tablet) layout, and a SELF-HEALING language toggle. All injected into the
 * page <head> at the EDGE so it applies before first paint and never moves/removes an
 * app node (so it can't crash the React app). Fully defensive: only HTML responses are
 * touched; any error falls through untouched. */

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
  // keep the language toggle from ever being clipped / hidden
  ' #fpLangTop{flex:none !important}' +
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
  '  main div[style*="width:"]{max-width:100% !important}' +
  '  main div[style*="flex"]{flex-wrap:wrap !important}' +
  '  main table{max-width:100% !important}' +
  '  .fp-burger{display:flex !important}' +
  '  .fp-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147481000}' +
  '  body.fp-nav-open .fp-nav-backdrop{display:block}' +
  ' }';

/* Self-healing SW/EN language toggle. The app builds a #fpLangTop toggle in index.html,
 * but it anchors to the theme button via its ENGLISH title ("Light / Dark mode"); once
 * i18n translates that title to "Mwanga / Giza", the app can no longer re-create the
 * toggle after a React re-render removes it — so it silently disappears (worse on mobile,
 * which re-renders more). This runs on a short interval and re-creates the toggle whenever
 * it is missing, finding the theme button by a LANGUAGE-INDEPENDENT match. It reuses the
 * app's own window.FPSetLang so switching works exactly as before. Idempotent: if the
 * app's own toggle is present it just repaints; never duplicates. */
var LANG_JS =
  "(function(){try{" +
  "function cur(){try{return localStorage.getItem('fp_lang')||'sw';}catch(e){return 'sw';}}" +
  "function findTheme(){var b=document.querySelectorAll('header button');for(var i=0;i<b.length;i++){var t=b[i].getAttribute('title')||'';if(/giza|mwanga|dark|light/i.test(t))return b[i];}return null;}" +
  "function paint(box){var l=cur();var k=box.children;for(var i=0;i<k.length;i++){var on=k[i].getAttribute('data-l')===l;k[i].style.cssText='padding:4px 9px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1;'+(on?'background:#2e90f0;color:#fff;':'background:transparent;color:#5b7197;');}}" +
  "function ensure(){if(!window.FPSetLang)return;var box=document.getElementById('fpLangTop');if(box){paint(box);return;}var tb=findTheme();if(!tb||!tb.parentNode)return;box=document.createElement('div');box.id='fpLangTop';box.style.cssText='display:flex;gap:3px;padding:3px;background:#eef2f7;border:1px solid #e3e6eb;border-radius:11px;height:40px;box-sizing:border-box;align-items:center;flex:none;margin:0 2px';['sw','en'].forEach(function(l){var d=document.createElement('div');d.setAttribute('data-l',l);d.textContent=l.toUpperCase();d.addEventListener('click',function(){try{window.FPSetLang(l);}catch(e){}paint(box);});box.appendChild(d);});tb.parentNode.insertBefore(box,tb);paint(box);}" +
  "setInterval(ensure,1200);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();" +
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
        }
      })
      .transform(response);
  } catch (e) {
    return response; // never break the page
  }
}
