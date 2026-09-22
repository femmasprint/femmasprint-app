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

function activeEmployeeRow(row) {
  const n = String(row?.EmployeeName || row?.Name || row?.fullName || '').trim().toLowerCase();
  return !['omar mrangi','jamali gwao','jamali','victor mapuga','victor'].some((x) => n === x || n.startsWith(x + ' '));
}

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
  const cacheControl = sheet === 'Employees'
    ? 'no-store'
    : `public, max-age=${browserMaxAge}, s-maxage=${edgeMaxAge}, stale-while-revalidate=300`;
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

    let rows = sheet === 'QuickSale'
      ? (Array.isArray(payload.sales) ? payload.sales : [])
      : (Array.isArray(payload.rows) ? payload.rows : []);
    if (sheet === 'Employees') rows = rows.filter(activeEmployeeRow);
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

async function legacyTableRows(sheetName) {
  const callback = 'femmasCompatCb';
  const qs = new URLSearchParams({ action:'getTable', tab:sheetName, callback });
  const res = await fetch(LEGACY_SHEET_BRIDGE + '?' + qs.toString(), { redirect:'follow' });
  if (!res.ok) throw new Error('Shared table unavailable: ' + res.status);
  const raw = await res.text();
  const prefix = callback + '(';
  const start = raw.indexOf(prefix);
  const end = raw.lastIndexOf(')');
  if (start < 0 || end <= start) throw new Error('Invalid shared table response');
  const payload = JSON.parse(raw.slice(start + prefix.length, end));
  if (payload?.ok === false) throw new Error(payload?.error || 'Shared table failed');
  return Array.isArray(payload?.rows) ? payload.rows : [];
}

function latestRowsByKey(rows, keyColumn) {
  const map = new Map();
  (rows || []).forEach((row, index) => {
    const key = String(row?.[keyColumn] || `__row_${row?.__rowNumber || index}`);
    map.set(key, row);
  });
  return [...map.values()];
}

