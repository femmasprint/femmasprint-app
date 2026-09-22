/* FEMMAS PRINT production gateway
 * app.femmasprint.com now serves the real femmasbase Cloudflare Pages application.
 * The legacy static app remains in this repository only as a rollback source.
 */
const FRONTEND_UPSTREAM_ORIGIN = 'https://femmasbase.pages.dev';
const BASE44_API_ORIGIN = 'https://base44.app';
const PUBLIC_ORIGIN = 'https://app.femmasprint.com';
const LEGACY_SHEET_BRIDGE = 'https://script.google.com/macros/s/AKfycbzgr7hqI4vPFHB9nNRh2l7Ljb7m0KCf9Yl1Ue4pEfgSAADE4-luyv0B3_tn0zo0bQzecg/exec';
const SHEET_MEMORY_CACHE = new Map();
const SHEET_INFLIGHT = new Map();

function sheetCacheTtl(sheet, date) {
  if (date || ['QuickSale','Expenses','Attendance'].includes(sheet)) return 15000;
  if (['Employees','Customers','Items','Suppliers'].includes(sheet)) return 300000;
  return 90000;
}

function json(data, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      'access-control-allow-origin': PUBLIC_ORIGIN,
      'vary': 'Origin'
    }
  });
}

async function sharedSheetRead(sourceUrl) {
  const sheet = (sourceUrl.searchParams.get('sheet') || '').trim();
  const date = (sourceUrl.searchParams.get('date') || '').trim();
  const live = ['QuickSale','Expenses','Attendance'].includes(sheet);
  const browserMaxAge = live ? 5 : 60;
  const edgeMaxAge = live ? 15 : 300;
  const cacheControl = `public, max-age=${browserMaxAge}, s-maxage=${edgeMaxAge}, stale-while-revalidate=300`;
  if (!['QuickSale','Expenses','Attendance','Employees','Customers','Items','Invoices','Payments','Debtors','Production','Suppliers','Purchases','Orders','Accounts','Payroll','Delivery','Leads'].includes(sheet)) {
    return json({ ok:false, error:'Unsupported sheet' }, 400);
  }

  const cacheKey = sheet + '::' + (date || 'all');
  const ttl = sheetCacheTtl(sheet, date);
  const cached = SHEET_MEMORY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at <= ttl) {
    return json({ ok:true, rows:cached.rows, source:'memory-cache' }, 200, cacheControl);
  }
  if (SHEET_INFLIGHT.has(cacheKey)) {
    const rows = await SHEET_INFLIGHT.get(cacheKey);
    return json({ ok:true, rows, source:'shared-inflight' }, 200, cacheControl);
  }

  const task = (async () => {
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
    if (!res.ok) throw new Error('Sheet bridge unavailable: ' + res.status);
    const raw = await res.text();
    const prefix = callback + '(';
    const start = raw.indexOf(prefix);
    const end = raw.lastIndexOf(')');
    if (start < 0 || end <= start) throw new Error('Invalid bridge response');

    let payload;
    try { payload = JSON.parse(raw.slice(start + prefix.length, end)); }
    catch { throw new Error('Invalid bridge JSON'); }

    const rows = sheet === 'QuickSale'
      ? (Array.isArray(payload.sales) ? payload.sales : [])
      : (Array.isArray(payload.rows) ? payload.rows : []);
    if (payload.ok === false) throw new Error(payload.error || 'Sheet bridge failed');
    SHEET_MEMORY_CACHE.set(cacheKey, { at:Date.now(), rows });
    return rows;
  })().finally(() => SHEET_INFLIGHT.delete(cacheKey));

  SHEET_INFLIGHT.set(cacheKey, task);
  try {
    const rows = await task;
    return json({ ok:true, rows, source:'apps-script' }, 200, cacheControl);
  } catch (error) {
    return json({ ok:false, error:error?.message || 'Shared data bridge failed' }, 502);
  }
}

