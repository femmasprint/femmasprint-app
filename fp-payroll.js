/* FEMMAS PRINT — Payroll Professional Standard enhancer
 * UI/validation layer only. It does not invent statutory tax/pension values and does not
 * change payroll calculations. It improves payroll readability, controls, data quality,
 * payslip presentation, mobile behavior, and audit visibility using the live DOM data.
 */
(function () {
  'use strict';

  var STYLE_ID = 'fp-payroll-standard-css';
  var PANEL_ID = 'fp-payroll-control-center';

  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function money(s) {
    var n = Number(String(s == null ? '' : s).replace(/[^0-9.-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function fmt(n) {
    return 'Sh ' + Math.round(Number(n || 0)).toLocaleString('en-US');
  }

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function isPayrollPage() {
    var main = document.querySelector('main') || document.body;
    var t = norm(main.textContent);
    return t.indexOf('employee payroll') >= 0 ||
      t.indexOf('monthly salary') >= 0 ||
      t.indexOf('mishahara') >= 0 ||
      t.indexOf('payroll management') >= 0;
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.fp-payroll-standard{font-family:inherit}',
      '.fp-payroll-control{margin:14px 0 16px;background:linear-gradient(135deg,#0f2d52 0%,#174c82 58%,#2e90f0 100%);color:#fff;border-radius:18px;padding:15px 16px;box-shadow:0 14px 34px rgba(15,45,82,.18)}',
      '.fp-payroll-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}',
      '.fp-payroll-title{font-size:15px;font-weight:900;letter-spacing:.01em}',
      '.fp-payroll-sub{font-size:11px;opacity:.82;margin-top:3px}',
      '.fp-payroll-tags{display:flex;gap:6px;flex-wrap:wrap}',
      '.fp-payroll-tag{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12);border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800}',
      '.fp-payroll-metrics{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:8px;margin-top:12px}',
      '.fp-payroll-metric{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:9px 10px;min-width:0}',
      '.fp-payroll-metric span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.05em;opacity:.75;font-weight:800}',
      '.fp-payroll-metric strong{display:block;margin-top:3px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fp-payroll-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}',
      '.fp-payroll-btn{border:1px solid rgba(255,255,255,.30);background:#fff;color:#13315a;border-radius:10px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}',
      '.fp-payroll-btn.secondary{background:rgba(255,255,255,.12);color:#fff}',
      '.fp-payroll-issue{margin-top:9px;padding:8px 10px;border-radius:10px;background:rgba(255,190,61,.15);border:1px solid rgba(255,214,102,.33);font-size:10px;line-height:1.45}',
      '.fp-payroll-ok{background:rgba(45,207,139,.14);border-color:rgba(93,229,169,.32)}',
      'table.fp-payroll-table{border-collapse:separate!important;border-spacing:0!important}',
      'table.fp-payroll-table thead th{position:sticky;top:0;z-index:2;white-space:nowrap}',
      'table.fp-payroll-table td{vertical-align:middle}',
      'table.fp-payroll-table td[data-fp-money="1"]{font-variant-numeric:tabular-nums;font-weight:700}',
      '.fp-payroll-status{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:900;border:1px solid transparent}',
      '.fp-payroll-status:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
      '.fp-payroll-status.paid{color:#148458;background:#eaf9f2;border-color:#bcebd6}',
      '.fp-payroll-status.pending,.fp-payroll-status.draft{color:#a56a00;background:#fff7df;border-color:#f0d995}',
      '.fp-payroll-status.partial{color:#8b5cf6;background:#f3efff;border-color:#d8cafa}',
      '.fp-payroll-status.other{color:#52657f;background:#eef3f8;border-color:#d7e1ec}',
      '.fp-payroll-phone{font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.fp-payroll-phone a{color:#2e7fc2;text-decoration:none;font-weight:700}',
      '.fp-payroll-profile-standard{outline:1px solid rgba(46,144,240,.16);outline-offset:-1px}',
      '.fp-payroll-profile-rail{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:7px;margin:10px 0 12px}',
      '.fp-payroll-profile-chip{background:#f5f8fc;border:1px solid #dfe8f2;border-radius:10px;padding:7px 9px;min-width:0}',
      '.fp-payroll-profile-chip span{display:block;color:#718198;text-transform:uppercase;font-size:8px;font-weight:900;letter-spacing:.05em}',
      '.fp-payroll-profile-chip strong{display:block;color:#15315a;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fp-payroll-validation-note{margin:8px 0;padding:8px 10px;border-radius:10px;background:#f8fbff;border:1px solid #dce8f5;color:#466078;font-size:10px;line-height:1.45}',
      'html.fp-dark .fp-payroll-profile-chip{background:#12233b;border-color:#27415f}',
      'html.fp-dark .fp-payroll-profile-chip span{color:#91a7c4}',
      'html.fp-dark .fp-payroll-profile-chip strong{color:#eef6ff}',
      'html.fp-dark .fp-payroll-validation-note{background:#112039;border-color:#29425f;color:#b8cae1}',
      '@media(max-width:900px){.fp-payroll-metrics{grid-template-columns:repeat(2,minmax(120px,1fr))}.fp-payroll-profile-rail{grid-template-columns:repeat(2,minmax(100px,1fr))}}',
      '@media(max-width:600px){.fp-payroll-control{padding:12px}.fp-payroll-metrics{grid-template-columns:1fr 1fr}.fp-payroll-metric strong{font-size:12px}.fp-payroll-profile-rail{grid-template-columns:1fr 1fr}table.fp-payroll-table{display:block;overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch}}',
      '@media print{#fp-payroll-control-center{display:none!important}.fp-payroll-profile-rail{break-inside:avoid}.fp-payroll-status{border:1px solid #aaa!important;background:#fff!important;color:#111!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function findPayrollTable() {
    var tables = document.querySelectorAll('main table');
    for (var i = 0; i < tables.length; i++) {
      if (!visible(tables[i])) continue;
      var hs = Array.prototype.map.call(tables[i].querySelectorAll('thead th'), function (h) { return norm(h.textContent); });
      var hasEmployee = hs.some(function (h) { return h === 'name' || h.indexOf('employee') >= 0 || h.indexOf('mfanyakazi') >= 0; });
      var hasNet = hs.some(function (h) { return h.indexOf('net pay') >= 0 || h === 'net' || h.indexOf('jumla net') >= 0; });
      var hasSalary = hs.some(function (h) { return h.indexOf('salary') >= 0 || h.indexOf('mshahara') >= 0; });
      if (hasEmployee && hasNet && hasSalary) return tables[i];
    }
    return null;
  }

  function headerMap(table) {
    var m = {};
    var hs = table ? table.querySelectorAll('thead th') : [];
    for (var i = 0; i < hs.length; i++) {
      var h = norm(hs[i].textContent);
      if (h === 'name' || h.indexOf('employee') >= 0 || h.indexOf('mfanyakazi') >= 0) m.employee = i;
      if (h.indexOf('phone') >= 0 || h.indexOf('simu') >= 0) m.phone = i;
      if (h.indexOf('salary') >= 0 || h.indexOf('mshahara') >= 0 || h.indexOf('base') >= 0) m.salary = i;
      if (h.indexOf('fare') >= 0 || h.indexOf('nauli') >= 0) m.fare = i;
      if (h.indexOf('advance') >= 0) m.advance = i;
      if (h.indexOf('penalty') >= 0 || h.indexOf('adhabu') >= 0 || h.indexOf('makato') >= 0) m.penalty = i;
      if (h.indexOf('gross') >= 0 || h.indexOf('total pay') >= 0) m.gross = i;
      if (h.indexOf('net pay') >= 0 || h === 'net') m.net = i;
      if (h.indexOf('method') >= 0 || h.indexOf('payment') >= 0 && h.indexOf('type') >= 0) m.method = i;
      if (h.indexOf('pay date') >= 0 || h.indexOf('tarehe') >= 0 && h.indexOf('malipo') >= 0) m.paydate = i;
      if (h.indexOf('status') >= 0 || h.indexOf('hali') >= 0) m.status = i;
    }
    return m;
  }

  function tableStats(table) {
    var map = headerMap(table);
    var rows = table ? table.querySelectorAll('tbody tr') : [];
    var s = { employees: 0, gross: 0, deductions: 0, net: 0, issues: [] };
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelectorAll('td');
      if (!c.length) continue;
      var name = map.employee != null && c[map.employee] ? String(c[map.employee].textContent || '').trim() : '';
      if (!name) continue;
      s.employees++;
      var salary = map.salary != null && c[map.salary] ? money(c[map.salary].textContent) : 0;
      var fare = map.fare != null && c[map.fare] ? money(c[map.fare].textContent) : 0;
      var gross = map.gross != null && c[map.gross] ? money(c[map.gross].textContent) : salary + fare;
      var advance = map.advance != null && c[map.advance] ? money(c[map.advance].textContent) : 0;
      var penalty = map.penalty != null && c[map.penalty] ? money(c[map.penalty].textContent) : 0;
      var net = map.net != null && c[map.net] ? money(c[map.net].textContent) : gross - advance - penalty;
      s.gross += gross;
      s.deductions += advance + penalty;
      s.net += net;
      if (net < 0) s.issues.push(name + ': negative net pay');
      if (advance + penalty > gross && gross > 0) s.issues.push(name + ': deductions exceed gross pay');
      if (map.phone != null && c[map.phone] && !String(c[map.phone].textContent || '').replace(/\s/g, '')) s.issues.push(name + ': phone missing');
      if (map.status != null && c[map.status]) {
        var st = norm(c[map.status].textContent);
        if (st.indexOf('paid') >= 0 && map.paydate != null && c[map.paydate] && !String(c[map.paydate].textContent || '').trim()) s.issues.push(name + ': paid without pay date');
      }
    }
    return s;
  }

  function periodText() {
    var main = document.querySelector('main') || document.body;
    var texts = main.querySelectorAll('button,select,option,span,strong,div');
    for (var i = 0; i < texts.length; i++) {
      var t = String(texts[i].textContent || '').trim();
      if (/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+20\d{2}\b/i.test(t)) return t.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+20\d{2}\b/i)[0].toUpperCase();
      if (/20\d{2}[-\/]\d{1,2}/.test(t)) return t.match(/20\d{2}[-\/]\d{1,2}/)[0];
    }
    return 'Current period';
  }

  function makeMetric(label, value) {
    var d = document.createElement('div');
    d.className = 'fp-payroll-metric';
    d.innerHTML = '<span>' + label + '</span><strong>' + value + '</strong>';
    return d;
  }

  function removeExistingPanel() {
    var x = document.getElementById(PANEL_ID);
    if (x && x.parentNode) x.parentNode.removeChild(x);
  }

  function insertControl(table) {
    if (!table || !isPayrollPage()) return;
    var stats = tableStats(table);
    var parent = table.parentElement;
    if (!parent) return;
    var old = document.getElementById(PANEL_ID);
    if (old && old.__fpSignature === JSON.stringify(stats)) return;
    removeExistingPanel();

    var box = document.createElement('section');
    box.id = PANEL_ID;
    box.className = 'fp-payroll-control fp-payroll-standard';
    box.__fpSignature = JSON.stringify(stats);
    box.innerHTML = '<div class="fp-payroll-head"><div><div class="fp-payroll-title">Payroll Control Center</div><div class="fp-payroll-sub">Professional payroll review · live values from this payroll screen</div></div><div class="fp-payroll-tags"><span class="fp-payroll-tag">Currency: TZS</span><span class="fp-payroll-tag">Pay cycle: Monthly</span><span class="fp-payroll-tag">Period: ' + periodText() + '</span></div></div>';

    var metrics = document.createElement('div');
    metrics.className = 'fp-payroll-metrics';
    metrics.appendChild(makeMetric('Employees', stats.employees));
    metrics.appendChild(makeMetric('Gross payroll', fmt(stats.gross)));
    metrics.appendChild(makeMetric('Deductions', fmt(stats.deductions)));
    metrics.appendChild(makeMetric('Net payroll', fmt(stats.net)));
    metrics.appendChild(makeMetric('Exceptions', stats.issues.length));
    box.appendChild(metrics);

    var actions = document.createElement('div');
    actions.className = 'fp-payroll-actions';
    var validate = document.createElement('button');
    validate.type = 'button';
    validate.className = 'fp-payroll-btn';
    validate.textContent = 'Validate Payroll';
    validate.onclick = function () {
      var latest = tableStats(table);
      if (!latest.issues.length) alert('Payroll validation passed. No obvious data-quality exceptions were detected on the visible payroll records.');
      else alert('Payroll validation found ' + latest.issues.length + ' exception(s):\n\n- ' + latest.issues.slice(0, 15).join('\n- ') + (latest.issues.length > 15 ? '\n…' : ''));
    };
    actions.appendChild(validate);

    var print = document.createElement('button');
    print.type = 'button';
    print.className = 'fp-payroll-btn secondary';
    print.textContent = 'Print Payroll Review';
    print.onclick = function () { window.print(); };
    actions.appendChild(print);
    box.appendChild(actions);

    var note = document.createElement('div');
    note.className = 'fp-payroll-issue ' + (stats.issues.length ? '' : 'fp-payroll-ok');
    note.textContent = stats.issues.length ? ('Review required: ' + stats.issues.length + ' data-quality exception(s) detected before final payroll approval.') : 'Payroll review passed: no obvious data-quality exceptions detected on visible records.';
    box.appendChild(note);

    if (parent.parentNode) parent.parentNode.insertBefore(box, parent);
  }

  function enhanceRows(table) {
    if (!table) return;
    table.classList.add('fp-payroll-table');
    var map = headerMap(table);
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelectorAll('td');
      var moneyCols = [map.salary, map.fare, map.advance, map.penalty, map.gross, map.net];
      moneyCols.forEach(function (idx) {
        if (idx != null && c[idx]) c[idx].setAttribute('data-fp-money', '1');
      });
      if (map.phone != null && c[map.phone]) {
        c[map.phone].classList.add('fp-payroll-phone');
        var raw = String(c[map.phone].textContent || '').trim();
        if (raw && !c[map.phone].querySelector('a')) {
          c[map.phone].textContent = '';
          var a = document.createElement('a');
          a.href = 'tel:' + raw.replace(/\s+/g, '');
          a.textContent = raw;
          c[map.phone].appendChild(a);
        }
      }
      if (map.status != null && c[map.status]) {
        var txt = String(c[map.status].textContent || '').trim();
        if (txt && !c[map.status].querySelector('.fp-payroll-status')) {
          var k = norm(txt);
          var cls = k.indexOf('paid') >= 0 && k.indexOf('unpaid') < 0 ? 'paid' : k.indexOf('partial') >= 0 ? 'partial' : k.indexOf('pending') >= 0 ? 'pending' : k.indexOf('draft') >= 0 ? 'draft' : 'other';
          c[map.status].textContent = '';
          var pill = document.createElement('span');
          pill.className = 'fp-payroll-status ' + cls;
          pill.textContent = txt;
          c[map.status].appendChild(pill);
        }
      }
    }
  }

  function findProfile() {
    var nodes = document.querySelectorAll('div,section,article,form');
    for (var i = 0; i < nodes.length; i++) {
      if (!visible(nodes[i])) continue;
      var t = norm(nodes[i].textContent);
      if ((t.indexOf('employee profile') >= 0 || t.indexOf('taarifa binafsi') >= 0) && nodes[i].querySelectorAll('input').length >= 5) return nodes[i];
    }
    return null;
  }

  function findText(root, re) {
    var els = root ? root.querySelectorAll('strong,b,span,div') : [];
    for (var i = 0; i < els.length; i++) {
      var t = String(els[i].textContent || '').trim();
      if (re.test(t)) return t;
    }
    return '';
  }

  function enhanceProfile() {
    var root = findProfile();
    if (!root || root.querySelector('.fp-payroll-profile-rail')) return;
    root.classList.add('fp-payroll-profile-standard');
    var title = findText(root, /\b[A-Z][A-Z .()'-]{3,}\b/);
    var period = periodText();
    var net = findText(root, /^Sh\s*[\d,]+(?:\.\d+)?$/i) || findText(root, /net pay/i);
    var rail = document.createElement('div');
    rail.className = 'fp-payroll-profile-rail';
    var vals = [
      ['Employee', title || 'Employee record'],
      ['Pay period', period],
      ['Currency', 'TZS'],
      ['Record control', 'Review before payment']
    ];
    for (var i = 0; i < vals.length; i++) {
      var d = document.createElement('div');
      d.className = 'fp-payroll-profile-chip';
      d.innerHTML = '<span>' + vals[i][0] + '</span><strong>' + vals[i][1] + '</strong>';
      rail.appendChild(d);
    }
    var anchor = root.querySelector('hr') || root.children[2] || root.firstChild;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(rail, anchor.nextSibling);
    else root.insertBefore(rail, root.firstChild);

    var note = document.createElement('div');
    note.className = 'fp-payroll-validation-note';
    note.textContent = 'Payroll control: verify employee identity, pay period, earnings, deductions, payment method and pay date before marking the record as paid. Statutory deductions should be configured from the applicable Tanzania payroll rules rather than guessed in the UI.';
    rail.parentNode.insertBefore(note, rail.nextSibling);
  }

  function run() {
    if (!isPayrollPage()) return;
    addStyles();
    var table = findPayrollTable();
    if (table) {
      enhanceRows(table);
      insertControl(table);
    }
    enhanceProfile();
  }

  function boot() {
    run();
    var timer = null;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(run, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
