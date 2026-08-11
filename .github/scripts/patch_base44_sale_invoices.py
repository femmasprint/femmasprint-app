from pathlib import Path
import re

p = Path('fp-invoice-skin.js')
s = p.read_text(encoding='utf-8')

old_state = "var DATA = null, view = [], q = '', tot = 0, paid = 0, bal = 0, curDoc = null, fromISO = '', toISO = '', periodLabel = 'Custom', sortKey = 'Date', sortDir = 'desc';"
new_state = "var DATA = null, view = [], q = '', tot = 0, paid = 0, bal = 0, curDoc = null, fromISO = '', toISO = '', periodLabel = 'Custom', sortKey = 'Date', sortDir = 'desc', statusF = 'All';"
if old_state in s:
    s = s.replace(old_state, new_state, 1)
elif new_state not in s:
    raise SystemExit('state line not found')

old_filter = "      if (fromISO || toISO) { var dd = toISODate(r.Date); if (!dd) return true; if (fromISO && dd < fromISO) return false; if (toISO && dd > toISO) return false; }\n      return true;"
new_filter = "      if (fromISO || toISO) { var dd = toISODate(r.Date); if (!dd) return true; if (fromISO && dd < fromISO) return false; if (toISO && dd > toISO) return false; }\n      if (statusF !== 'All' && String(r.Status || '').toLowerCase() !== statusF.toLowerCase()) return false;\n      return true;"
if old_filter in s:
    s = s.replace(old_filter, new_filter, 1)
elif new_filter not in s:
    raise SystemExit('filter block not found')

def replace_between(text, start_marker, end_marker, replacement):
    a = text.find(start_marker)
    if a < 0:
        raise SystemExit('start marker missing: ' + start_marker)
    b = text.find(end_marker, a)
    if b < 0:
        raise SystemExit('end marker missing: ' + end_marker)
    return text[:a] + replacement + text[b:]

refresh = '''  function refresh() {
    applyFilter();
    var c = document.getElementById('fpTotInner'); if (c) c.innerHTML = totCardInner();
    var w = document.getElementById('fpTableWrap'); if (w) { var el = document.getElementById('fpSkin'); w.innerHTML = rowsHTML(); if (el) wire(el); }
    var pc = document.getElementById('fpPeriodChip'); if (pc) pc.textContent = periodLabel;
  }
'''
s = replace_between(s, '  function refresh() {', '  function setPeriod(', refresh)

rows = r'''  function rowsHTML() {
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

'''
s = replace_between(s, '  function rowsHTML() {', '  function chip(t)', rows)

tot = r'''  function totCardInner() {
    var rate=tot>0?Math.round((paid/tot)*100):0;
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px"><div><div style="font-size:12px;font-weight:500;color:#6b7280">Total Sales Amount</div><div style="font-size:24px;line-height:32px;font-weight:700;color:#1f2937;margin-top:2px">'+money(tot)+'</div></div><span style="display:inline-flex;font-size:12px;font-weight:600;padding:4px 8px;border-radius:999px;background:rgba(54,148,223,.10);color:#3694df">'+rate+'% received</span></div><div style="margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6;display:flex;gap:16px;font-size:12px"><span style="color:#6b7280">Received: <span style="font-weight:600;color:#059669">'+money(paid)+'</span></span><span style="color:#d1d5db">|</span><span style="color:#6b7280">Balance: <span style="font-weight:600;color:#ef4444">'+money(bal)+'</span></span></div>';
  }

'''
s = replace_between(s, '  function totCardInner() {', '  function build() {', tot)

build = r'''  function build() {
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

'''
s = replace_between(s, '  function build() {', '  function wire(el)', build)

search_wire = "    if (s) s.oninput = function () { q = this.value.trim().toLowerCase(); refresh(); };"
status_wire = search_wire + "\n    el.querySelectorAll('.fpStatus').forEach(function (b) { b.onclick = function () { statusF = b.getAttribute('data-status') || 'All'; applyFilter(); build(); }; });"
if status_wire not in s:
    if search_wire not in s:
        raise SystemExit('search wire missing')
    s = s.replace(search_wire, status_wire, 1)

old_period = "var pc = el.querySelector('.fpPeriod'); if (pc) pc.onclick = function (e) { e.stopPropagation(); miniMenu(pc, [['Leo (Today)', function () { setPeriod('Leo', todayStr(), todayStr()); }], ['This Month', function () { setPeriod('This Month', monthStart(), monthEnd()); }], ['Last Month', function () { var r = lastMonthRange(); setPeriod('Last Month', r[0], r[1]); }], ['This Quarter', function () { setPeriod('This Quarter', quarterStart(), todayStr()); }], ['This Year', function () { setPeriod('This Year', yearStart(), todayStr()); }], ['All Sale Invoices', function () { setPeriod('All', '', ''); }]]); };"
new_period = "var pc = el.querySelector('.fpPeriod'); if (pc) pc.onclick = function (e) { e.stopPropagation(); miniMenu(pc, [['This Month', function () { setPeriod('This Month', monthStart(), monthEnd()); build(); }], ['Last Month', function () { var r = lastMonthRange(); setPeriod('Last Month', r[0], r[1]); build(); }], ['This Year', function () { setPeriod('This Year', yearStart(), todayStr()); build(); }], ['All Time', function () { setPeriod('All Time', '', ''); build(); }], ['Custom Range', function () { periodLabel = 'Custom'; fromISO = ''; toISO = ''; build(); }]]); };"
if old_period in s:
    s = s.replace(old_period, new_period, 1)
elif new_period not in s:
    raise SystemExit('period wire missing')

p.write_text(s, encoding='utf-8')

mw = Path('functions/_middleware.js')
m = mw.read_text(encoding='utf-8')
m, n = re.subn(r'src="/fp-invoice-skin\.js(?:\?v=[^"]+)?"', 'src="/fp-invoice-skin.js?v=base44-exact-20260811-1958"', m, count=1)
if n != 1:
    raise SystemExit('middleware loader missing')
mw.write_text(m, encoding='utf-8')
print('Base44 exact Sale Invoices patch applied')
