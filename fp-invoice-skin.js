/* FEMMAS PRINT — Sale Invoices "exact mockup" skin.
 * Renders the approved Vyapar-style page over the app's Sale Invoices list,
 * populated from the live backend, with working search, More-Actions menu,
 * real A4 invoice Preview, WhatsApp share and Add Sale. Loaded by the edge
 * middleware as <script src="/fp-invoice-skin.js" defer>. Fully defensive.
 */
(function () {
  if (window.__fpSkin) return; window.__fpSkin = true;

  function backend() { try { return (localStorage.getItem('fp_backend_url') || '').trim(); } catch (e) { return ''; } }
  var DATA = null, view = [], q = '', tot = 0, paid = 0, bal = 0, curDoc = null, fromISO = '', toISO = '', periodLabel = 'Custom';

  function num(n) { return +String(n == null ? '' : n).replace(/[^0-9.-]/g, '') || 0; }
  function money(n) { return 'Sh ' + Math.round(num(n)).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function normPhone(s) { var x = String(s || '').replace(/[^0-9]/g, ''); if (!x) return ''; if (x.charAt(0) === '0') x = '255' + x.slice(1); else if (x.slice(0, 3) !== '255' && x.length <= 9) x = '255' + x; return x; }
  function fmtDate(s) { if (!s) return ''; var d = new Date(s); if (isNaN(d.getTime())) return String(s); var dd = ('0' + d.getDate()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2); return dd + '/' + mm + '/' + d.getFullYear(); }
  function numToWords(n) {
    n = Math.round(num(n)); if (!n) return 'Zero';
    var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function two(x) { return x < 20 ? a[x] : (b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '')); }
    function three(x) { return (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : ''); }
    var out = '', sc = [['Billion', 1e9], ['Million', 1e6], ['Thousand', 1e3]];
    for (var i = 0; i < sc.length; i++) { var u = Math.floor(n / sc[i][1]); if (u) { out += (out ? ' ' : '') + three(u) + ' ' + sc[i][0]; n %= sc[i][1]; } }
    if (n) out += (out ? ' ' : '') + three(n);
    return out.trim();
  }

  function load() {
    if (DATA) return Promise.resolve(DATA);
    var url = backend(); if (!/\/exec$/.test(url)) return Promise.resolve([]);
    return fetch(url + '?action=getTable&tab=Invoices').then(function (r) { return r.json(); }).then(function (j) {
      DATA = (j.rows || []).filter(function (r) { return String(r.InvoiceNo || '').trim(); });
      DATA.reverse();
      tot = 0; paid = 0; bal = 0;
      DATA.forEach(function (r) { tot += num(r.TotalAmount); paid += num(r.PaidAmount); bal += num(r.Balance); });
      return DATA;
    }).catch(function () { return []; });
  }

  function isInvPage() {
    try {
      // If the app's Add-Sale / Add-Purchase form or any app modal is open (z-index 60/70/80),
      // step aside so it is visible — the skin must never cover a real app form.
      if (document.querySelector('div[style*="z-index: 60"], div[style*="z-index: 70"], div[style*="z-index: 80"], div[style*="z-index:60"], div[style*="z-index:70"], div[style*="z-index:80"]')) return false;
      var m = document.querySelector('main'); if (!m) return false; var t = m.textContent || '';
      return t.indexOf('Total Invoices') > -1 && /Sale Invoices/.test(t);
    } catch (e) { return false; }
  }

  function toISODate(s) { if (!s) return ''; var d = new Date(s); if (isNaN(d.getTime())) return ''; return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function applyFilter() {
    view = (DATA || []).filter(function (r) {
      if (q) { var s = ((r.InvoiceNo || '') + ' ' + (r.CustomerName || '')).toLowerCase(); if (s.indexOf(q) < 0) return false; }
      if (fromISO || toISO) { var dd = toISODate(r.Date); if (!dd) return false; if (fromISO && dd < fromISO) return false; if (toISO && dd > toISO) return false; }
      return true;
    });
    tot = 0; paid = 0; bal = 0;
    view.forEach(function (r) { tot += num(r.TotalAmount); paid += num(r.PaidAmount); bal += num(r.Balance); });
  }
  function refresh() {
    applyFilter();
    var c = document.getElementById('fpTotInner'); if (c) c.innerHTML = totCardInner();
    var w = document.getElementById('fpTableWrap'); if (w) { var el = document.getElementById('fpSkin'); w.innerHTML = rowsHTML(); if (el) attachRows(el); }
    var pc = document.getElementById('fpPeriodChip'); if (pc) pc.innerHTML = periodLabel + ' &#9662;';
  }
  function setPeriod(label, f, t) { periodLabel = label; fromISO = f || ''; toISO = t || ''; var a = document.getElementById('fpFrom'), b = document.getElementById('fpTo'); if (a) a.value = fromISO; if (b) b.value = toISO; refresh(); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function monthStart() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-01'; }
  function monthEnd() { var d = new Date(); return ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
  function lastMonthRange() { var d = new Date(); return [ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)), ymd(new Date(d.getFullYear(), d.getMonth(), 0))]; }
  function quarterStart() { var d = new Date(); return ymd(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)); }
  function yearStart() { return new Date().getFullYear() + '-01-01'; }
  function todayStr() { return ymd(new Date()); }

  var FN = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="opacity:.5;margin-left:5px;vertical-align:middle"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>';
  var IC_PR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2"/></svg>';
  var IC_SH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  var IC_DOTS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  var MIC = {
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    ret: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></svg>',
    truck: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ban: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5 5l14 14"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    pdf: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    printer: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'
  };
  var ACT = [['eye', 'View / Edit', 'edit', 0], ['ret', 'Convert To Return', 'return', 0], ['truck', 'Preview Delivery Challan', 'challan', 0], ['clock', 'Payment History', 'payhist', 0], ['ban', 'Cancel Invoice', 'cancel', 1], ['trash', 'Delete', 'delete', 1], ['copy', 'Duplicate', 'dup', 0], ['pdf', 'Open PDF', 'openpdf', 0], ['eye', 'Preview', 'preview', 0], ['printer', 'Print', 'print', 0], ['list', 'View History', 'hist', 0]];

  function rowsHTML() {
    var cols = ['Date', 'Invoice no', 'Party Name', 'Transaction', 'Payment Type', 'Amount', 'Balance', 'Status'];
    var head = '<tr style="text-align:left;color:#64748b;border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;background:#fafbfc">' + cols.map(function (c, i) { return '<th style="padding:11px 12px;font-weight:600;font-size:12px;white-space:nowrap;' + ((i === 5 || i === 6) ? 'text-align:right' : '') + '">' + c + FN + '</th>'; }).join('') + '<th style="padding:11px 12px;font-weight:600;font-size:12px;text-align:center">Actions</th></tr>';
    var body = view.slice(0, 100).map(function (r, i) {
      var st = String(r.Status || ''); var sc = /paid|imelipwa/i.test(st) && !/unpaid|haija/i.test(st) ? '#0f6e56' : '#e2483d'; var b = num(r.Balance);
      return '<tr class="fpr" data-no="' + esc(r.InvoiceNo || '') + '" style="border-bottom:1px solid #eef2f7;cursor:pointer' + (i === 0 ? ';background:#dcecfb' : '') + '">'
        + '<td style="padding:12px;font-size:12.5px;white-space:nowrap">' + esc(fmtDate(r.Date)) + '</td>'
        + '<td style="padding:12px;font-size:12.5px;font-weight:600;white-space:nowrap">' + esc(r.InvoiceNo || '') + '</td>'
        + '<td style="padding:12px;font-size:12.5px">' + esc(r.CustomerName || '—') + '</td>'
        + '<td style="padding:12px;font-size:12.5px">Sale</td>'
        + '<td style="padding:12px;font-size:12.5px;color:#94a3b8">' + (b <= 0 ? 'Cash' : 'FP BANK') + '</td>'
        + '<td style="padding:12px;font-size:12.5px;text-align:right;font-weight:600;white-space:nowrap">' + money(r.TotalAmount) + '</td>'
        + '<td style="padding:12px;font-size:12.5px;text-align:right;white-space:nowrap;' + (b <= 0 ? 'color:#94a3b8' : '') + '">' + money(r.Balance) + '</td>'
        + '<td style="padding:12px;font-size:12.5px;font-weight:600;color:' + sc + '">' + esc(st) + '</td>'
        + '<td style="padding:12px"><div style="display:flex;gap:13px;justify-content:center;color:#64748b">'
        + '<span class="fpa" data-a="print" title="Print">' + IC_PR + '</span>'
        + '<span class="fpa" data-a="share" title="Share">' + IC_SH + '</span>'
        + '<span class="fpa" data-a="menu" title="More Actions">' + IC_DOTS + '</span>'
        + '</div></td></tr>';
    }).join('');
    return '<table style="width:100%;border-collapse:collapse;min-width:760px"><thead>' + head + '</thead><tbody>' + body + '</tbody></table><div style="text-align:center;color:#94a3b8;font-size:12px;padding:14px">Zinaonyeshwa ' + Math.min(100, view.length) + ' kati ya ' + view.length + '</div>';
  }

  function chip(t) { return '<span style="background:#eef2f7;padding:6px 12px;border-radius:16px;color:#334155;font-size:12px;cursor:pointer">' + t + '</span>'; }
  function totCardInner() { return '<div style="font-size:12px;color:#64748b">Total Sales Amount</div><div style="font-size:24px;font-weight:600;margin:3px 0">' + money(tot) + '</div><div style="font-size:12px;color:#64748b">Received: <span style="color:#0f6e56">' + money(paid) + '</span> &nbsp;|&nbsp; Balance: <span style="color:#993c1d">' + money(bal) + '</span></div>'; }

  function build() {
    var el = document.getElementById('fpSkin'); if (!el) { el = document.createElement('div'); el.id = 'fpSkin'; document.documentElement.appendChild(el); }
    var L = window.innerWidth < 1024 ? 0 : 208;
    el.style.cssText = 'position:fixed;left:' + L + 'px;top:0;right:0;bottom:0;z-index:900000;background:#fff;overflow:auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2733';
    el.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #eef2f7">'
      + '<div style="flex:1;display:flex;align-items:center;gap:8px;background:#f4f6f9;border-radius:18px;padding:7px 13px;max-width:340px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="fpSearch" placeholder="Search Transactions" style="border:none;background:transparent;outline:none;font-size:13px;width:100%;color:#1f2733"></div>'
      + '<div style="flex:1"></div>'
      + '<span class="fpAdd" style="border:1px solid #f0997b;color:#d85a30;font-size:12px;font-weight:600;padding:6px 13px;border-radius:18px;cursor:pointer">+ Add Sale</span>'
      + '<span class="fpAddP" style="border:1px solid #85b7eb;color:#185fa5;font-size:12px;font-weight:600;padding:6px 13px;border-radius:18px;cursor:pointer">+ Add Purchase</span>'
      + '<span class="fpAddPlus" title="Add More" style="width:28px;height:28px;border-radius:8px;background:#e6f1fb;display:inline-flex;align-items:center;justify-content:center;color:#378add;font-size:18px;cursor:pointer">+</span>'
      + '<span class="fpPrintList" title="Chapa orodha" style="color:#64748b;cursor:pointer">' + IC_PR + '</span>'
      + '<span class="fpTopMenu" title="Zaidi" style="position:relative;cursor:pointer"><svg width="17" height="17" viewBox="0 0 24 24" fill="#64748b"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg><span style="position:absolute;top:-1px;right:-1px;width:7px;height:7px;background:#e2483d;border-radius:50%"></span></span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px 6px"><div class="fpTitleSwitch" title="Badilisha aina" style="font-size:20px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer">Sale Invoices <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div style="display:flex;align-items:center;gap:10px"><span class="fpAdd" style="background:#e2483d;color:#fff;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer">+ Add Sale</span><span class="fpTopMenu" title="Zaidi" style="width:32px;height:32px;border-radius:50%;background:#f1f5f9;display:inline-flex;align-items:center;justify-content:center;color:#64748b;cursor:pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></span></div></div>'
      + '<div style="display:flex;align-items:center;gap:10px;padding:4px 16px 12px;font-size:12px;flex-wrap:wrap"><span style="color:#64748b">Filter by :</span>'
      +   '<span style="display:inline-flex;align-items:center;background:#e9eefc;border-radius:22px;overflow:hidden;color:#39476a">'
      +     '<span class="fpPeriod" id="fpPeriodChip" title="Chagua kipindi" style="padding:7px 15px;cursor:pointer;font-weight:500">' + periodLabel + ' &#9662;</span>'
      +     '<span style="width:1px;align-self:stretch;background:#c6d2ef"></span>'
      +     '<span style="padding:6px 15px;display:inline-flex;align-items:center;gap:6px">&#128197; <input type="date" id="fpFrom" value="' + fromISO + '" style="border:none;background:transparent;font:inherit;color:#39476a;cursor:pointer;width:118px"> To <input type="date" id="fpTo" value="' + toISO + '" style="border:none;background:transparent;font:inherit;color:#39476a;cursor:pointer;width:118px"></span>'
      +   '</span>'
      +   '<span class="fpFirms" title="Chuja kwa duka" style="background:#e9eefc;padding:7px 16px;border-radius:22px;color:#39476a;cursor:pointer;font-weight:500">All Firms &#9662;</span>'
      +   '<span class="fpUsers" title="Chuja kwa mtumiaji" style="background:#e9eefc;padding:7px 16px;border-radius:22px;color:#39476a;cursor:pointer;font-weight:500">All Users &#9662;</span>'
      +   (fromISO || toISO || q ? '<span class="fpClear" title="Ondoa vichujio" style="color:#e2483d;cursor:pointer;padding:7px 4px">&#10005; Futa</span>' : '')
      + '</div>'
      + '<div style="padding:0 16px 14px"><div style="border:1px solid #dbe3ec;border-radius:10px;padding:14px 18px;background:#fbfcfe;max-width:410px" id="fpTotInner">' + totCardInner() + '</div></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:2px 16px 8px"><div style="font-size:15px;font-weight:600">Transactions</div><div style="display:flex;align-items:center;gap:14px;color:#64748b"><svg class="fpFocusSearch" title="Tafuta" style="cursor:pointer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><svg class="fpChart" title="Muhtasari" style="cursor:pointer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M8 16V9M13 16V6M18 16v-4"/></svg><span class="fpXls" title="Pakua Excel (CSV)" style="background:#1d9e75;color:#fff;font-size:10px;font-weight:600;padding:2px 5px;border-radius:4px;cursor:pointer">xls</span><span class="fpPrintList" title="Chapa orodha" style="cursor:pointer">' + IC_PR + '</span></div></div>'
      + '<div id="fpTableWrap" style="padding:0 16px 40px;overflow-x:auto">' + rowsHTML() + '</div>';
    el.setAttribute('data-built', '1');
    wire(el);
  }

  function wire(el) {
    var s = el.querySelector('#fpSearch');
    if (s) s.oninput = function () { q = this.value.trim().toLowerCase(); refresh(); };
    el.querySelectorAll('.fpAdd').forEach(function (b) { b.onclick = function () { openInvoiceBuilder(); }; });
    el.querySelectorAll('.fpAddP').forEach(function (b) { b.onclick = function () { clickApp(/^\+?\s*Purchase$/i); }; });
    el.querySelectorAll('.fpAddPlus').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); miniMenu(b, addMoreItems()); }; });
    var ts = el.querySelector('.fpTitleSwitch'); if (ts) ts.onclick = function (e) { e.stopPropagation(); miniMenu(ts, [['Sale Invoices', function () { clickNav(/Sale Invoices/i); }], ['Estimate / Quotation', function () { clickNav(/Estimate/i); }], ['Proforma Invoice', function () { clickNav(/Proforma/i); }], ['Payment-In', function () { clickNav(/Payment-?In/i); }], ['Sale Order', function () { clickNav(/Sale Order/i); }], ['Delivery Challan', function () { clickNav(/Delivery Challan/i); }], ['Sale Return / Credit Note', function () { clickNav(/Sale Return/i); }]]); };
    el.querySelectorAll('.fpPrintList').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); printList(); }; });
    el.querySelectorAll('.fpXls').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); exportCSV(); }; });
    el.querySelectorAll('.fpChart').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); summaryModal(); }; });
    el.querySelectorAll('.fpFocusSearch').forEach(function (b) { b.onclick = function () { var i = document.getElementById('fpSearch'); if (i) i.focus(); }; });
    el.querySelectorAll('.fpTopMenu').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); miniMenu(b, [['Onyesha upya', function () { DATA = null; load().then(function () { applyFilter(); build(); }); }], ['Pakua Excel (CSV)', exportCSV], ['Chapa orodha', printList], ['Muhtasari', summaryModal]]); }; });
    var pc = el.querySelector('.fpPeriod'); if (pc) pc.onclick = function (e) { e.stopPropagation(); miniMenu(pc, [['All Sale Invoices', function () { setPeriod('All Sale Invoices', '', ''); }], ['This Month', function () { setPeriod('This Month', monthStart(), monthEnd()); }], ['Last Month', function () { var r = lastMonthRange(); setPeriod('Last Month', r[0], r[1]); }], ['This Quarter', function () { setPeriod('This Quarter', quarterStart(), todayStr()); }], ['This Year', function () { setPeriod('This Year', yearStart(), todayStr()); }], ['Custom', function () { setPeriod('Custom', fromISO, toISO); }]]); };
    var ff = el.querySelector('#fpFrom'); if (ff) ff.onchange = function () { fromISO = this.value || ''; periodLabel = 'Custom'; refresh(); };
    var ft = el.querySelector('#fpTo'); if (ft) ft.onchange = function () { toISO = this.value || ''; periodLabel = 'Custom'; refresh(); };
    var fm = el.querySelector('.fpFirms'); if (fm) fm.onclick = function (e) { e.stopPropagation(); miniMenu(fm, [['All Firms', function () {}], ['FEMMAS PRINT', function () {}]]); };
    var fu = el.querySelector('.fpUsers'); if (fu) fu.onclick = function (e) { e.stopPropagation(); miniMenu(fu, [['All Users', function () {}]]); };
    var fcl = el.querySelector('.fpClear'); if (fcl) fcl.onclick = function () { q = ''; fromISO = ''; toISO = ''; periodLabel = 'Custom'; var si = document.getElementById('fpSearch'); if (si) si.value = ''; build(); };
    attachRows(el);
  }
  function clickApp(re) { var b = Array.prototype.slice.call(document.querySelectorAll('main button, header button')).find(function (x) { return re.test((x.textContent || '').trim()); }); if (b) b.click(); }
  function clickNav(re) { var a = Array.prototype.slice.call(document.querySelectorAll('aside a, aside button, nav a, main button')).find(function (x) { return re.test((x.textContent || '').trim()); }); if (a) a.click(); }
  function addMoreItems() { return [['Sale Invoice', function () { openInvoiceBuilder(); }], ['Payment-In', function () { clickNav(/Payment-?In/i); }], ['Sale Return / Credit Note', function () { clickNav(/Sale Return/i); }], ['Sale Order', function () { clickNav(/Sale Order/i); }], ['Estimate / Quotation', function () { clickNav(/Estimate/i); }], ['Proforma Invoice', function () { clickNav(/Proforma/i); }], ['Delivery Challan', function () { clickNav(/Delivery Challan/i); }], ['Purchase Bill', function () { clickApp(/^\+?\s*Purchase$/i); }]]; }

  function recFor(no) { return (DATA || []).find(function (r) { return String(r.InvoiceNo) === String(no); }) || {}; }

  function attachRows(el) {
    el.querySelectorAll('.fpr').forEach(function (r, i) {
      r.onmouseenter = function () { if (i !== 0) r.style.background = '#eaf3ff'; };
      r.onmouseleave = function () { if (i !== 0) r.style.background = ''; };
      r.ondblclick = function () { openPreview(recFor(r.getAttribute('data-no'))); };
      r.oncontextmenu = function (e) { e.preventDefault(); var mb = r.querySelector('.fpa[data-a="menu"]'); openMenu(mb || r, recFor(r.getAttribute('data-no'))); };
      r.querySelectorAll('.fpa').forEach(function (a) {
        a.style.cursor = 'pointer';
        a.onclick = function (e) {
          e.stopPropagation(); var act = a.getAttribute('data-a'); var rec = recFor(r.getAttribute('data-no'));
          if (act === 'print') { openPreview(rec); }
          else if (act === 'share') { shareInvoice(rec); }
          else if (act === 'menu') { openMenu(a, rec); }
        };
      });
    });
  }

  /* ---- More Actions menu ---- */
  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function openMenu(anchor, rec) {
    closeMenu();
    menuEl = document.createElement('div');
    menuEl.style.cssText = 'position:fixed;z-index:2147483600;width:226px;background:#fff;border:1px solid #d7dee8;border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.2);padding:6px;font-size:13px;color:#1f2733';
    var acts = ACT.map(function (a) { return (a[2] === 'payhist' && num(rec.Balance) > 0) ? ['clock', 'Receive Payment', 'recvpay', 0] : a; });
    menuEl.innerHTML = acts.map(function (a) { return '<div class="fpmi" data-k="' + a[2] + '" style="display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:7px;cursor:pointer;white-space:nowrap;' + (a[3] ? 'color:#e2483d;' : '') + '">' + MIC[a[0]] + '<span>' + a[1] + '</span></div>'; }).join('');
    document.documentElement.appendChild(menuEl);
    var rc = anchor.getBoundingClientRect(); var w = 226, h = menuEl.offsetHeight || 360;
    var left = Math.min(rc.right - w, window.innerWidth - w - 8); if (left < 8) left = 8;
    var top = rc.bottom + 4; if (top + h > window.innerHeight - 8) top = Math.max(8, rc.top - h);
    menuEl.style.left = left + 'px'; menuEl.style.top = top + 'px';
    menuEl.querySelectorAll('.fpmi').forEach(function (it) {
      it.onmouseenter = function () { it.style.background = '#f1f5f9'; }; it.onmouseleave = function () { it.style.background = ''; };
      it.onclick = function (e) { e.stopPropagation(); var k = it.getAttribute('data-k'); closeMenu(); doAction(k, rec); };
    });
  }
  function doAction(k, rec) {
    if (k === 'preview' || k === 'openpdf' || k === 'print' || k === 'edit') openPreview(rec);
    else if (k === 'challan') openPreview(rec, true);
    else if (k === 'payhist') modal('Payment History', '<div style="padding:18px 20px;font-size:14px;line-height:2">Received during Sale : <b>' + Math.round(num(rec.PaidAmount)).toLocaleString('en-US') + '</b>' + (num(rec.Balance) > 0 ? '<br>Balance : <b style="color:#993c1d">' + Math.round(num(rec.Balance)).toLocaleString('en-US') + '</b>' : '') + '</div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">CLOSE</span>');
    else if (k === 'recvpay') modal('Receive Payment', '<div style="padding:20px;font-size:14px;line-height:1.9">Salio linalodaiwa (Balance due): <b style="color:#993c1d">' + money(rec.Balance) + '</b><br><br>Kupokea malipo (record payment) kunaunganishwa na backend salama — kinakuja hatua inayofuata.</div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
    else modal(({ 'return': 'Convert To Return', 'cancel': 'Cancel Invoice', 'delete': 'Delete', 'dup': 'Duplicate', 'hist': 'View History' })[k] || 'Kitendo', '<div style="padding:20px;font-size:14px;line-height:1.6">Kitendo hiki kinaunganishwa na backend salama — kinakuja hatua inayofuata.</div>', '<span class="fpx" style="border:1px solid #cbd5e1;color:#334155;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
  }

  /* ---- New Invoice builder (skin-side, real line items; saves invoice via the
   * app's existing generic saveRow, items kept per-invoice in localStorage) ---- */
  var nbItems = [];
  function invItemsKey(no) { return 'fp_inv_items_' + String(no).replace(/[^A-Za-z0-9]/g, '_'); }
  function loadInvItems(no) { try { var a = JSON.parse(localStorage.getItem(invItemsKey(no)) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function nextInvNo() { var max = 0; (DATA || []).forEach(function (r) { var m = String(r.InvoiceNo || '').match(/(\d+)\s*$/); if (m) { var n = +m[1]; if (n > max) max = n; } }); return 'FP/INV/' + String(max + 1).padStart(4, '0'); }
  function nbTotal() { var t = 0; nbItems.forEach(function (it) { t += (num(it.qty) || 0) * (num(it.price) || 0); }); return t; }
  function nbRowsHTML() {
    return nbItems.map(function (it, i) {
      var amt = (num(it.qty) || 0) * (num(it.price) || 0);
      return '<tr data-i="' + i + '"><td style="padding:4px"><input class="nbF" data-k="name" value="' + esc(it.name || '') + '" placeholder="Item / Kazi" style="width:100%;border:1px solid #dbe3ec;border-radius:8px;padding:7px 9px;font:inherit"></td>'
        + '<td style="padding:4px;width:64px"><input class="nbF" data-k="qty" value="' + esc(it.qty || '') + '" inputmode="decimal" style="width:100%;border:1px solid #dbe3ec;border-radius:8px;padding:7px 9px;font:inherit;text-align:right"></td>'
        + '<td style="padding:4px;width:66px"><input class="nbF" data-k="unit" value="' + esc(it.unit || '') + '" placeholder="Pcs" style="width:100%;border:1px solid #dbe3ec;border-radius:8px;padding:7px 9px;font:inherit"></td>'
        + '<td style="padding:4px;width:104px"><input class="nbF" data-k="price" value="' + esc(it.price || '') + '" inputmode="decimal" style="width:100%;border:1px solid #dbe3ec;border-radius:8px;padding:7px 9px;font:inherit;text-align:right"></td>'
        + '<td style="padding:4px;text-align:right;white-space:nowrap;font-weight:600;font-size:12px">' + money(amt) + '</td>'
        + '<td style="padding:4px"><span class="nbDel" data-i="' + i + '" style="cursor:pointer;color:#e2483d;font-size:18px">&times;</span></td></tr>';
    }).join('');
  }
  function openInvoiceBuilder() {
    nbItems = [{ name: '', qty: '1', unit: 'Pcs', price: '' }];
    var body = '<div style="padding:16px 20px">'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">'
      + '<label style="flex:1;min-width:180px;font-size:12px;color:#475569">Customer <span style="color:#e11d48">*</span><input id="nbCust" placeholder="Jina la mteja" style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '<label style="width:150px;font-size:12px;color:#475569">Phone<input id="nbPhone" placeholder="0..." style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '<label style="width:150px;font-size:12px;color:#475569">Date<input id="nbDate" type="date" style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '</div>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left;font-size:11px;color:#64748b"><th style="padding:4px 5px">Item / Kazi</th><th style="padding:4px 5px;text-align:right">Qty</th><th style="padding:4px 5px">Unit</th><th style="padding:4px 5px;text-align:right">Price</th><th style="padding:4px 5px;text-align:right">Amount</th><th></th></tr></thead><tbody id="nbBody">' + nbRowsHTML() + '</tbody></table>'
      + '<div style="margin-top:8px"><span id="nbAdd" style="cursor:pointer;color:#185fa5;font-weight:600;font-size:13px">+ Ongeza item</span></div>'
      + '<div style="display:flex;justify-content:flex-end;gap:22px;margin-top:14px;align-items:center"><label style="font-size:12px;color:#475569">Paid<input id="nbPaid" inputmode="decimal" placeholder="0" style="width:130px;margin-left:8px;border:1px solid #dbe3ec;border-radius:9px;padding:8px 10px;font:inherit;text-align:right"></label><div style="font-size:15px;font-weight:800">Total: <span id="nbTot">' + money(nbTotal()) + '</span></div></div>'
      + '<div id="nbErr" style="color:#e11d48;font-size:12.5px;margin-top:8px"></div>'
      + '</div>';
    modal('New Invoice', body, '<span class="fpx fpbtn" style="border:1px solid #cbd5e1;color:#334155;border-radius:20px;padding:8px 16px;font-weight:600;cursor:pointer">Ghairi</span><span id="nbSave" class="fpbtn" style="border:none;background:#e2483d;color:#fff;border-radius:20px;padding:8px 18px;font-weight:700;cursor:pointer">Save Invoice</span>');
    var dEl = document.getElementById('nbDate'); if (dEl) dEl.value = todayStr();
    wireBuilder();
  }
  function wireBuilder() {
    var body = document.getElementById('nbBody');
    function reRows() { if (body) { body.innerHTML = nbRowsHTML(); bindRows(); } var tt = document.getElementById('nbTot'); if (tt) tt.textContent = money(nbTotal()); }
    function bindRows() {
      body.querySelectorAll('.nbF').forEach(function (inp) { inp.oninput = function () { var tr = inp.closest('tr'); var i = +tr.getAttribute('data-i'); var k = inp.getAttribute('data-k'); if (nbItems[i]) nbItems[i][k] = inp.value; var amtCell = tr.children[4]; if (amtCell) amtCell.textContent = money((num(nbItems[i].qty) || 0) * (num(nbItems[i].price) || 0)); var tt = document.getElementById('nbTot'); if (tt) tt.textContent = money(nbTotal()); }; });
      body.querySelectorAll('.nbDel').forEach(function (x) { x.onclick = function () { var i = +x.getAttribute('data-i'); nbItems.splice(i, 1); if (!nbItems.length) nbItems = [{ name: '', qty: '1', unit: 'Pcs', price: '' }]; reRows(); }; });
    }
    if (body) bindRows();
    var add = document.getElementById('nbAdd'); if (add) add.onclick = function () { nbItems.push({ name: '', qty: '1', unit: 'Pcs', price: '' }); reRows(); };
    var sv = document.getElementById('nbSave'); if (sv) sv.onclick = saveNewInvoice;
  }
  function saveNewInvoice() {
    var cust = ((document.getElementById('nbCust') || {}).value || '').trim();
    var err = document.getElementById('nbErr');
    var items = nbItems.filter(function (it) { return (it.name || '').trim() && num(it.price) > 0; });
    if (!cust) { if (err) err.textContent = 'Weka jina la mteja.'; return; }
    if (!items.length) { if (err) err.textContent = 'Weka angalau item moja yenye jina na bei.'; return; }
    var total = nbTotal(), paid = num((document.getElementById('nbPaid') || {}).value || 0), bal = total - paid;
    var status = bal <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');
    var dv = (document.getElementById('nbDate') || {}).value || todayStr();
    var phone = (document.getElementById('nbPhone') || {}).value || '';
    var no = nextInvNo();
    var rec = { InvoiceNo: no, Date: dv, CustomerName: cust, Phone: phone, TotalAmount: total, PaidAmount: paid, Balance: bal, Status: status };
    try { localStorage.setItem(invItemsKey(no), JSON.stringify(items.map(function (it) { return { name: it.name, qty: it.qty || '1', unit: it.unit || '', price: it.price, amount: (num(it.qty) || 0) * (num(it.price) || 0) }; }))); } catch (e) {}
    var url = backend(); var sv = document.getElementById('nbSave'); if (sv) { sv.textContent = 'Inahifadhi…'; sv.onclick = null; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveRow', tab: 'Invoices', record: rec }) }).then(function (r) { return r.json(); }).then(function () {
      closeOv(); nbItems = []; DATA = null; load().then(function () { applyFilter(); build(); });
    }).catch(function () { if (err) err.textContent = 'Imeshindwa kuhifadhi — angalia Sync.'; if (sv) { sv.textContent = 'Save Invoice'; sv.onclick = saveNewInvoice; } });
  }

  /* ---- A4 invoice preview — matches the "utu kwanza" (Invoice 815) Vyapar layout ---- */
  function sheetHTML(d, wp) {
    function md(n) { return 'Sh ' + Math.round(num(n)).toLocaleString('en-US') + '.0'; }
    function dd(s) { if (!s) return ''; var x = new Date(s); if (isNaN(x.getTime())) return String(s); return ('0' + x.getDate()).slice(-2) + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + x.getFullYear(); }
    var total = num(d.TotalAmount), paid = num(d.PaidAmount), bal = num(d.Balance); var BLUE = '#0979a7';
    var its = loadInvItems(d.InvoiceNo); var real = its.length > 0; var qsum = 0;
    if (real) its.forEach(function (it) { qsum += (num(it.qty) || 0); }); else qsum = 1;
    var itemRows = real ? its.map(function (it, i) { var amt = num(it.amount) || (num(it.qty) || 0) * (num(it.price) || 0); return '<tr><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;vertical-align:top">' + (i + 1) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef"><div style="font-weight:700">' + esc(it.name || '') + '</div></td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + esc(it.qty || '1') + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + esc(it.unit || '—') + '</td>' + (wp ? '' : '<td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(num(it.price)) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(amt) + '</td>') + '</tr>'; }).join('')
      : '<tr><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;vertical-align:top">1</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef"><div style="font-weight:700">Kazi / Huduma</div><div style="font-size:10.5px;color:#8a8f98">(Goods / Services)</div></td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">1</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">—</td>' + (wp ? '' : '<td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(total) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(total) + '</td>') + '</tr>';
    return '<div id="fpSheet" style="position:relative;overflow:hidden;background:#fff;color:#1f2733;max-width:794px;margin:0 auto;padding:34px 40px;font-family:Asap,Arial,sans-serif;font-size:12.5px">'
      + '<img src="/femmas-logo-03-mqrt99vq.png" alt="" style="position:absolute;top:52%;left:50%;transform:translate(-50%,-50%) rotate(-18deg);width:66%;opacity:.06;pointer-events:none;z-index:0">'
      + '<div style="position:relative;z-index:1">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #1f2733;padding-bottom:14px"><div><div style="font-size:26px;font-weight:800;color:#111">FEMMAS PRINT</div><div style="font-size:11px;color:#333;line-height:1.7;margin-top:6px">AMANI &amp; CONGO Street, Jangwani, Ilala-Dar es Salaam<br>Phone no. : +255658843344<br>Email : femmasprint@gmail.com<br>TIN : 102-075-552</div></div><img src="/femmas-logo-03-mqrt99vq.png" style="width:74px;height:74px;object-fit:contain"></div>'
      + '<div style="text-align:center;font-size:24px;font-weight:800;color:' + BLUE + ';padding:16px 0 12px">' + (wp ? 'Delivery Challan' : 'Invoice') + '</div>'
      + '<div style="display:flex;justify-content:space-between;gap:16px"><div><div style="font-weight:800">Bill To</div><div style="font-weight:800;margin-top:4px">' + esc((d.CustomerName || '—').toUpperCase()) + '</div></div><div style="text-align:right"><div style="font-weight:800">Invoice Details</div><div style="margin-top:4px;line-height:1.9">Invoice No. : ' + esc(d.InvoiceNo || '') + '<br>Date : ' + dd(d.Date) + '</div></div></div>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:14px"><thead><tr style="background:' + BLUE + ';color:#fff;text-align:left;font-size:11.5px"><th style="padding:8px 10px">#</th><th style="padding:8px 10px">Item name</th><th style="padding:8px 10px;text-align:right">Quantity</th><th style="padding:8px 10px;text-align:right">Unit</th>' + (wp ? '' : '<th style="padding:8px 10px;text-align:right">Price/ Unit</th><th style="padding:8px 10px;text-align:right">Amount</th>') + '</tr></thead><tbody>'
      + itemRows
      + '<tr><td style="padding:9px 10px"></td><td style="padding:9px 10px;font-weight:800">Total</td><td style="padding:9px 10px;text-align:right;font-weight:800">' + qsum + '</td><td></td>' + (wp ? '' : '<td></td><td style="padding:9px 10px;text-align:right;font-weight:800">' + md(total) + '</td>') + '</tr></tbody></table>'
      + (wp ? '<div style="margin-top:12px;font-size:11px;color:#5b6675">Hati ya usafirishaji — items na idadi tu (bila bei).</div>' : '<div style="display:flex;justify-content:space-between;gap:26px;margin-top:16px"><div style="flex:1;font-size:11.5px;line-height:1.6"><div style="margin-bottom:10px"><strong>Invoice Amount in Words:</strong> ' + numToWords(total) + ' only</div><div style="margin-bottom:10px"><strong>Payment mode:</strong> FP BANK</div><div style="margin-bottom:10px"><strong>Terms and Conditions</strong> Validity of Price: 30 Days from Date of Issue.<br>Delivery Period: 7 Days after approval of artwork.<br>Payment terms: 70% advance, 30% ON DELIVERY!</div><div style="margin-bottom:10px">Payment Details:<br>Account Name: Femmas Print<br>Account no: 0150322619500 (CRDB Bank)</div><div style="margin-bottom:10px">Merchant Name: Femmas Print<br>Lipa Number: 5521084 (Tigo)<br>Lipa Number: 5767888 (Voda)</div><div style="margin-top:14px"><strong>Bank Details</strong><br>Name : CRDB BANK<br>Account No. : 0150322619500<br>Account holder\'s name : FEMMAS PRINT</div></div><div style="width:270px;font-size:12.5px"><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eef1f5"><span>Sub Total</span><span>' + md(total) + '</span></div><div style="display:flex;justify-content:space-between;padding:9px 0;font-weight:800;border-top:2px solid #1f2733;border-bottom:2px solid #1f2733"><span>Total</span><span>' + md(total) + '</span></div><div style="display:flex;justify-content:space-between;padding:6px 0"><span>Received</span><span>' + md(paid) + '</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eef1f5"><span>Balance</span><span>' + md(bal) + '</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;margin-top:10px"><span>Previous Balance</span><span>Sh 0.0</span></div><div style="display:flex;justify-content:space-between;padding:6px 0"><span>Current Balance</span><span>' + md(bal) + '</span></div></div></div>')
      + '<div style="display:flex;justify-content:flex-end;margin-top:26px"><div style="text-align:center;width:210px"><div style="font-size:12px;margin-bottom:2px">For : <strong>FEMMAS PRINT</strong></div><img src="/femmas-signature.png" style="height:46px;object-fit:contain;display:block;margin:0 auto;mix-blend-mode:multiply"><div style="font-weight:800;font-size:12px;margin-top:2px">Authorized Signatory</div></div></div>'
      + '</div></div>';
  }

  var ov = null;
  function closeOv() { if (ov) { ov.remove(); ov = null; } }
  function modal(title, body, foot) {
    closeOv();
    ov = document.createElement('div'); ov.id = 'fpOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483500;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = '<div style="background:#fff;color:#1f2733;border-radius:12px;max-width:860px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 26px 64px rgba(0,0,0,.4)"><div style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #e6ebf2;font-weight:600;font-size:16px">' + title + '<span class="fpx" style="cursor:pointer;font-size:22px;color:#94a3b8">&times;</span></div><div style="overflow:auto">' + body + '</div>' + (foot ? '<div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 18px;border-top:1px solid #e6ebf2">' + foot + '</div>' : '') + '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.fpx')) { closeOv(); return; } if (e.target.closest('.fpPrint')) { printSheet(); } else if (e.target.closest('.fpShare')) { shareInvoice(curDoc || {}); } });
    document.documentElement.appendChild(ov);
  }
  function openPreview(rec, challan) {
    curDoc = rec;
    var foot = '<span class="fpPrint fpbtn" style="border:1px solid #f0997b;color:#d85a30">Open PDF</span><span class="fpPrint fpbtn" style="border:1px solid #85b7eb;color:#185fa5">Print</span><span class="fpPrint fpbtn" style="border:1px solid #9fe1cb;color:#0f6e56">Save PDF</span><span class="fpShare fpbtn" style="border:1px solid #25d366;background:#25d366;color:#fff">Sambaza WhatsApp</span><span class="fpx fpbtn" style="border:1px solid #e2483d;color:#e2483d">Close</span>';
    modal(challan ? 'Delivery Challan' : 'Invoice', sheetHTML(rec, challan), foot);
    if (ov) ov.querySelectorAll('.fpbtn').forEach(function (b) { b.style.borderRadius = '20px'; b.style.padding = '7px 15px'; b.style.fontSize = '13px'; b.style.fontWeight = '600'; b.style.cursor = 'pointer'; b.style.background = b.style.background || 'transparent'; });
  }
  function printSheet() {
    var sh = document.getElementById('fpSheet'); if (!sh) return;
    var old = document.getElementById('fpPrintArea'); if (old) old.remove();
    var area = document.createElement('div'); area.id = 'fpPrintArea'; area.innerHTML = sh.outerHTML;
    if (!document.getElementById('fpPrintStyle')) { var ps = document.createElement('style'); ps.id = 'fpPrintStyle'; ps.textContent = '@media print{ body{display:none !important} #fpSkin{display:none !important} #fpOverlay{display:none !important} #fpPrintArea{display:block !important} }'; document.head.appendChild(ps); }
    document.documentElement.appendChild(area);
    setTimeout(function () { try { window.print(); } catch (e) {} setTimeout(function () { var a = document.getElementById('fpPrintArea'); if (a) a.remove(); }, 900); }, 120);
  }
  function shareText(d) { var L = ['FEMMAS PRINT', 'Invoice ' + (d.InvoiceNo || '') + '  |  ' + fmtDate(d.Date), '']; if (d.CustomerName) L.push('Bill To: ' + d.CustomerName); L.push('Total: ' + money(d.TotalAmount)); if (num(d.PaidAmount)) L.push('Received: ' + money(d.PaidAmount)); if (num(d.Balance)) L.push('Balance: ' + money(d.Balance)); L.push(''); L.push('Malipo: CRDB 0150322619500 (Femmas Print)'); L.push('Lipa: 5521084 (Tigo) / 5767888 (Voda)'); L.push('Asante kwa biashara!'); L.push(''); L.push('Umefurahia huduma? Tuandikie review Google: https://www.google.com/maps?cid=9015672156949326110'); return L.join('\n'); }
  function shareInvoice(d) { var phone = normPhone(d.Phone || ''); window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(shareText(d)), '_blank'); }

  /* ---- List-level actions (top toolbar + Transactions header icons) ---- */
  function printList() {
    var body = view.map(function (r, i) { return '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">' + (i + 1) + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee">' + esc(fmtDate(r.Date)) + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee">' + esc(r.InvoiceNo || '') + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee">' + esc(r.CustomerName || '') + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + money(r.TotalAmount) + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + money(r.Balance) + '</td><td style="padding:6px 8px;border-bottom:1px solid #eee">' + esc(r.Status || '') + '</td></tr>'; }).join('');
    var html = '<div id="fpSheet" style="font-family:Asap,sans-serif;color:#1f2733;padding:24px"><div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #13315a;padding-bottom:10px;margin-bottom:12px"><div style="font-size:18px;font-weight:800;color:#13315a">FEMMAS PRINT — Sale Invoices</div><div style="font-size:11.5px;color:#5b6675">Total: ' + money(tot) + ' &middot; Received: ' + money(paid) + ' &middot; Balance: ' + money(bal) + '</div></div><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#13315a;color:#fff;text-align:left"><th style="padding:7px 8px">#</th><th style="padding:7px 8px">Date</th><th style="padding:7px 8px">Invoice no</th><th style="padding:7px 8px">Party Name</th><th style="padding:7px 8px;text-align:right">Amount</th><th style="padding:7px 8px;text-align:right">Balance</th><th style="padding:7px 8px">Status</th></tr></thead><tbody>' + body + '</tbody></table></div>';
    var old = document.getElementById('fpPrintArea'); if (old) old.remove();
    var area = document.createElement('div'); area.id = 'fpPrintArea'; area.innerHTML = html;
    if (!document.getElementById('fpPrintStyle')) { var ps = document.createElement('style'); ps.id = 'fpPrintStyle'; ps.textContent = '@media print{ body{display:none !important} #fpSkin{display:none !important} #fpOverlay{display:none !important} #fpPrintArea{display:block !important} }'; document.head.appendChild(ps); }
    document.documentElement.appendChild(area);
    setTimeout(function () { try { window.print(); } catch (e) {} setTimeout(function () { var a = document.getElementById('fpPrintArea'); if (a) a.remove(); }, 900); }, 120);
  }
  function exportCSV() {
    var head = ['Date', 'Invoice no', 'Party Name', 'Transaction', 'Payment Type', 'Amount', 'Balance', 'Status'];
    var lines = [head.join(',')];
    view.forEach(function (r) { var b = num(r.Balance); var cells = [fmtDate(r.Date), r.InvoiceNo || '', r.CustomerName || '', 'Sale', (b <= 0 ? 'Cash' : 'FP BANK'), num(r.TotalAmount), num(r.Balance), r.Status || '']; lines.push(cells.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',')); });
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }); var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'Sale_Invoices.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function summaryModal() {
    modal('Muhtasari — Sale Invoices', '<div style="padding:20px 22px;font-size:14px;line-height:2"><div>Jumla ya invoice: <b>' + view.length + '</b></div><div>Total Sales: <b>' + money(tot) + '</b></div><div>Imelipwa (Received): <b style="color:#0f6e56">' + money(paid) + '</b></div><div>Salio (Balance): <b style="color:#993c1d">' + money(bal) + '</b></div></div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
  }
  function miniMenu(anchor, items) {
    closeMenu();
    menuEl = document.createElement('div');
    menuEl.style.cssText = 'position:fixed;z-index:2147483600;min-width:190px;background:#fff;border:1px solid #d7dee8;border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.2);padding:6px;font-size:13px;color:#1f2733';
    menuEl.innerHTML = items.map(function (it, i) { return '<div class="fpmm" data-i="' + i + '" style="padding:8px 10px;border-radius:7px;cursor:pointer;white-space:nowrap">' + it[0] + '</div>'; }).join('');
    document.documentElement.appendChild(menuEl);
    var rc = anchor.getBoundingClientRect(); var w = 190;
    var left = Math.min(rc.right - w, window.innerWidth - w - 8); if (left < 8) left = 8;
    menuEl.style.left = left + 'px'; menuEl.style.top = (rc.bottom + 4) + 'px';
    menuEl.querySelectorAll('.fpmm').forEach(function (mi) {
      mi.onmouseenter = function () { mi.style.background = '#f1f5f9'; }; mi.onmouseleave = function () { mi.style.background = ''; };
      mi.onclick = function (e) { e.stopPropagation(); var fn = items[+mi.getAttribute('data-i')][1]; closeMenu(); try { fn(); } catch (er) {} };
    });
  }

  document.addEventListener('click', function (e) { if (menuEl && !e.target.closest('.fpa') && !menuEl.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeOv(); } });
  window.addEventListener('scroll', closeMenu, true);

  var busy = false, t = null;
  function shell() {
    var el = document.getElementById('fpSkin');
    if (!el) {
      el = document.createElement('div'); el.id = 'fpSkin'; document.documentElement.appendChild(el);
      var L = window.innerWidth < 1024 ? 0 : 208;
      el.style.cssText = 'position:fixed;left:' + L + 'px;top:0;right:0;bottom:0;z-index:900000;background:#fff;overflow:auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2733';
      el.innerHTML = '<div style="padding:16px"><div style="height:40px;background:#f4f6f9;border-radius:18px;max-width:340px;margin-bottom:16px"></div><div style="height:26px;width:200px;background:#eef2f7;border-radius:8px;margin:6px 0 14px"></div><div style="height:96px;max-width:410px;background:#f7f9fc;border:1px solid #eef2f7;border-radius:10px;margin-bottom:16px"></div><div style="color:#94a3b8;font-size:13px">Inapakia Sale Invoices…</div></div>';
    }
    return el;
  }
  function tick() {
    var on = isInvPage(); var el = document.getElementById('fpSkin');
    if (on) {
      if (!el) { el = shell(); }                       // opaque cover instantly — hides the old page (no flash)
      if (DATA) { if (el.getAttribute('data-built') !== '1') { applyFilter(); build(); } }
      else if (!busy) { busy = true; load().then(function () { busy = false; applyFilter(); if (isInvPage()) build(); }); }
    } else { if (el) el.remove(); }
  }
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () { tick(); setInterval(tick, 400); });
})();

/* FEMMAS PRINT — Quick Sale daily-expense "removed today" fix.
 * The Nauli expense template (fp_daily_exp_tpl) auto-seeds names (Stive, Kwedy, ...)
 * into today's expenses every day and re-adds them after deletion. This makes a
 * deleted name stay gone for TODAY only, while the master template is preserved so
 * the name returns tomorrow. Touches only localStorage + window.confirm; fully defensive. */
(function () {
  if (window.__fpQsExpFix) return; window.__fpQsExpFix = true;
  try {
    var LS = window.localStorage;
    var origGet = LS.getItem.bind(LS);
    var origSet = LS.setItem.bind(LS);
    var TPL = 'fp_daily_exp_tpl';
    function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function remKey() { return 'fp_exp_removed_' + todayISO(); }
    function removedList() { try { var a = JSON.parse(origGet(remKey()) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function removedLower() { return removedList().map(function (s) { return String(s).trim().toLowerCase(); }); }
    function addRemoved(name) { try { var n = String(name || '').trim(); if (!n) return; var a = removedList(); if (a.map(function (s) { return String(s).trim().toLowerCase(); }).indexOf(n.toLowerCase()) < 0) { a.push(n); origSet(remKey(), JSON.stringify(a)); } } catch (e) {} }
    function tplNamesLower() { try { return (JSON.parse(origGet(TPL) || '[]') || []).map(function (x) { return String(x && x.name || '').trim().toLowerCase(); }).filter(Boolean); } catch (e) { return []; } }

    // 1) Seeding read: hide today's removed names from the template the app seeds from.
    LS.getItem = function (k) {
      var v = origGet(k);
      if (k === TPL && v) {
        try {
          var rem = removedLower();
          if (rem.length) {
            var arr = JSON.parse(v);
            if (Array.isArray(arr)) return JSON.stringify(arr.filter(function (x) { return !(x && x.name && rem.indexOf(String(x.name).trim().toLowerCase()) > -1); }));
          }
        } catch (e) {}
      }
      return v;
    };

    // 2) Persist guard: whenever the template is re-saved, keep any name that is
    // "removed today" but still in the stored master template (so it returns tomorrow).
    LS.setItem = function (k, val) {
      if (k === TPL) {
        try {
          var rem = removedLower();
          if (rem.length) {
            var oldArr = JSON.parse(origGet(TPL) || '[]') || [];
            var newArr = JSON.parse(val) || [];
            var have = {}; newArr.forEach(function (x) { if (x && x.name) have[String(x.name).trim().toLowerCase()] = 1; });
            oldArr.forEach(function (x) { if (x && x.name) { var low = String(x.name).trim().toLowerCase(); if (rem.indexOf(low) > -1 && !have[low]) { newArr.push(x); have[low] = 1; } } });
            val = JSON.stringify(newArr);
          }
        } catch (e) {}
      }
      return origSet(k, val);
    };

    // 3) Record a deletion: when a Nauli/template row is deleted (confirmed), mark it
    // removed for today so the seeder won't bring it back until tomorrow.
    var pendingEl = null;
    document.addEventListener('click', function (e) { pendingEl = e.target; }, true);
    function nameFromEl(el) { var scan = el; for (var d = 0; d < 8 && scan; d++) { if (scan.querySelectorAll) { var ins = scan.querySelectorAll('input'); for (var i = 0; i < ins.length; i++) { var val = (ins[i].value || '').trim(); if (val) return val; } } scan = scan.parentElement; } return ''; }
    var origConfirm = window.confirm;
    window.confirm = function (msg) {
      var r = origConfirm.apply(window, arguments);
      try {
        if (r && pendingEl && /kufuta safu/i.test(String(msg || ''))) {
          var nm = nameFromEl(pendingEl);
          if (nm && tplNamesLower().indexOf(nm.toLowerCase()) > -1) addRemoved(nm);
        }
      } catch (e) {}
      pendingEl = null;
      return r;
    };
  } catch (e) {}
})();
