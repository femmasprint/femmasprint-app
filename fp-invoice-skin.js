/* FEMMAS PRINT — Sale Invoices "exact mockup" skin.
 * Renders the approved Vyapar-style page over the app's Sale Invoices list,
 * populated from the live backend, with working search, More-Actions menu,
 * real A4 invoice Preview, WhatsApp share and Add Sale. Loaded by the edge
 * middleware as <script src="/fp-invoice-skin.js" defer>. Fully defensive.
 */
(function () {
  if (window.__fpSkin) return; window.__fpSkin = true;

  function backend() { try { return (localStorage.getItem('fp_backend_url') || '').trim(); } catch (e) { return ''; } }
  var DATA = null, view = [], q = '', tot = 0, paid = 0, bal = 0, curDoc = null, fromISO = '', toISO = '', periodLabel = 'Custom', sortKey = 'Date', sortDir = 'desc', statusF = 'All';

  function num(n) { return +String(n == null ? '' : n).replace(/[^0-9.-]/g, '') || 0; }
  function money(n) { return 'Sh ' + Math.round(num(n)).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function normPhone(s) { var x = String(s || '').replace(/[^0-9]/g, ''); if (!x) return ''; if (x.charAt(0) === '0') x = '255' + x.slice(1); else if (x.slice(0, 3) !== '255' && x.length <= 9) x = '255' + x; return x; }
  // Robust date parser — handles ISO (2026-07-14 / full ISO) AND the backend's
  // DD-MM-YYYY / DD/MM/YYYY sheet format. Returns a Date or null (never throws).
  function parseD(s) {
    if (!s) return null; if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
    s = String(s).trim();
    var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (m) { var dt = new Date(+m[3], +m[2] - 1, +m[1]); return isNaN(dt.getTime()) ? null : dt; }
    var d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(s) { var d = parseD(s); if (!d) return String(s || ''); var dd = ('0' + d.getDate()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2); return dd + '/' + mm + '/' + d.getFullYear(); }
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
      // Newest first, robust to whatever order the backend returns. Undated rows last.
      DATA.sort(function (a, b) { var da = parseD(a.Date), db = parseD(b.Date); var ta = da ? da.getTime() : -Infinity, tb = db ? db.getTime() : -Infinity; return tb - ta; });
      return DATA;
    }).catch(function () { return []; });
  }

  function isInvPage() {
    try {
      // If the app's Add-Sale / Add-Purchase form or any app modal is open (z-index 60/70/80),
      // step aside so it is visible — the skin must never cover a real app form.
      if (document.querySelector('div[style*="z-index: 60"], div[style*="z-index: 70"], div[style*="z-index: 80"], div[style*="z-index:60"], div[style*="z-index:70"], div[style*="z-index:80"]')) return false;
      var m = document.querySelector('main'); if (!m) return false; var t = m.textContent || '';
      return !!document.querySelector('.fpInvWorkspace') || /Sales Invoice Workspace/i.test(t) || (t.indexOf('Total Invoices') > -1 && /Sale Invoices/.test(t));
    } catch (e) { return false; }
  }

  function toISODate(s) { var d = parseD(s); if (!d) return ''; return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function applyFilter() {
    view = (DATA || []).filter(function (r) {
      if (q) { var s = ((r.InvoiceNo || '') + ' ' + (r.CustomerName || '')).toLowerCase(); if (s.indexOf(q) < 0) return false; }
      if (fromISO || toISO) { var dd = toISODate(r.Date); if (!dd) return true; if (fromISO && dd < fromISO) return false; if (toISO && dd > toISO) return false; }
      if (statusF !== 'All' && String(r.Status || '').toLowerCase() !== statusF.toLowerCase()) return false;
      return true;
    });
    sortView();
    tot = 0; paid = 0; bal = 0;
    view.forEach(function (r) { tot += num(r.TotalAmount); paid += num(r.PaidAmount); bal += num(r.Balance); });
  }
  // Column sort — the funnel icons in each header actually work now.
  function sortVal(r, k) {
    if (k === 'Date') { var d = parseD(r.Date); return d ? d.getTime() : -Infinity; }
    if (k === 'InvoiceNo') { var m = String(r.InvoiceNo || '').match(/(\d+)\s*$/); return m ? +m[1] : num(r.InvoiceNo); }
    if (k === 'TotalAmount' || k === 'Balance') return num(r[k]);
    if (k === 'PayType') return (num(r.Balance) <= 0 ? 'cash' : 'fp bank');
    if (k === 'Transaction') return 'sale';
    return String(r[k] || '').toLowerCase();
  }
  function sortView() {
    if (!sortKey) return;
    view.sort(function (a, b) { var av = sortVal(a, sortKey), bv = sortVal(b, sortKey); if (av < bv) return sortDir === 'asc' ? -1 : 1; if (av > bv) return sortDir === 'asc' ? 1 : -1; return 0; });
  }
  function toast(msg) { var d = document.createElement('div'); d.textContent = msg; d.style.cssText = 'position:fixed;left:50%;bottom:42px;transform:translateX(-50%);background:#1f2733;color:#fff;padding:11px 18px;border-radius:10px;font-size:13px;z-index:2147483647;box-shadow:0 8px 26px rgba(0,0,0,.32);max-width:80%;text-align:center'; document.documentElement.appendChild(d); setTimeout(function () { try { d.remove(); } catch (e) {} }, 2800); }
  function refresh() {
    applyFilter();
    var c = document.getElementById('fpTotInner'); if (c) c.innerHTML = totCardInner();
    var w = document.getElementById('fpTableWrap'); if (w) { var el = document.getElementById('fpSkin'); w.innerHTML = rowsHTML(); if (el) wire(el); }
    var pc = document.getElementById('fpPeriodChip'); if (pc) pc.textContent = periodLabel;
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
    var cols = ['Date', 'Invoice No', 'Party Name', 'Transaction', 'Payment Type', 'Amount', 'Balance', 'Status'];
    var kmap = ['Date', 'InvoiceNo', 'CustomerName', 'Transaction', 'PayType', 'TotalAmount', 'Balance', 'Status'];
    var head = '<tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb">' + cols.map(function (c, i) {
      var k = kmap[i], active = sortKey === k, arrow = active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
      return '<th class="fpSort" data-key="' + k + '" style="text-align:left;padding:10px 16px;font-size:11px;font-weight:600;color:' + (active ? '#3694df' : '#6b7280') + ';white-space:nowrap;border-right:1px solid #e5e7eb;cursor:pointer">' + c + '<span style="margin-left:4px;font-size:9px;color:#9ca3af">⌄</span>' + (arrow ? '<span style="font-size:9px">' + arrow + '</span>' : '') + '</th>';
    }).join('') + '<th style="width:110px;text-align:left;padding:10px 16px;font-size:11px;font-weight:600;color:#6b7280;white-space:nowrap">Actions</th></tr>';
    if (!view.length) return '<table style="table-layout:fixed;width:100%;min-width:980px;border-collapse:collapse;font-size:12px"><thead>' + head + '</thead><tbody><tr><td colspan="9" style="text-align:center;padding:64px 16px;color:#9ca3af"><div style="font-size:30px;margin-bottom:8px">▧</div><div style="font-size:14px">No transactions to show</div><button class="fpAdd" style="margin-top:8px;border:0;background:transparent;color:#c90000;font-size:12px;cursor:pointer">+ Add Sale Invoice</button></td></tr></tbody></table>';
    var body = view.slice(0,100).map(function(r,i){
      var st=String(r.Status||'Unpaid'), paidSt=/^paid$/i.test(st), partialSt=/partial/i.test(st), sc=paidSt?'#059669':(partialSt?'#ca8a04':'#ef4444');
      var b=num(r.Balance), method=b<=0?'Cash':'FP BANK', ms=/cash/i.test(method)?'background:#ecfdf5;color:#047857;border:1px solid #d1fae5':'background:#eff6ff;color:#2563eb;border:1px solid #dbeafe';
      var bg=i===0?'#f9fafb':(i===1?'#f7fbff':'#fff');
      return '<tr class="fpr" data-no="'+esc(r.InvoiceNo||'')+'" title="Double-click to edit · Right-click for options" style="background:'+bg+';border-bottom:1px solid #e5e7eb;cursor:pointer">'
      +'<td style="padding:10px 16px;color:#6b7280;white-space:nowrap;border-right:1px solid #e5e7eb">'+esc(fmtDate(r.Date))+'</td>'
      +'<td style="padding:10px 16px;font-weight:700;color:#1f2937;white-space:nowrap;border-right:1px solid #e5e7eb">'+esc(r.InvoiceNo||'')+'</td>'
      +'<td style="padding:10px 16px;font-weight:600;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-right:1px solid #e5e7eb">'+esc(r.CustomerName||'—')+'</td>'
      +'<td style="padding:10px 16px;color:#6b7280;border-right:1px solid #e5e7eb">Sale</td>'
      +'<td style="padding:10px 16px;border-right:1px solid #e5e7eb"><span style="display:inline-flex;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;'+ms+'">'+method+'</span></td>'
      +'<td style="padding:10px 16px;font-weight:700;color:#1f2937;white-space:nowrap;border-right:1px solid #e5e7eb">'+money(r.TotalAmount)+'</td>'
      +'<td style="padding:10px 16px;font-weight:500;color:#6b7280;white-space:nowrap;border-right:1px solid #e5e7eb">'+money(r.Balance)+'</td>'
      +'<td style="padding:10px 16px;border-right:1px solid #e5e7eb"><span style="font-size:12px;font-weight:600;color:'+sc+'">'+esc(st)+'</span></td>'
      +'<td style="padding:10px 16px"><div style="display:flex;align-items:center;gap:4px"><button class="fpa" data-a="print" title="Print" style="border:0;background:transparent;padding:6px;color:#6b7280;cursor:pointer">'+IC_PR+'</button><button class="fpa" data-a="share" title="Share" style="border:0;background:transparent;padding:6px;color:#6b7280;cursor:pointer">'+IC_SH+'</button><button class="fpa" data-a="menu" title="More" style="border:0;background:transparent;padding:6px;color:#6b7280;cursor:pointer">'+IC_DOTS+'</button></div></td></tr>';
    }).join('');
    return '<table style="table-layout:fixed;width:100%;min-width:980px;border-collapse:collapse;font-size:12px"><thead>'+head+'</thead><tbody>'+body+'</tbody></table><div style="padding:8px 2px;font-size:12px;color:#9ca3af">'+view.length+' record'+(view.length===1?'':'s')+'</div>';
  }

  function chip(t) { return '<span style="background:#eef2f7;padding:6px 12px;border-radius:16px;color:#334155;font-size:12px;cursor:pointer">' + t + '</span>'; }
  function totCardInner() {
    var rate=tot>0?Math.round((paid/tot)*100):0;
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px"><div><div style="font-size:12px;font-weight:500;color:#6b7280">Total Sales Amount</div><div style="font-size:24px;line-height:32px;font-weight:700;color:#1f2937;margin-top:2px">'+money(tot)+'</div></div><span style="display:inline-flex;font-size:12px;font-weight:600;padding:4px 8px;border-radius:999px;background:rgba(54,148,223,.10);color:#3694df">'+rate+'% received</span></div><div style="margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6;display:flex;gap:16px;font-size:12px"><span style="color:#6b7280">Received: <span style="font-weight:600;color:#059669">'+money(paid)+'</span></span><span style="color:#d1d5db">|</span><span style="color:#6b7280">Balance: <span style="font-weight:600;color:#ef4444">'+money(bal)+'</span></span></div>';
  }

  function build() {
    var el=document.getElementById('fpSkin'); if(!el){el=document.createElement('div');el.id='fpSkin';document.documentElement.appendChild(el);}
    var aside=document.querySelector('aside'); var L=window.innerWidth<1024?0:(aside?Math.round(aside.getBoundingClientRect().width):248);
    var all=DATA||[], cnt=function(st){return all.filter(function(r){return String(r.Status||'').toLowerCase()===st.toLowerCase();}).length;};
    var dateBox=periodLabel==='Custom'?'<div style="display:flex;align-items:center;gap:6px"><input type="date" id="fpFrom" value="'+fromISO+'" style="height:32px;border:1px solid #e5e7eb;border-radius:4px;padding:0 8px;background:#f9fafb;color:#374151;font:inherit;font-size:12px"><span style="font-size:12px;color:#9ca3af">To</span><input type="date" id="fpTo" value="'+toISO+'" style="height:32px;border:1px solid #e5e7eb;border-radius:4px;padding:0 8px;background:#f9fafb;color:#374151;font:inherit;font-size:12px"></div>':'<span style="font-size:12px;color:#9ca3af;padding:4px 8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px">'+esc(periodLabel)+'</span>';
    var statuses=[['All',all.length],['Paid',cnt('Paid')],['Unpaid',cnt('Unpaid')],['Partial',cnt('Partial')]].map(function(x){var active=statusF===x[0];return '<button class="fpStatus" data-status="'+x[0]+'" style="display:inline-flex;align-items:center;gap:4px;border:0;background:'+(active?'#f3f4f6':'transparent')+';color:'+(active?'#1f2937':'#9ca3af')+';font-size:12px;padding:4px 12px;border-radius:6px;font-weight:500;cursor:pointer">'+x[0]+'<span style="font-size:10px;padding:1px 4px;border-radius:999px;background:#f3f4f6;color:'+(active?'#374151':'#9ca3af')+'">'+x[1]+'</span></button>';}).join('');
    el.style.cssText='position:fixed;left:'+L+'px;top:0;right:0;bottom:0;z-index:900000;background:#f5f8fb;overflow:auto;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#17263a';
    el.innerHTML='<div style="display:flex;flex-direction:column;min-height:100%">'
      +'<div style="background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px"><h1 style="margin:0;font-size:16px;line-height:24px;font-weight:700;color:#1f2937">Sale Invoices</h1><button class="fpAdd" style="display:flex;align-items:center;gap:4px;color:#fff;font-size:12px;padding:8px 16px;border-radius:8px;font-weight:600;border:0;background:#c90000;cursor:pointer"><span style="font-size:14px">＋</span> Add Sale</button></div>'
      +'<div style="background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:12px;font-weight:500;color:#6b7280">Filter by :</span><button class="fpPeriod" id="fpPeriodChip" style="height:32px;min-width:128px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;color:#374151;padding:0 10px;font-size:12px;text-align:left;cursor:pointer">'+esc(periodLabel)+' <span style="float:right;color:#9ca3af">⌄</span></button>'+dateBox+'</div>'
      +'<div style="padding:16px 16px 0"><div id="fpTotInner" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.05)">'+totCardInner()+'</div></div>'
      +'<div style="flex:1;overflow:auto;padding:16px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.05)">'
      +'<div style="padding:10px 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:12px"><h3 style="margin:0;font-size:14px;font-weight:700;color:#1f2937">Transactions</h3><div style="display:flex;align-items:center;gap:6px"><div style="position:relative"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4-4"></path></svg><input id="fpSearch" value="'+esc(q)+'" placeholder="Search Transactions" style="width:176px;padding:6px 12px 6px 28px;font-size:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;color:#374151;outline:none"></div><button class="fpXls" title="Excel" style="padding:6px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#16a34a;cursor:pointer;font-size:11px;font-weight:700">xls</button><button class="fpPrintList" title="Print" style="padding:6px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#9ca3af;cursor:pointer">'+IC_PR+'</button></div></div>'
      +'<div style="padding:8px 16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:4px">'+statuses+'</div><div id="fpTableWrap" style="overflow:auto">'+rowsHTML()+'</div></div></div></div>';
    el.setAttribute('data-built','1'); wire(el);
  }

  function wire(el) {
    var s = el.querySelector('#fpSearch');
    if (s) s.oninput = function () { q = this.value.trim().toLowerCase(); refresh(); };
    el.querySelectorAll('.fpStatus').forEach(function (b) { b.onclick = function () { statusF = b.getAttribute('data-status') || 'All'; applyFilter(); build(); }; });
    el.querySelectorAll('.fpAdd').forEach(function (b) { b.onclick = function () { openInvoiceBuilder(); }; });
    el.querySelectorAll('.fpAddP').forEach(function (b) { b.onclick = function () { clickApp(/^\+?\s*Purchase$/i); }; });
    el.querySelectorAll('.fpAddPlus').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); miniMenu(b, addMoreItems()); }; });
    var ts = el.querySelector('.fpTitleSwitch'); if (ts) ts.onclick = function (e) { e.stopPropagation(); miniMenu(ts, [['Sale Invoices (hapa)', function () {}], ['Estimate / Quotation', function () { navToSale('Estimate / Quotation', /Estimate/i); }], ['Proforma Invoice', function () { navToSale('Proforma Invoice', /Proforma/i); }], ['Payment-In', function () { navToSale('Payment-In', /Payment-?In/i); }], ['Sale Order', function () { navToSale('Sale Order', /Sale Order/i); }], ['Delivery Challan', function () { navToSale('Delivery Challan', /Delivery Challan/i); }], ['Sale Return / Credit Note', function () { navToSale('Sale Return / Credit Note', /Sale Return/i); }], ['Femmas POS', function () { navToSale('Femmas POS', /Femmas POS|^POS$/i); }]]); };
    el.querySelectorAll('.fpPrintList').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); printList(); }; });
    el.querySelectorAll('.fpXls').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); exportCSV(); }; });
    el.querySelectorAll('.fpChart').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); summaryModal(); }; });
    el.querySelectorAll('.fpFocusSearch').forEach(function (b) { b.onclick = function () { var i = document.getElementById('fpSearch'); if (i) i.focus(); }; });
    el.querySelectorAll('.fpTopMenu').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); miniMenu(b, [['Onyesha upya', function () { DATA = null; load().then(function () { applyFilter(); build(); }); }], ['Pakua Excel (CSV)', exportCSV], ['Chapa orodha', printList], ['Muhtasari', summaryModal]]); }; });
    var pc = el.querySelector('.fpPeriod'); if (pc) pc.onclick = function (e) { e.stopPropagation(); miniMenu(pc, [['This Month', function () { setPeriod('This Month', monthStart(), monthEnd()); build(); }], ['Last Month', function () { var r = lastMonthRange(); setPeriod('Last Month', r[0], r[1]); build(); }], ['This Year', function () { setPeriod('This Year', yearStart(), todayStr()); build(); }], ['All Time', function () { setPeriod('All Time', '', ''); build(); }], ['Custom Range', function () { periodLabel = 'Custom'; fromISO = ''; toISO = ''; build(); }]]); };
    var cal = el.querySelector('.fpCal'); if (cal) cal.onclick = function () { var f = document.getElementById('fpFrom'); if (f) { try { f.showPicker(); } catch (e) { f.focus(); f.click(); } } };
    var ff = el.querySelector('#fpFrom'); if (ff) ff.onchange = function () { fromISO = this.value || ''; periodLabel = 'Custom'; refresh(); };
    var ft = el.querySelector('#fpTo'); if (ft) ft.onchange = function () { toISO = this.value || ''; periodLabel = 'Custom'; refresh(); };
    var fm = el.querySelector('.fpFirms'); if (fm) fm.onclick = function (e) { e.stopPropagation(); miniMenu(fm, [['All Firms', function () {}], ['FEMMAS PRINT', function () {}]]); };
    var fu = el.querySelector('.fpUsers'); if (fu) fu.onclick = function (e) { e.stopPropagation(); miniMenu(fu, [['All Users', function () {}]]); };
    var fcl = el.querySelector('.fpClear'); if (fcl) fcl.onclick = function () { q = ''; setPeriod('This Month', monthStart(), monthEnd()); var si = document.getElementById('fpSearch'); if (si) si.value = ''; build(); };
    attachRows(el);
  }
  function clickApp(re) { var b = Array.prototype.slice.call(document.querySelectorAll('main button, header button')).find(function (x) { return re.test((x.textContent || '').trim()); }); if (b) { b.click(); return true; } return false; }
  function clickNav(re) { var a = Array.prototype.slice.call(document.querySelectorAll('aside a, aside button, nav a, nav button, main button')).find(function (x) { return re.test((x.textContent || '').trim()); }); if (a) { a.click(); return true; } return false; }
  function tryNav(label, re) { if (!clickNav(re)) toast('“' + label + '” haipatikani kwenye menyu ya app.'); }
  // The Sale sub-pages (Estimate, Proforma, Payment-In, Sale Order, Delivery Challan,
  // Sale Return, POS) live inside the collapsed "Sale" submenu — their links are not
  // in the DOM until the submenu is expanded. So: try to click; if not found, expand
  // the "Sale" parent, then poll briefly and click the target sub-link.
  function navToSale(label, re) {
    if (clickNav(re)) return;
    var sale = Array.prototype.slice.call(document.querySelectorAll('aside a, aside button, aside div, aside li, nav a, nav button')).find(function (x) { return /^Sale$/i.test((x.textContent || '').trim()); });
    if (!sale) { if (!clickNav(re)) toast('“' + label + '” haipatikani kwenye menyu.'); return; }
    sale.click();
    var tries = 0; var iv = setInterval(function () { tries++; if (clickNav(re) || tries > 10) { clearInterval(iv); if (tries > 10) toast('“' + label + '” haipatikani kwenye menyu.'); } }, 120);
  }
  function addMoreItems() { return [['Sale Invoice (mpya hapa)', function () { openInvoiceBuilder(); }], ['Estimate / Quotation', function () { navToSale('Estimate / Quotation', /Estimate/i); }], ['Proforma Invoice', function () { navToSale('Proforma Invoice', /Proforma/i); }], ['Payment-In', function () { navToSale('Payment-In', /Payment-?In/i); }], ['Sale Order', function () { navToSale('Sale Order', /Sale Order/i); }], ['Delivery Challan', function () { navToSale('Delivery Challan', /Delivery Challan/i); }], ['Sale Return / Credit Note', function () { navToSale('Sale Return / Credit Note', /Sale Return/i); }], ['Femmas POS', function () { navToSale('Femmas POS', /Femmas POS|^POS$/i); }]]; }

  function recFor(no) { return (DATA || []).find(function (r) { return String(r.InvoiceNo) === String(no); }) || {}; }

  function attachRows(el) {
    el.querySelectorAll('.fpSort').forEach(function (th) { th.onclick = function () { var k = th.getAttribute('data-key'); if (sortKey === k) sortDir = (sortDir === 'asc' ? 'desc' : 'asc'); else { sortKey = k; sortDir = 'asc'; } refresh(); }; });
    el.querySelectorAll('.fpr').forEach(function (r, i) {
      r.onmouseenter = function () { if (i !== 0) r.style.background = '#eaf3ff'; };
      r.onmouseleave = function () { if (i !== 0) r.style.background = ''; };
      r.ondblclick = function () { openInvoiceBuilder(recFor(r.getAttribute('data-no'))); };
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
    if (k === 'edit') openInvoiceBuilder(rec);
    else if (k === 'preview' || k === 'openpdf' || k === 'print') openPreview(rec);
    else if (k === 'challan') openPreview(rec, true);
    else if (k === 'payhist') modal('Payment History', '<div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:18px 20px;font-size:14px;line-height:2">Received during Sale : <b>' + Math.round(num(rec.PaidAmount)).toLocaleString('en-US') + '</b>' + (num(rec.Balance) > 0 ? '<br>Balance : <b style="color:#993c1d">' + Math.round(num(rec.Balance)).toLocaleString('en-US') + '</b>' : '') + '</div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">CLOSE</span>');
    else if (k === 'recvpay') modal('Receive Payment', '<div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:20px;font-size:14px;line-height:1.9">Salio linalodaiwa (Balance due): <b style="color:#993c1d">' + money(rec.Balance) + '</b><br><br>Kupokea malipo (record payment) kunaunganishwa na backend salama — kinakuja hatua inayofuata.</div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
    else modal(({ 'return': 'Convert To Return', 'cancel': 'Cancel Invoice', 'delete': 'Delete', 'dup': 'Duplicate', 'hist': 'View History' })[k] || 'Kitendo', '<div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:20px;font-size:14px;line-height:1.6">Kitendo hiki kinaunganishwa na backend salama — kinakuja hatua inayofuata.</div>', '<span class="fpx" style="border:1px solid #cbd5e1;color:#334155;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
  }

  /* ---- New / Edit Invoice builder (skin-side, real line items) ---- */
  var nbItems = [], nbEditNo = null;
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
  function openInvoiceBuilder(editRec) {
    nbEditNo = (editRec && editRec.InvoiceNo) ? editRec.InvoiceNo : null;
    if (nbEditNo) { nbItems = loadInvItems(nbEditNo); if (!nbItems.length) nbItems = [{ name: '', qty: '1', unit: 'Pcs', price: '' }]; }
    else nbItems = [{ name: '', qty: '1', unit: 'Pcs', price: '' }];
    var body = '<div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:18px 20px">'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">'
      + '<label style="flex:1;min-width:200px;font-size:12px;color:#475569">Customer <span style="color:#e11d48">*</span><input id="nbCust" placeholder="Jina la mteja" style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '<label style="width:160px;font-size:12px;color:#475569">Phone<input id="nbPhone" placeholder="0..." style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '<label style="width:160px;font-size:12px;color:#475569">Date<input id="nbDate" type="date" style="width:100%;margin-top:4px;border:1px solid #dbe3ec;border-radius:9px;padding:9px 11px;font:inherit"></label>'
      + '</div>'
      + '<table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left;font-size:11px;color:#64748b"><th style="padding:4px 5px">Item / Kazi</th><th style="padding:4px 5px;text-align:right">Qty</th><th style="padding:4px 5px">Unit</th><th style="padding:4px 5px;text-align:right">Price</th><th style="padding:4px 5px;text-align:right">Amount</th><th></th></tr></thead><tbody id="nbBody">' + nbRowsHTML() + '</tbody></table>'
      + '<div style="margin-top:8px"><span id="nbAdd" style="cursor:pointer;color:#185fa5;font-weight:600;font-size:13px">+ Ongeza item</span></div>'
      + '<div style="display:flex;justify-content:flex-end;gap:22px;margin-top:16px;align-items:center"><label style="font-size:12px;color:#475569">Paid<input id="nbPaid" inputmode="decimal" placeholder="0" style="width:140px;margin-left:8px;border:1px solid #dbe3ec;border-radius:9px;padding:8px 10px;font:inherit;text-align:right"></label><div style="font-size:16px;font-weight:800">Total: <span id="nbTot">' + money(nbTotal()) + '</span></div></div>'
      + '<div id="nbErr" style="color:#e11d48;font-size:12.5px;margin-top:8px"></div>'
      + '</div>';
    modal(nbEditNo ? 'Edit Invoice ' + nbEditNo : 'New Invoice', body, '<span class="fpx fpbtn" style="border:1px solid #cbd5e1;color:#334155;border-radius:20px;padding:8px 16px;font-weight:600;cursor:pointer">Ghairi</span><span id="nbSave" class="fpbtn" style="border:none;background:#e2483d;color:#fff;border-radius:20px;padding:8px 18px;font-weight:700;cursor:pointer">' + (nbEditNo ? 'Sasisha (Update)' : 'Save Invoice') + '</span>');
    var dEl = document.getElementById('nbDate'); if (dEl) dEl.value = (editRec && editRec.Date) ? toISODate(editRec.Date) : todayStr();
    if (editRec) { var cu = document.getElementById('nbCust'); if (cu) cu.value = editRec.CustomerName || ''; var ph = document.getElementById('nbPhone'); if (ph) ph.value = editRec.Phone || ''; var pd = document.getElementById('nbPaid'); if (pd && num(editRec.PaidAmount)) pd.value = num(editRec.PaidAmount); }
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
    var itemsJson = JSON.stringify(items.map(function (it) { return { name: it.name, qty: it.qty || '1', unit: it.unit || '', price: it.price, amount: (num(it.qty) || 0) * (num(it.price) || 0) }; }));
    if (nbEditNo) { try { localStorage.setItem(invItemsKey(nbEditNo), itemsJson); } catch (e) {} closeOv(); nbEditNo = null; nbItems = []; refresh(); return; }
    var no = nextInvNo();
    var rec = { InvoiceNo: no, Date: dv, CustomerName: cust, Phone: phone, TotalAmount: total, PaidAmount: paid, Balance: bal, Status: status };
    try { localStorage.setItem(invItemsKey(no), itemsJson); } catch (e) {}
    var url = backend(); var sv = document.getElementById('nbSave'); if (sv) { sv.textContent = 'Inahifadhi…'; sv.onclick = null; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveRow', tab: 'Invoices', record: rec }) }).then(function (r) { return r.json(); }).then(function () {
      closeOv(); nbItems = []; DATA = null; load().then(function () { applyFilter(); build(); });
    }).catch(function () { if (err) err.textContent = 'Imeshindwa kuhifadhi — angalia Sync.'; if (sv) { sv.textContent = 'Save Invoice'; sv.onclick = saveNewInvoice; } });
  }

  /* ---- A4 invoice preview — matches the "utu kwanza" (Invoice 815) Vyapar layout ---- */
  function sheetHTML(d, wp) {
    function md(n) { return 'Sh ' + Math.round(num(n)).toLocaleString('en-US') + '.0'; }
    function dd(s) { var x = parseD(s); if (!x) return String(s || ''); return ('0' + x.getDate()).slice(-2) + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + x.getFullYear(); }
    var total = num(d.TotalAmount), paid = num(d.PaidAmount), bal = num(d.Balance); var BLUE = '#0979a7';
    var its = loadInvItems(d.InvoiceNo); var real = its.length > 0; var qsum = 0;
    if (real) its.forEach(function (it) { qsum += (num(it.qty) || 0); }); else qsum = 1;
    var itemRows = real ? its.map(function (it, i) { var amt = num(it.amount) || (num(it.qty) || 0) * (num(it.price) || 0); return '<tr><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;vertical-align:top">' + (i + 1) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef"><div style="font-weight:700">' + esc(it.name || '') + '</div></td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + esc(it.qty || '1') + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + esc(it.unit || '—') + '</td>' + (wp ? '' : '<td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(num(it.price)) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(amt) + '</td>') + '</tr>'; }).join('')
      : '<tr><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;vertical-align:top">1</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef"><div style="font-weight:700">Kazi / Huduma</div><div style="font-size:10.5px;color:#8a8f98">(Goods / Services)</div></td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">1</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">—</td>' + (wp ? '' : '<td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(total) + '</td><td style="padding:9px 10px;border-bottom:1px solid #e5e9ef;text-align:right">' + md(total) + '</td>') + '</tr>';
    return '<div id="fpSheet" style="position:relative;overflow:hidden;background:#fff;color:#1f2733;max-width:794px;margin:0 auto;padding:34px 40px;font-family:Asap,Arial,sans-serif;font-size:12.5px;box-shadow:0 4px 24px rgba(0,0,0,.08)">'
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
    var aside = document.querySelector('aside'); var L = window.innerWidth < 1024 ? 0 : (aside ? Math.round(aside.getBoundingClientRect().width) : 248);
    ov.style.cssText = 'position:fixed;left:' + L + 'px;top:0;right:0;bottom:0;z-index:2147483400;background:#f4f7fb;overflow:auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2733';
    ov.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:#fff;border-bottom:1px solid #e6ebf2;position:sticky;top:0;z-index:4"><div style="font-size:18px;font-weight:700">' + title + '</div><span class="fpx" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:#64748b;font-size:13px;font-weight:600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>Funga</span></div>'
      + '<div style="max-width:900px;margin:0 auto;padding:20px 20px 96px">' + body + '</div>'
      + (foot ? '<div style="position:fixed;left:' + L + 'px;right:0;bottom:0;background:#fff;border-top:1px solid #e6ebf2;padding:12px 22px;display:flex;gap:10px;justify-content:flex-end;z-index:4">' + foot + '</div>' : '');
    ov.addEventListener('click', function (e) { if (e.target.closest('.fpx')) { closeOv(); return; } if (e.target.closest('.fpPrint')) { printSheet(); } else if (e.target.closest('.fpShare')) { shareInvoice(curDoc || {}); } });
    document.documentElement.appendChild(ov);
  }
  function openPreview(rec, challan) {
    curDoc = rec;
    var foot = '<span class="fpPrint fpbtn" style="border:1px solid #f0997b;color:#d85a30">Open PDF</span><span class="fpPrint fpbtn" style="border:1px solid #85b7eb;color:#185fa5">Print</span><span class="fpPrint fpbtn" style="border:1px solid #9fe1cb;color:#0f6e56">Save PDF</span><span class="fpShare fpbtn" style="border:1px solid #25d366;background:#25d366;color:#fff">Sambaza WhatsApp</span><span class="fpx fpbtn" style="border:1px solid #e2483d;color:#e2483d">Close</span>';
    modal(challan ? 'Delivery Challan' : 'Invoice', sheetHTML(rec, challan), foot);
    if (ov) ov.querySelectorAll('.fpbtn').forEach(function (b) { b.style.borderRadius = '20px'; b.style.padding = '8px 16px'; b.style.fontSize = '13px'; b.style.fontWeight = '600'; b.style.cursor = 'pointer'; b.style.background = b.style.background || 'transparent'; });
  }
  function printSheet() {
    var sh = document.getElementById('fpSheet'); if (!sh) return;
    var old = document.getElementById('fpPrintArea'); if (old) old.remove();
    var area = document.createElement('div'); area.id = 'fpPrintArea'; area.innerHTML = sh.outerHTML;
    if (!document.getElementById('fpPrintStyle')) { var ps = document.createElement('style'); ps.id = 'fpPrintStyle'; ps.textContent = '@media print{ body{display:none !important} #fpSkin{display:none !important} #fpOverlay{display:none !important} #fpPrintArea{display:block !important} #fpPrintArea #fpSheet{box-shadow:none !important} }'; document.head.appendChild(ps); }
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
    if (!document.getElementById('fpPrintStyle')) { var ps = document.createElement('style'); ps.id = 'fpPrintStyle'; ps.textContent = '@media print{ body{display:none !important} #fpSkin{display:none !important} #fpOverlay{display:none !important} #fpPrintArea{display:block !important} #fpPrintArea #fpSheet{box-shadow:none !important} }'; document.head.appendChild(ps); }
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
    modal('Muhtasari — Sale Invoices', '<div style="background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:20px 22px;font-size:14px;line-height:2"><div>Jumla ya invoice: <b>' + view.length + '</b></div><div>Total Sales: <b>' + money(tot) + '</b></div><div>Imelipwa (Received): <b style="color:#0f6e56">' + money(paid) + '</b></div><div>Salio (Balance): <b style="color:#993c1d">' + money(bal) + '</b></div></div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
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

  var busy = false, t = null, autoMonthDefault = false;
  function shell() {
    var el = document.getElementById('fpSkin');
    if (!el) {
      el = document.createElement('div'); el.id = 'fpSkin'; document.documentElement.appendChild(el);
      var aside = document.querySelector('aside'); var L = window.innerWidth < 1024 ? 0 : (aside ? Math.round(aside.getBoundingClientRect().width) : 248);
      el.style.cssText = 'position:fixed;left:' + L + 'px;top:0;right:0;bottom:0;z-index:900000;background:#fff;overflow:auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2733';
      el.innerHTML = '<div style="padding:16px"><div style="height:40px;background:#f4f6f9;border-radius:18px;max-width:340px;margin-bottom:16px"></div><div style="height:26px;width:200px;background:#eef2f7;border-radius:8px;margin:6px 0 14px"></div><div style="height:96px;max-width:410px;background:#f7f9fc;border:1px solid #eef2f7;border-radius:10px;margin-bottom:16px"></div><div style="color:#94a3b8;font-size:13px">Inapakia Sale Invoices…</div></div>';
    }
    return el;
  }
  // Hide the app's own Sale Invoices page with a SINGLE CSS rule (not per-node JS every
  // tick). Toggling one class on <html> is idempotent and doesn't fight React's
  // re-renders — no layout thrash, no freeze, much lighter. #fpSkin lives on <html>
  // (a sibling of <main>), so hiding <main> never hides our skin.
  function ensureHideCss() {
    if (document.getElementById('fpHideCss')) return;
    var st = document.createElement('style'); st.id = 'fpHideCss';
    st.textContent = 'html.fpInvActive main{display:none !important}';
    (document.head || document.documentElement).appendChild(st);
  }
  function hideApp() { ensureHideCss(); document.documentElement.classList.add('fpInvActive'); }
  function showApp() { document.documentElement.classList.remove('fpInvActive'); }
  // If we auto-defaulted to This Month but this month has no invoices yet,
  // fall back to showing ALL (most-recent-first, capped at 100) so the page is
  // never blank. Only fires for the auto default — a manual pick is respected.
  function autoExpandIfEmpty() {
    if (autoMonthDefault && view.length === 0) {
      autoMonthDefault = false;
      fromISO = ''; toISO = ''; periodLabel = 'All';
      applyFilter();
    }
  }
  function tick() {
    var on = isInvPage(); var el = document.getElementById('fpSkin');
    if (on) {
      if (!el) { el = shell(); }                       // opaque cover instantly — hides the old page (no flash)
      hideApp();                                        // and REMOVE the old page from render entirely (CSS)
      if (DATA) { if (el.getAttribute('data-built') !== '1') { applyFilter(); autoExpandIfEmpty(); build(); } }
      else if (!busy) { busy = true; load().then(function () { busy = false; applyFilter(); autoExpandIfEmpty(); if (isInvPage()) build(); }); }
    } else { if (el) el.remove(); showApp(); }
  }
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () { if (!fromISO && !toISO && periodLabel === 'Custom') { fromISO = monthStart(); toISO = monthEnd(); periodLabel = 'This Month'; autoMonthDefault = true; } tick(); setInterval(tick, 400); });
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