async function postLegacyOfficeRow(sheetName, row) {
  const action = sheetName === 'QuickSale' ? 'addSale' : sheetName === 'Expenses' ? 'addExpense' : '';
  if (!action) throw new Error('Write not supported for this shared sheet');
  const payload = sheetName === 'QuickSale' ? {
    action,
    date:String(row.Date || '').slice(0,10),
    client:String(row.Client || ''),
    goods:String(row.Goods || ''),
    qty:Number(row.Qty || 0),
    unitPrice:Number(row.UnitPrice || 0),
    payMode:String(row.PayMode || 'Cash'),
    paid:Number(row.Paid || 0),
    saleId:String(row.SaleID || ''),
    accountId:String(row.AccountId || ''),
  } : {
    action,
    date:String(row.Date || '').slice(0,10),
    name:String(row.Name || ''),
    employeeId:String(row.EmployeeID || ''),
    reason:String(row.Reason || ''),
    qty:Number(row.Qty || 0),
    unitPrice:Number(row.UnitPrice || 0),
    payMode:String(row.PayMode || 'Cash'),
    expenseId:String(row.ExpenseID || ''),
    accountId:String(row.AccountId || ''),
  };
  const res = await fetch(LEGACY_SHEET_BRIDGE, {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify(payload),
    redirect:'follow'
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { ok:false, error:raw || 'Invalid write response' }; }
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Shared write failed: ${res.status}`);
  return data;
}

function requestFromFemmasApp(incoming) {
  const origin = String(incoming.headers.get('origin') || '');
  const referer = String(incoming.headers.get('referer') || '');
  const fetchSite = String(incoming.headers.get('sec-fetch-site') || '');
  if (origin && origin !== PUBLIC_ORIGIN) return false;
  if (referer && !referer.startsWith(PUBLIC_ORIGIN + '/')) return false;
  if (fetchSite && !['same-origin','same-site','none'].includes(fetchSite)) return false;
  return true;
}

async function googleSheetsCompat(incoming) {
  if (!requestFromFemmasApp(incoming)) return json({ error:'Forbidden' }, 403);
  const body = await incoming.json().catch(() => ({}));
  const action = String(body?.action || '');
  const sheetName = String(body?.sheetName || '');
  if (!['QuickSale','Expenses','Attendance'].includes(sheetName)) return json({ error:'Sheet not supported' }, 403);

  if (action === 'readRange') {
    let rows = await legacyTableRows(sheetName);
    if (sheetName === 'QuickSale') rows = latestRowsByKey(rows, 'SaleID');
    if (sheetName === 'Expenses') rows = latestRowsByKey(rows, 'ExpenseID');
    const headers = rows.length ? Object.keys(rows[0]).filter((key) => key !== '__rowNumber') : [];
    return json({ headers, rows, rowCount:rows.length }, 200, 'no-store');
  }

  if (action === 'appendRow') {
    const row = body?.row && typeof body.row === 'object' ? body.row : null;
    if (!row) return json({ error:'Row required' }, 400);
    if (!['QuickSale','Expenses'].includes(sheetName)) return json({ error:'Append not supported for this sheet' }, 403);
    await postLegacyOfficeRow(sheetName, row);
    return json({ ok:true, updates:{ compat:true } }, 200, 'no-store');
  }

  if (action === 'updateByKey') {
    const keyColumn = String(body?.keyColumn || '');
    const keyValue = String(body?.keyValue || '');
    const expectedKey = sheetName === 'QuickSale' ? 'SaleID' : sheetName === 'Expenses' ? 'ExpenseID' : 'AttendanceID';
    if (keyColumn !== expectedKey || !keyValue) return json({ error:'Valid key required' }, 400);
    if (!['QuickSale','Expenses'].includes(sheetName)) return json({ error:'Update not supported for this sheet' }, 403);

    const rows = await legacyTableRows(sheetName);
    const matches = rows.filter((row) => String(row?.[expectedKey] || '') === keyValue);
    if (!matches.length) return json({ error:'Record not found' }, 404);
    const current = matches[matches.length - 1];
    const changes = body?.changes && typeof body.changes === 'object' ? body.changes : {};
    const merged = { ...current, ...changes, [expectedKey]:keyValue };
    await postLegacyOfficeRow(sheetName, merged);
    return json({ ok:true, updatedRange:'compat-append-correction' }, 200, 'no-store');
  }

  return json({ error:`Action ${action || 'unknown'} unavailable without Base44 Functions` }, 501);
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
  if (!sourceUrl.pathname.startsWith('/api/') && /^(?:\/staff\/|\/fonts\/)/.test(sourceUrl.pathname) && context.env?.ASSETS && ['GET','HEAD'].includes(incoming.method)) {
    const asset = await context.env.ASSETS.fetch(incoming);
    if (asset.status !== 404) return markResponse(asset, 'femmas-local-asset', 'public,max-age=86400');
  }

  if (sourceUrl.pathname === '/api/femmas-shared-sheet' && incoming.method === 'GET') {
    try { return await sharedSheetRead(sourceUrl); }
    catch (error) { return json({ ok:false, error:'Shared data bridge failed' }, 502); }
  }
  if (/^\/api\/apps\/[^/]+\/functions\/googleSheetsApi\/?$/.test(sourceUrl.pathname) && incoming.method === 'POST') {
    try { return await googleSheetsCompat(incoming); }
    catch (error) { return json({ error:error?.message || 'Google Sheets compatibility bridge failed' }, 502); }
  }
  if (sourceUrl.pathname === '/api/femmas-shared-write' && incoming.method === 'POST') {
    try { return await sharedSheetWrite(incoming); }
    catch (error) { return json({ ok:false, error:error?.message || 'Shared write bridge failed' }, 502); }
  }

  // Freeze the verified FEMMAS frontend locally.
  if (!sourceUrl.pathname.startsWith('/api/')) {
    try {
      const local = await localFrontend(context, incoming, sourceUrl);
      if (local) return local;
    } catch {}
  }

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
