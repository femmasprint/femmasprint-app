/* FEMMAS PRINT production gateway
 * app.femmasprint.com now serves the real femmasbase Cloudflare Pages application.
 * The legacy static app remains in this repository only as a rollback source.
 */
const UPSTREAM_ORIGIN = 'https://femmasbase.pages.dev';
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

async function sharedSheetRead(sourceUrl, context) {
  const sheet = (sourceUrl.searchParams.get('sheet') || '').trim();
  const date = (sourceUrl.searchParams.get('date') || '').trim();
  const live = ['QuickSale','Expenses','Attendance'].includes(sheet);
  const browserMaxAge = live ? 5 : 60;
  const edgeMaxAge = live ? 15 : 300;
  const cacheControl = `public, max-age=${browserMaxAge}, s-maxage=${edgeMaxAge}, stale-while-revalidate=300`;
  if (!['QuickSale','Expenses','Attendance','Employees','Customers','Items','Invoices','Payments','Debtors','Production','Suppliers','Purchases','Orders','Accounts','Payroll','Delivery','Leads'].includes(sheet)) {
    return json({ ok:false, error:'Unsupported sheet' }, 400);
  }

  const edgeCache = typeof caches !== 'undefined' ? caches.default : null;
  const edgeUrl = new URL('/api/femmas-shared-sheet', sourceUrl.origin);
  edgeUrl.searchParams.set('sheet', sheet);
  if (date) edgeUrl.searchParams.set('date', date);
  const edgeKey = new Request(edgeUrl.toString());
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(edgeKey);
      if (hit) return markResponse(hit, 'fresh-sheet-cache');
    } catch {}
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

    const rows = sheet === 'QuickSale' && date
      ? (Array.isArray(payload.sales) ? payload.sales : [])
      : (Array.isArray(payload.rows) ? payload.rows : []);
    if (payload.ok === false) throw new Error(payload.error || 'Sheet bridge failed');
    SHEET_MEMORY_CACHE.set(cacheKey, { at:Date.now(), rows });
    return rows;
  })().finally(() => SHEET_INFLIGHT.delete(cacheKey));

  SHEET_INFLIGHT.set(cacheKey, task);
  try {
    const rows = await task;
    const response = json({ ok:true, rows, source:'apps-script' }, 200, cacheControl);
    if (edgeCache && context?.waitUntil) {
      const copy = response.clone();
      copy.headers.set('cache-control', 'public, max-age=' + Math.floor(ttl / 1000));
      context.waitUntil(edgeCache.put(edgeKey, copy).catch(() => {}));
    }
    return response;
  } catch (error) {
    return json({ ok:false, error:error?.message || 'Shared data bridge failed' }, 502);
  }
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

async function optimizeLiveFemmasResponse(response, sourceUrl) {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const pathname = sourceUrl.pathname || '';

  // Keep the exact working upstream/login flow, but make the dashboard non-blocking.
  if (contentType.includes('text/html')) {
    let html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store');
    headers.set('x-femmas-speed-fix','native-request-lifecycle');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }


  // Match only the verified live chunks. Keep authentication and mutations intact.
  if (['/assets/index-CoDuqWxY.js','/assets/Dashboard-DUmWkJWX.js','/assets/sharedFemmasDb-pz44rUcs.js'].includes(pathname)) {
    let js = await response.text();
    let changed = false;
    const replaceOnce = (from, to) => {
      if (js.split(from).length !== 2) return false;
      js = js.replace(from, to);
      changed = true;
      return true;
    };
    if (pathname === '/assets/sharedFemmasDb-pz44rUcs.js') {
      replaceOnce('p=async e=>{const t=await R.functions.invoke("googleSheetsApi",e);',
        'p=async e=>{if(e.action==="readRange"&&e.spreadsheetId===m&&["QuickSale","Expenses","Attendance"].includes(e.sheetName)){try{return {rows:await w(e.sheetName)}}catch{}}const t=await R.functions.invoke("googleSheetsApi",e);');
    }
    if (pathname === '/assets/Dashboard-DUmWkJWX.js') {
      const core = 'const[xe,Lt,Ar,wn]=await Promise.allSettled([ht.entities.Invoice.list("-date",1500),ht.entities.Expense.list("-date",1500),jh(Cr()),Th(Cr())]);';
      const bounded = 'void jh(Cr()).then(O).catch(()=>F("Mauzo ya Google Sheet hayajapatikana."));void Th(Cr()).then(g).catch(()=>F("Matumizi ya Google Sheet hayajapatikana."));const[xe,Lt]=await Promise.allSettled([__fpInvoiceRead(ht.entities.Invoice.list("-date",1500),J1()),ht.entities.Expense.list("-date",1500)]);if(xe.status==="rejected"||Lt.status==="rejected")throw new Error("Data ya mauzo au matumizi haijapatikana. Bonyeza Jaribu tena.");';
      if (replaceOnce(core, bounded)) {
        js += '\nasync function __fpInvoiceRead(primary,legacy){const fallback=Promise.resolve(legacy).then(value=>({value}),error=>({error}));const rows=await primary;if(rows?.length)return rows;const result=await fallback;if(result.error)throw result.error;return result.value;}\n';
        replaceOnce('if(xe.status==="fulfilled"&&!(xe.value||[]).length)try{xe.value=await J1()}catch{}', '');
        replaceOnce('i(Bt(xe)),s(Bt(Lt)),O(Bt(Ar)),g(Bt(wn)),','i(Bt(xe)),s(Bt(Lt)),');
      }
    }
    // Version the changed lazy chunks so browsers cannot reuse their old immutable copies.
    const versioned = js.replace(/((?:\.\/|assets\/)(?:Dashboard-DUmWkJWX|sharedFemmasDb-pz44rUcs)\.js)(["'])/g, '$1?fp=20260922-data5$2');
    changed = changed || versioned !== js;
    js = versioned;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('etag');
    headers.set('cache-control', 'no-store');
    headers.set('x-femmas-speed-fix', changed ? 'parallel-dashboard-fresh-sheets-v5' : 'unchanged');
    return new Response(js, {status:response.status,statusText:response.statusText,headers});
  }

  return response;
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

  // Base44 rejects app.femmasprint.com as an OAuth/auth return domain.
  // For auth endpoints only, send the approved femmasbase.pages.dev return URL upstream;
  // response Location headers are rewritten back to app.femmasprint.com below.
  if (/^\/api\/apps\/auth\/(?:login|logout)/.test(sourceUrl.pathname)) {
    const from = sourceUrl.searchParams.get('from_url');
    if (from) {
      try {
        const u = new URL(from);
        if (u.hostname === 'app.femmasprint.com') {
          u.protocol = 'https:';
          u.hostname = 'femmasbase.pages.dev';
          u.port = '';
          sourceUrl.searchParams.set('from_url', u.toString());
        }
      } catch {}
    }
  }
  if (sourceUrl.pathname === '/api/femmas-shared-sheet' && incoming.method === 'GET') {
    try { return await sharedSheetRead(sourceUrl, context); }
    catch (error) { return json({ ok:false, error:'Shared data bridge failed' }, 502); }
  }

  // Production frontend follows the live femmasbase build directly.
  // The local build remains in the repository only as rollback material.

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

    const proxied = new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
    return await optimizeLiveFemmasResponse(proxied, sourceUrl);
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
