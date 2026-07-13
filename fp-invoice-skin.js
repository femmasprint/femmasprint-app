/* FEMMAS PRINT — Sale Invoices "exact mockup" skin.
 * Renders the approved Vyapar-style page over the app's Sale Invoices list,
 * populated from the live backend, with working search, More-Actions menu,
 * real A4 invoice Preview, WhatsApp share and Add Sale. Loaded by the edge
 * middleware as <script src="/fp-invoice-skin.js" defer>. Fully defensive.
 */
(function () {
  if (window.__fpSkin) return; window.__fpSkin = true;

  function backend() { try { return (localStorage.getItem('fp_backend_url') || '').trim(); } catch (e) { return ''; } }
  var DATA = null, view = [], q = '', tot = 0, paid = 0, bal = 0, curDoc = null;

  function num(n) { return +String(n == null ? '' : n).replace(/[^0-9.-]/g, '') || 0; }
  function money(n) { return 'Sh ' + Math.round(num(n)).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function normPhone(s) { var x = String(s || '').replace(/[^0-9]/g, ''); if (!x) return ''; if (x.charAt(0) === '0') x = '255' + x.slice(1); else if (x.slice(0, 3) !== '255' && x.length <= 9) x = '255' + x; return x; }

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
    try { var m = document.querySelector('main'); if (!m) return false; var t = m.textContent || ''; return t.indexOf('Total Invoices') > -1 && /Sale Invoices/.test(t); } catch (e) { return false; }
  }

  function applyFilter() {
    view = (DATA || []).filter(function (r) {
      if (q) { var s = ((r.InvoiceNo || '') + ' ' + (r.CustomerName || '')).toLowerCase(); if (s.indexOf(q) < 0) return false; }
      return true;
    });
  }

  var FN = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="opacity:.5;margin-left:5px;vertical-align:middle"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>';
  var IC_PR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2"/></svg>';
  var IC_SH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  var IC_DOTS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  var ACT = [['View / Edit', 'edit', 0], ['Convert To Return', 'return', 0], ['Preview Delivery Challan', 'challan', 0], ['Payment History', 'payhist', 0], ['Cancel Invoice', 'cancel', 1], ['Delete', 'delete', 1], ['Duplicate', 'dup', 0], ['Open PDF', 'openpdf', 0], ['Preview', 'preview', 0], ['Print', 'print', 0], ['View History', 'hist', 0]];

  function rowsHTML() {
    var cols = ['Invoice no', 'Party Name', 'Transaction', 'Payment Type', 'Amount', 'Balance', 'Status'];
    var head = '<tr style="text-align:left;color:#64748b;border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;background:#fafbfc">' + cols.map(function (c, i) { return '<th style="padding:11px 12px;font-weight:600;font-size:12px;white-space:nowrap;' + ((i === 4 || i === 5) ? 'text-align:right' : '') + '">' + c + FN + '</th>'; }).join('') + '<th style="padding:11px 12px;font-weight:600;font-size:12px;text-align:center">Actions</th></tr>';
    var body = view.slice(0, 100).map(function (r, i) {
      var st = String(r.Status || ''); var sc = /paid|imelipwa/i.test(st) && !/unpaid|haija/i.test(st) ? '#0f6e56' : '#e2483d'; var b = num(r.Balance);
      return '<tr class="fpr" data-no="' + esc(r.InvoiceNo || '') + '" style="border-bottom:1px solid #eef2f7;cursor:pointer' + (i === 0 ? ';background:#dcecfb' : '') + '">'
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
    return '<table style="width:100%;border-collapse:collapse;min-width:720px"><thead>' + head + '</thead><tbody>' + body + '</tbody></table><div style="text-align:center;color:#94a3b8;font-size:12px;padding:14px">Zinaonyeshwa ' + Math.min(100, view.length) + ' kati ya ' + view.length + '</div>';
  }

  function chip(t) { return '<span style="background:#eef2f7;padding:6px 12px;border-radius:16px;color:#334155;font-size:12px;cursor:pointer">' + t + '</span>'; }

  function build() {
    var el = document.getElementById('fpSkin'); if (!el) { el = document.createElement('div'); el.id = 'fpSkin'; document.documentElement.appendChild(el); }
    var L = window.innerWidth < 1024 ? 0 : 208;
    el.style.cssText = 'position:fixed;left:' + L + 'px;top:0;right:0;bottom:0;z-index:900000;background:#fff;overflow:auto;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2733';
    el.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #eef2f7">'
      + '<div style="flex:1;display:flex;align-items:center;gap:8px;background:#f4f6f9;border-radius:18px;padding:7px 13px;max-width:340px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="fpSearch" placeholder="Search Transactions" style="border:none;background:transparent;outline:none;font-size:13px;width:100%;color:#1f2733"></div>'
      + '<span class="fpAdd" style="border:1px solid #f0997b;color:#d85a30;font-size:12px;font-weight:600;padding:6px 13px;border-radius:18px;cursor:pointer">+ Add Sale</span>'
      + '<span class="fpAddP" style="border:1px solid #85b7eb;color:#185fa5;font-size:12px;font-weight:600;padding:6px 13px;border-radius:18px;cursor:pointer">+ Add Purchase</span>'
      + '<span style="width:28px;height:28px;border-radius:8px;background:#e6f1fb;display:inline-flex;align-items:center;justify-content:center;color:#378add;font-size:18px">+</span>'
      + '<span style="color:#64748b">' + IC_PR + '</span>'
      + '<span style="position:relative"><svg width="17" height="17" viewBox="0 0 24 24" fill="#64748b"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg><span style="position:absolute;top:-1px;right:-1px;width:7px;height:7px;background:#e2483d;border-radius:50%"></span></span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px 6px"><div style="font-size:20px;font-weight:600;display:flex;align-items:center;gap:6px">Sale Invoices <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div style="display:flex;align-items:center;gap:10px"><span class="fpAdd" style="background:#e2483d;color:#fff;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer">+ Add Sale</span><span style="width:32px;height:32px;border-radius:50%;background:#f1f5f9;display:inline-flex;align-items:center;justify-content:center;color:#64748b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg></span></div></div>'
      + '<div style="display:flex;align-items:center;gap:8px;padding:4px 16px 12px;color:#64748b;font-size:12px;flex-wrap:wrap"><span style="color:#334155">Filter by :</span>' + chip('Custom &#9662;') + chip('&#128197; 01/06/2026&nbsp; To&nbsp; 17/06/2026') + chip('All Firms &#9662;') + chip('All Users &#9662;') + '</div>'
      + '<div style="padding:0 16px 14px"><div style="border:1px solid #dbe3ec;border-radius:10px;padding:14px 18px;background:#fbfcfe;max-width:410px"><div style="font-size:12px;color:#64748b">Total Sales Amount</div><div style="font-size:24px;font-weight:600;margin:3px 0">' + money(tot) + '</div><div style="font-size:12px;color:#64748b">Received: <span style="color:#0f6e56">' + money(paid) + '</span> &nbsp;|&nbsp; Balance: <span style="color:#993c1d">' + money(bal) + '</span></div></div></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:2px 16px 8px"><div style="font-size:15px;font-weight:600">Transactions</div><div style="display:flex;align-items:center;gap:14px;color:#64748b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M8 16V9M13 16V6M18 16v-4"/></svg><span style="background:#1d9e75;color:#fff;font-size:10px;font-weight:600;padding:2px 5px;border-radius:4px">xls</span><span>' + IC_PR + '</span></div></div>'
      + '<div id="fpTableWrap" style="padding:0 16px 40px;overflow-x:auto">' + rowsHTML() + '</div>';
    wire(el);
  }

  function wire(el) {
    var s = el.querySelector('#fpSearch');
    if (s) s.oninput = function () { q = this.value.trim().toLowerCase(); applyFilter(); var w = document.getElementById('fpTableWrap'); if (w) { w.innerHTML = rowsHTML(); attachRows(el); } };
    el.querySelectorAll('.fpAdd').forEach(function (b) { b.onclick = function () { clickApp(/^\+?\s*Sale$/i); }; });
    el.querySelectorAll('.fpAddP').forEach(function (b) { b.onclick = function () { clickApp(/^\+?\s*Purchase$/i); }; });
    attachRows(el);
  }
  function clickApp(re) { var b = Array.prototype.slice.call(document.querySelectorAll('main button, header button')).find(function (x) { return re.test((x.textContent || '').trim()); }); if (b) b.click(); }

  function recFor(no) { return (DATA || []).find(function (r) { return String(r.InvoiceNo) === String(no); }) || {}; }

  function attachRows(el) {
    el.querySelectorAll('.fpr').forEach(function (r, i) {
      r.onmouseenter = function () { if (i !== 0) r.style.background = '#eaf3ff'; };
      r.onmouseleave = function () { if (i !== 0) r.style.background = ''; };
      r.ondblclick = function () { openPreview(recFor(r.getAttribute('data-no'))); };
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
    menuEl.innerHTML = ACT.map(function (a) { return '<div class="fpmi" data-k="' + a[1] + '" style="padding:8px 10px;border-radius:7px;cursor:pointer;white-space:nowrap;' + (a[2] ? 'color:#e2483d;' : '') + '">' + a[0] + '</div>'; }).join('');
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
    else if (k === 'payhist') modal('Payment History', '<div style="padding:18px 20px;font-size:14px;line-height:1.9">Imelipwa (Received): <b>' + money(rec.PaidAmount) + '</b><br>Salio (Balance): ' + money(rec.Balance) + '<br>Hali: ' + esc(rec.Status || '') + '</div>', '<span class="fpx" style="border:1px solid #185fa5;color:#185fa5;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">CLOSE</span>');
    else modal(({ 'return': 'Convert To Return', 'cancel': 'Cancel Invoice', 'delete': 'Delete', 'dup': 'Duplicate', 'hist': 'View History' })[k] || 'Kitendo', '<div style="padding:20px;font-size:14px;line-height:1.6">Kitendo hiki kinaunganishwa na backend salama — kinakuja hatua inayofuata.</div>', '<span class="fpx" style="border:1px solid #cbd5e1;color:#334155;border-radius:20px;padding:7px 15px;font-size:13px;font-weight:600;cursor:pointer">Sawa</span>');
  }

  /* ---- A4 invoice preview (real letterhead + signature) ---- */
  function sheetHTML(d, wp) {
    var stt = String(d.Status || ''); var paidish = /paid|imelipwa/i.test(stt) && !/haija|unpaid/i.test(stt); var col = paidish ? '#16a34a' : '#e11d48';
    var t = money(d.TotalAmount);
    return '<div id="fpSheet" style="position:relative;overflow:hidden;background:#fff;color:#1f2733;max-width:794px;margin:0 auto;padding:36px 42px;font-family:Asap,sans-serif">'
      + '<img src="/femmas-logo-03-mqrt99vq.png" alt="" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-16deg);width:60%;opacity:.045;pointer-events:none">'
      + '<div style="display:flex;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:3px solid #13315a"><div style="display:flex;gap:13px;align-items:flex-start"><img src="/femmas-logo-03-mqrt99vq.png" style="width:54px;height:54px;object-fit:contain"><div><div style="font-size:20px;font-weight:800;color:#13315a">FEMMAS PRINT</div><div style="font-size:10.5px;color:#5b6675;line-height:1.7;margin-top:4px">Amani &amp; Congo Street, Jangwani, Ilala - Dar es Salaam<br>Phone: +255 658 843 344 &middot; femmasprint@gmail.com<br>TIN: 102-075-552</div></div></div><div style="text-align:right"><span style="display:inline-block;padding:4px 13px;border-radius:7px;font-size:12px;font-weight:800;border:2px solid ' + col + ';color:' + col + '">' + esc(stt.toUpperCase()) + '</span></div></div>'
      + '<div style="text-align:center;font-size:21px;font-weight:800;color:#008ece;padding:13px 0">' + (wp ? 'Delivery Challan' : 'Invoice') + '</div>'
      + '<div style="display:flex;justify-content:space-between;gap:16px;font-size:12.5px"><div><div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:5px">Bill To</div><div style="font-size:15px;font-weight:800;color:#0f172a">' + esc(d.CustomerName || '—') + '</div></div><div style="text-align:right"><div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:5px">Invoice Details</div><div style="line-height:1.9"><span style="color:#94a3b8">Invoice No.</span> <strong>' + esc(d.InvoiceNo || '') + '</strong><br><span style="color:#94a3b8">Date</span> <strong>' + esc(d.Date || '') + '</strong></div></div></div>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:15px"><thead><tr style="background:#13315a;color:#fff;font-size:11px;text-align:left"><th style="padding:9px 10px">#</th><th style="padding:9px 10px">Item name</th><th style="padding:9px 10px;text-align:right">Qty</th><th style="padding:9px 10px;text-align:center">Unit</th>' + (wp ? '' : '<th style="padding:9px 10px;text-align:right">Price/Unit</th><th style="padding:9px 10px;text-align:right">Amount</th>') + '</tr></thead><tbody><tr><td style="padding:9px 10px;font-size:12px;border-bottom:1px solid #eef1f5">1</td><td style="padding:9px 10px;font-size:12px;font-weight:600;border-bottom:1px solid #eef1f5">Kazi / Huduma (Goods / Services)</td><td style="padding:9px 10px;font-size:12px;text-align:right;border-bottom:1px solid #eef1f5">1</td><td style="padding:9px 10px;font-size:12px;text-align:center;border-bottom:1px solid #eef1f5">—</td>' + (wp ? '' : '<td style="padding:9px 10px;font-size:12px;text-align:right;border-bottom:1px solid #eef1f5">' + t + '</td><td style="padding:9px 10px;font-size:12px;text-align:right;font-weight:700;border-bottom:1px solid #eef1f5">' + t + '</td>') + '</tr><tr><td colspan="2" style="padding:10px;font-weight:800">Total</td><td style="padding:10px;text-align:right;font-weight:800">1</td><td></td>' + (wp ? '' : '<td></td><td style="padding:10px;text-align:right;font-weight:800">' + t + '</td>') + '</tr></tbody></table>'
      + (wp ? '<div style="margin-top:12px;font-size:11px;color:#5b6675">Hati ya usafirishaji — items na idadi tu (bila bei).</div>' : '<div style="display:flex;justify-content:space-between;gap:22px;margin-top:16px"><div style="flex:1;font-size:11px;color:#1f2733;line-height:1.8"><div><strong>Payment Details:</strong><br>Account Name: Femmas Print<br>Account no: 0150322619500 (CRDB Bank)<br>Lipa: 5521084 (Tigo) / 5767888 (Voda)</div><div style="margin-top:10px"><strong>Terms:</strong> 70% advance, 30% on delivery. Valid 30 days.</div></div><div style="width:248px;font-size:12.5px"><div style="display:flex;justify-content:space-between;padding:7px 0;color:#5b6675"><span>Sub Total</span><strong style="color:#1f2733">' + t + '</strong></div><div style="display:flex;justify-content:space-between;padding:9px 0;font-weight:800;border-top:2px solid #13315a;border-bottom:2px solid #13315a"><span>Total</span><span>' + t + '</span></div><div style="display:flex;justify-content:space-between;padding:7px 0;color:#16a34a"><span>Received</span><strong>' + money(d.PaidAmount) + '</strong></div><div style="display:flex;justify-content:space-between;padding:7px 0;font-weight:800;color:#e11d48"><span>Balance</span><span>' + money(d.Balance) + '</span></div></div></div>')
      + '<div style="display:flex;justify-content:flex-end;margin-top:30px"><div style="text-align:center;width:190px"><img src="/femmas-signature.png" style="height:42px;object-fit:contain;display:block;margin:0 auto -2px;mix-blend-mode:multiply"><div style="border-top:1.5px solid #13315a;padding-top:6px;font-size:11px;color:#5b6675">For <strong style="color:#13315a">FEMMAS PRINT</strong><br>Authorized Signatory</div></div></div>'
      + '<div style="font-size:10.5px;color:#5b6675;padding-top:14px;margin-top:12px;text-align:center;border-top:1px dashed #d6dae0">Umefurahia huduma yetu? <strong style="color:#13315a">Tuandikie review kwenye Google</strong> — tafuta <strong>Femmas Print</strong> kwenye Google Maps &#9733;</div>'
      + '</div>';
  }

  var ov = null;
  function closeOv() { if (ov) { ov.remove(); ov = null; } }
  function modal(title, body, foot) {
    closeOv();
    ov = document.createElement('div');
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
    if (!document.getElementById('fpPrintStyle')) { var ps = document.createElement('style'); ps.id = 'fpPrintStyle'; ps.textContent = '@media print{ body{display:none !important} #fpSkin{display:none !important} #fpPrintArea{display:block !important} }'; document.head.appendChild(ps); }
    document.documentElement.appendChild(area);
    setTimeout(function () { try { window.print(); } catch (e) {} setTimeout(function () { var a = document.getElementById('fpPrintArea'); if (a) a.remove(); }, 900); }, 120);
  }
  function shareText(d) { var L = ['FEMMAS PRINT', 'Invoice ' + (d.InvoiceNo || '') + '  |  ' + (d.Date || ''), '']; if (d.CustomerName) L.push('Bill To: ' + d.CustomerName); L.push('Total: ' + money(d.TotalAmount)); if (num(d.PaidAmount)) L.push('Received: ' + money(d.PaidAmount)); if (num(d.Balance)) L.push('Balance: ' + money(d.Balance)); L.push(''); L.push('Malipo: CRDB 0150322619500 (Femmas Print)'); L.push('Lipa: 5521084 (Tigo) / 5767888 (Voda)'); L.push('Asante kwa biashara!'); L.push(''); L.push('Umefurahia huduma? Tuandikie review Google: https://www.google.com/maps?cid=9015672156949326110'); return L.join('\n'); }
  function shareInvoice(d) { var phone = normPhone(d.Phone || ''); window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(shareText(d)), '_blank'); }

  document.addEventListener('click', function (e) { if (menuEl && !e.target.closest('.fpa') && !menuEl.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeOv(); } });
  window.addEventListener('scroll', closeMenu, true);

  var busy = false, t = null;
  function tick() {
    var on = isInvPage(); var el = document.getElementById('fpSkin');
    if (on) { if (!DATA && !busy) { busy = true; load().then(function () { busy = false; applyFilter(); if (isInvPage()) build(); }); } else if (DATA && !el) { applyFilter(); build(); } }
    else { if (el) el.remove(); }
  }
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () { tick(); setInterval(tick, 800); });
})();