async function sharedSheetWrite(incoming) {
  const body = await incoming.json().catch(() => ({}));
  const action = String(body?.action || '');
  if (action !== 'addSale' && action !== 'addExpense') {
    return json({ ok:false, error:'Unsupported shared write action' }, 400);
  }

  const payload = action === 'addSale' ? {
    action:'addSale',
    date:String(body.date || '').slice(0,10),
    client:String(body.client || ''),
    goods:String(body.goods || ''),
    qty:Number(body.qty || 0),
    unitPrice:Number(body.unitPrice || 0),
    payMode:String(body.payMode || 'Cash'),
    paid:Number(body.paid || 0),
    saleId:String(body.saleId || ''),
    accountId:String(body.accountId || ''),
  } : {
    action:'addExpense',
    date:String(body.date || '').slice(0,10),
    name:String(body.name || ''),
    reason:String(body.reason || ''),
    qty:Number(body.qty || 0),
    unitPrice:Number(body.unitPrice || 0),
    payMode:String(body.payMode || 'Cash'),
    expenseId:String(body.expenseId || ''),
    employeeId:String(body.employeeId || ''),
    accountId:String(body.accountId || ''),
  };

  if (action === 'addSale' && (!payload.date || !payload.saleId || !payload.goods)) {
    return json({ ok:false, error:'Date, SaleID and Goods are required' }, 400);
  }
  if (action === 'addExpense' && (!payload.date || !payload.expenseId || !payload.reason)) {
    return json({ ok:false, error:'Date, ExpenseID and Reason are required' }, 400);
  }

  const res = await fetch(LEGACY_SHEET_BRIDGE, {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify(payload),
    redirect:'follow'
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { ok:false, error:raw || 'Invalid Apps Script response' }; }
  if (!res.ok || data?.ok === false) return json({ ok:false, error:data?.error || `Shared write failed: ${res.status}` }, res.ok ? 400 : 502);
  return json({ ok:true, action, result:data }, 200, 'no-store');
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

function markResponse(response, source, cacheControl = '') {
  const headers = new Headers(response.headers);
  headers.set('x-femmas-app-source', source);
  if (cacheControl) headers.set('cache-control', cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function localFrontend(context, incoming, sourceUrl) {
  if (!context.env?.ASSETS || !['GET','HEAD'].includes(incoming.method)) return null;
  const pathname = sourceUrl.pathname;
  const isAssetPath = /\.[A-Za-z0-9]{2,8}$/.test(pathname);

  if (isAssetPath) {
    const asset = await context.env.ASSETS.fetch(incoming);
    if (asset.status !== 404) {
      const immutable = /\/assets\/[^/]+-[A-Za-z0-9_-]+\.(?:js|css)$/.test(pathname);
      return markResponse(asset, 'local-base44-build', immutable ? 'public,max-age=31536000,immutable' : '');
    }
    return null;
  }

  // SPA route: always serve the locally committed Base44 index.
  const indexUrl = new URL('/index.html', sourceUrl.origin);
  const headers = new Headers(incoming.headers);
  headers.set('accept', 'text/html');
  const indexReq = new Request(indexUrl.toString(), { method:'GET', headers });
  const index = await context.env.ASSETS.fetch(indexReq);
  if (index.status !== 404) return markResponse(index, 'local-base44-build', 'no-store');
  return null;
}

export async function onRequest(context) {
  const incoming = context.request;
  const sourceUrl = new URL(incoming.url);
  if (sourceUrl.pathname === '/api/femmas-shared-sheet' && incoming.method === 'GET') {
    try { return await sharedSheetRead(sourceUrl); }
    catch (error) { return json({ ok:false, error:'Shared data bridge failed' }, 502); }
  }
  if (sourceUrl.pathname === '/api/femmas-shared-write' && incoming.method === 'POST') {
    try { return await sharedSheetWrite(incoming); }
    catch (error) { return json({ ok:false, error:error?.message || 'Shared write bridge failed' }, 502); }
  }

  // Production frontend follows the live femmasbase build directly.
  // The local build remains in the repository only as rollback material.

  const upstreamOrigin = sourceUrl.pathname.startsWith('/api/') ? BASE44_API_ORIGIN : FRONTEND_UPSTREAM_ORIGIN;
  const upstreamUrl = new URL(sourceUrl.pathname + sourceUrl.search, upstreamOrigin);

  const headers = new Headers(incoming.headers);
  headers.delete('host');

  if (headers.has('origin')) headers.set('origin', upstreamOrigin);
  if (headers.has('referer')) {
    try {
      const ref = new URL(headers.get('referer'));
      if (ref.hostname === sourceUrl.hostname) {
        ref.protocol = 'https:';
        ref.hostname = new URL(upstreamOrigin).hostname;
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
    outHeaders.set('x-femmas-app-upstream', new URL(upstreamOrigin).hostname);

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
