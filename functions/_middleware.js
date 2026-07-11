/* Cloudflare Pages Function middleware — dark theme + sidebar polish, injected into the
 * page <head> at the EDGE so it is in the document BEFORE the browser's first paint
 * (no flash, no reflow) and applies to the app's OWN native menu without moving or
 * removing any node (so it can never crash the React app).
 *
 * Fully defensive: only HTML responses are touched, and ANY error falls straight
 * through to the original, unmodified response — it can never break the site. */

var HEAD_CSS =
  // Sidebar LAYOUT — full-width rows + compact Arifa card, from the first paint.
  ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
  ' aside>nav~*>div>div:nth-of-type(2){display:none !important}' +
  // Dark colours — sidebar + backdrop dark from the first frame.
  ' html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  ' html.fp-dark aside{background:#13315a !important}' +
  // COOL POLISH — a smooth blue hover, brighter icons, and a soft left accent on hover,
  // applied to the app's native menu items (no restructuring, purely visual).
  ' aside nav a{position:relative;transition:background .16s ease,color .16s ease !important}' +
  ' aside nav a:hover{background:rgba(46,144,240,.14) !important;color:#fff !important}' +
  ' aside nav a svg,aside nav a i{transition:color .16s,stroke .16s,opacity .16s}' +
  ' aside nav a:hover svg,aside nav a:hover i{color:#fff !important;stroke:#fff !important;opacity:1 !important}' +
  ' aside nav a::before{content:"";position:absolute;left:1px;top:9px;bottom:9px;width:3px;border-radius:3px;background:transparent;transition:background .16s ease}' +
  ' aside nav a:hover::before{background:#2e90f0}';

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
