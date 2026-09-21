/* FEMMAS PRINT production gateway
 * app.femmasprint.com now serves the real femmasbase Cloudflare Pages application.
 * The legacy static app remains in this repository only as a rollback source.
 */
const UPSTREAM_ORIGIN = 'https://femmasbase.pages.dev';
const PUBLIC_ORIGIN = 'https://app.femmasprint.com';
const LEGACY_SHEET_BRIDGE = 'https://script.google.com/macros/s/AKfycbzgr7hqI4vPFHB9nNRh2l7Ljb7m0KCf9Yl1Ue4pEfgSAADE4-luyv0B3_tn0zo0bQzecg/exec';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': PUBLIC_ORIGIN,
      'vary': 'Origin'
    }
  });
}

async function sharedSheetRead(sourceUrl) {
  const sheet = (sourceUrl.searchParams.get('sheet') || '').trim();
  const date = (sourceUrl.searchParams.get('date') || '').trim();
  if (!['QuickSale','Expenses','Attendance'].includes(sheet)) {
    return json({ ok:false, error:'Unsupported sheet' }, 400);
  }

  const callback = 'femmasProxyCb';
  const qs = new URLSearchParams({ callback });
  if (sheet === 'QuickSale' && date) {
    qs.set('action','getQuickSale');
    qs.set('date',date);
  } else {
    qs.set('action','getTable');
    qs.set('tab',sheet);
  }

  const res = await fetch(LEGACY_SHEET_BRIDGE + '?' + qs.toString(), { redirect:'follow' });
  if (!res.ok) return json({ ok:false, error:'Sheet bridge unavailable', status:res.status }, 502);
  const raw = await res.text();
  const prefix = callback + '(';
  const start = raw.indexOf(prefix);
  const end = raw.lastIndexOf(')');
  if (start < 0 || end <= start) return json({ ok:false, error:'Invalid bridge response' }, 502);
  let payload;
  try { payload = JSON.parse(raw.slice(start + prefix.length, end)); }
  catch { return json({ ok:false, error:'Invalid bridge JSON' }, 502); }

  if (sheet === 'QuickSale') {
    const rows = Array.isArray(payload.sales) ? payload.sales : [];
    return json({ ok:payload.ok !== false, rows, source:'apps-script' });
  }
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  return json({ ok:payload.ok !== false, rows, source:'apps-script' });
}

function rewriteLocation(value) {
  if (!value) return value;
  return value
    .replace(/^https:\/\/femmasbase\.pages\.dev/i, PUBLIC_ORIGIN)
    .replace(/^http:\/\/femmasbase\.pages\.dev/i, PUBLIC_ORIGIN);
}

function rewriteSetCookie(value) {
  if (!value) return value;
  return value
    .replace(/Domain=\.?(?:femmasbase\.pages\.dev)/ig, 'Domain=app.femmasprint.com');
}

export async function onRequest(context) {
  const incoming = context.request;
  const sourceUrl = new URL(incoming.url);
  if (sourceUrl.pathname === '/api/femmas-shared-sheet' && incoming.method === 'GET') {
    try { return await sharedSheetRead(sourceUrl); }
    catch (error) { return json({ ok:false, error:'Shared data bridge failed' }, 502); }
  }
  const upstreamUrl = new URL(sourceUrl.pathname + sourceUrl.search, UPSTREAM_ORIGIN);

  const headers = new Headers(incoming.headers);
  headers.delete('host');

  if (headers.has('origin')) headers.set('origin', UPSTREAM_ORIGIN);
  if (headers.has('referer')) {
    try {
      const ref = new URL(headers.get('referer'));
      if (ref.hostname === sourceUrl.hostname) {
        ref.protocol = 'https:';
        ref.hostname = 'femmasbase.pages.dev';
        ref.port = '';
        headers.set('referer', ref.toString());
      }
    } catch {}
  }

  const init = {
    method: incoming.method,
    headers,
    redirect: 'manual',
  };

  if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
    init.body = incoming.body;
  }

  try {
    const upstream = await fetch(new Request(upstreamUrl.toString(), init));

    const outHeaders = new Headers(upstream.headers);
    outHeaders.set('x-femmas-app-source', 'femmasbase');
    outHeaders.set('x-femmas-app-upstream', 'femmasbase.pages.dev');

    const location = outHeaders.get('location');
    if (location) outHeaders.set('location', rewriteLocation(location));

    const cookie = outHeaders.get('set-cookie');
    if (cookie) outHeaders.set('set-cookie', rewriteSetCookie(cookie));

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch (error) {
    return new Response('FEMMAS APP is temporarily unavailable.', {
      status: 502,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-femmas-app-source': 'gateway-error'
      }
    });
  }
}
