/* Cloudflare Pages Function middleware — PERMANENT flash / reflow fix.
 *
 * The app's theme + sidebar tidy-ups were applied by external deferred scripts that
 * load AFTER the browser's first paint, so on a reload you could see (a) the sidebar
 * flash its light/near-black colour for a frame before the dark colour applied, and
 * (b) the menu items reflow / "crumple" for a frame as the layout rules kicked in.
 *
 * This runs at the EDGE (server side) and appends a <style> to the page <head> of every
 * HTML response, so both the dark colours AND the sidebar layout are present in the
 * document BEFORE the browser paints anything — no script delay, no flash, no reflow.
 * The fix is baked into the page.
 *
 * Fully defensive: only HTML responses are touched, and ANY error falls straight
 * through to the original, unmodified response — it can never break the site. */

var HEAD_CSS =
  // Sidebar LAYOUT — unconditional, so menu items are full-width rows and the Arifa
  // notification is already compact from the very first paint (no reflow/"crumple").
  ' aside nav a{display:flex !important;align-items:center;width:100% !important;box-sizing:border-box}' +
  ' aside>nav~*>div>div:nth-of-type(2){display:none !important}' +
  // Dark colours — apply the moment the app's head script adds the fp-dark class, so the
  // sidebar and backdrop are dark from the first frame (no light/black flash).
  ' html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  ' html.fp-dark aside{background:#13315a !important}';

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
