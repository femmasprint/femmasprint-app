/* Cloudflare Pages Function middleware — PERMANENT dark-mode flash fix.
 *
 * The app's dark mode was previously applied by an external deferred script that loads
 * AFTER the browser's first paint, so on a dark-mode reload the sidebar (and other
 * surfaces) could show their light/near-black colour for one frame before the app
 * painted its dark inline styles — a recurring flash that outer scripts can't fully
 * kill.
 *
 * This runs at the EDGE (server side) and appends a <style> to the page <head> of every
 * HTML response, so the dark rules are present in the document BEFORE the browser paints
 * anything. Combined with the app's synchronous head script that adds the `fp-dark`
 * class when the saved theme is dark, the sidebar and backdrop are their dark colours
 * from the very first frame. No script delay, no flash — the fix is baked into the page.
 *
 * It is fully defensive: only HTML responses are touched, and ANY error falls straight
 * through to the original, unmodified response — it can never break the site. */

const DARK_HEAD_CSS =
  'html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
  'html.fp-dark aside{background:#13315a !important}';

export async function onRequest(context) {
  const response = await context.next();
  try {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append('<style id="fpEdgeDark">' + DARK_HEAD_CSS + '</style>', { html: true });
        }
      })
      .transform(response);
  } catch (e) {
    return response; // never break the page
  }
}
