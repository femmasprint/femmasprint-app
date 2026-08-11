/* FEMMAS PRINT — Base44 Form Parity Engine
 * Makes the live transaction/document forms use the same flat Vyapar-style
 * visual language as the FEMMAS Base44 app without replacing the real app's
 * data, handlers, backend sync, numbering or save logic.
 */
(function () {
  'use strict';
  if (window.__fpBase44Forms) return;
  window.__fpBase44Forms = true;

  var STYLE_ID = 'fp-base44-form-parity-css';
  var ROOT_CLASS = 'fp-base44-form';

  var css = [
    /* exact Base44/Vyapar form palette */
    '.' + ROOT_CLASS + '{background:#f7f7f7!important;color:#474747!important;font-family:Inter,Arial,system-ui,-apple-system,sans-serif!important;font-size:12px!important;}',
    '.' + ROOT_CLASS + ' *{box-sizing:border-box!important;}',
    '.' + ROOT_CLASS + ' [style*="background:#eef5fd"],.' + ROOT_CLASS + ' [style*="background: #eef5fd"]{background:#eff8ff!important;}',

    /* kill global neumorphic treatment only inside document forms */
    '.' + ROOT_CLASS + ' input:not([type="checkbox"]):not([type="radio"]),.' + ROOT_CLASS + ' select,.' + ROOT_CLASS + ' textarea{background:#fff!important;color:#374151!important;border:1px solid #d1d5db!important;border-radius:4px!important;box-shadow:none!important;outline:none!important;min-height:36px;}',
    '.' + ROOT_CLASS + ' input:not([type="checkbox"]):not([type="radio"]):focus,.' + ROOT_CLASS + ' select:focus,.' + ROOT_CLASS + ' textarea:focus{border-color:#168bd2!important;box-shadow:0 0 0 1px #168bd2!important;}',
    '.' + ROOT_CLASS + ' input::placeholder,.' + ROOT_CLASS + ' textarea::placeholder{color:#9ca3af!important;opacity:1!important;}',
    '.' + ROOT_CLASS + ' input[type="checkbox"]{accent-color:#168bd2!important;}',

    /* buttons */
    '.' + ROOT_CLASS + ' button,.' + ROOT_CLASS + ' [role="button"]{border-radius:4px!important;box-shadow:none!important;transform:none!important;font-family:inherit!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-primary{background:#168bd2!important;color:#fff!important;border:1px solid #168bd2!important;box-shadow:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-primary:hover{background:#117bbd!important;filter:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-outline{background:#fff!important;color:#168bd2!important;border:1px solid #168bd2!important;box-shadow:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-outline:hover{background:#f0f9ff!important;filter:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-muted{background:#fff!important;color:#6b7280!important;border:1px solid #d1d5db!important;box-shadow:none!important;}',

    /* document chrome */
    '.' + ROOT_CLASS + ' .fp-b44-companybar{height:32px!important;min-height:32px!important;background:#fff!important;border-bottom:1px solid #e5e7eb!important;color:#6b7280!important;display:flex!important;align-items:center!important;padding:0 16px!important;font-size:11px!important;line-height:1!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-companybar .fp-b44-spacer{flex:1!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-companybar a{color:#6b7280!important;text-decoration:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-companybar b{color:#168bd2!important;font-weight:600!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-tabbar{height:36px!important;min-height:36px!important;background:#ededed!important;border-bottom:1px solid #d1d5db!important;display:flex!important;align-items:flex-end!important;padding:0 8px!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-tab{height:32px!important;min-width:185px!important;max-width:280px!important;background:#e4e4e4!important;border:1px solid #d1d5db!important;border-bottom:0!important;border-radius:4px 4px 0 0!important;padding:0 12px!important;display:flex!important;align-items:center!important;gap:8px!important;color:#4b5563!important;font-size:11px!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-tab span{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',

    /* headings + cards */
    '.' + ROOT_CLASS + ' h1,.' + ROOT_CLASS + ' h2,.' + ROOT_CLASS + ' h3,.' + ROOT_CLASS + ' h4{color:#374151!important;letter-spacing:0!important;}',
    '.' + ROOT_CLASS + ' h1{font-size:17px!important;font-weight:600!important;}',
    '.' + ROOT_CLASS + ' h4{font-size:14px!important;font-weight:600!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-panel{background:#fff!important;border:1px solid #d1d5db!important;border-radius:4px!important;box-shadow:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-soft{background:#fff!important;border-color:#e5e7eb!important;box-shadow:none!important;}',

    /* item grid */
    '.' + ROOT_CLASS + ' table{background:#fff!important;color:#374151!important;border-collapse:collapse!important;border-spacing:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;}',
    '.' + ROOT_CLASS + ' thead,.' + ROOT_CLASS + ' th{background:#fff!important;color:#4b5563!important;border-color:#d1d5db!important;box-shadow:none!important;font-size:10px!important;font-weight:600!important;text-transform:none!important;}',
    '.' + ROOT_CLASS + ' td{background:#fff!important;color:#374151!important;border-color:#e5e7eb!important;box-shadow:none!important;}',
    '.' + ROOT_CLASS + ' tr:hover td{background:#f8fbfe!important;}',
    '.' + ROOT_CLASS + ' table input,.' + ROOT_CLASS + ' table select{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;min-height:30px!important;}',
    '.' + ROOT_CLASS + ' table input:focus,.' + ROOT_CLASS + ' table select:focus{border:0!important;box-shadow:none!important;background:#f0f9ff!important;}',

    /* labels and financial block */
    '.' + ROOT_CLASS + ' label{color:#6b7280!important;font-weight:500!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-blue-label{color:#168bd2!important;font-size:10px!important;font-weight:600!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-money{font-variant-numeric:tabular-nums!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-total{background:#fff!important;border:1px solid #d1d5db!important;border-radius:4px!important;color:#374151!important;font-weight:600!important;box-shadow:none!important;}',

    /* file/description controls */
    '.' + ROOT_CLASS + ' .fp-b44-action-control{background:#fff!important;color:#6b7280!important;border:1px solid #d1d5db!important;border-radius:4px!important;box-shadow:none!important;text-transform:uppercase!important;font-size:10px!important;font-weight:500!important;}',

    /* make terms block match Base44 */
    '.' + ROOT_CLASS + ' .fp-b44-terms{background:#fff!important;border:1px solid #d1d5db!important;border-radius:4px!important;padding:16px!important;box-shadow:none!important;}',
    '.' + ROOT_CLASS + ' .fp-b44-terms [style*="background:#fafbfc"],.' + ROOT_CLASS + ' .fp-b44-terms [style*="background: #fafbfc"]{background:#fff!important;border-color:#e5e7eb!important;}',

    /* footer action bar */
    '.' + ROOT_CLASS + ' .fp-b44-footer{background:#fff!important;border-top:1px solid #e5e7eb!important;box-shadow:none!important;}',

    /* dark mode: Base44 form remains readable but uses neutral dark surfaces */
    'html.fp-dark .' + ROOT_CLASS + '{background:#111827!important;color:#e5e7eb!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' .fp-b44-companybar{background:#111827!important;color:#9ca3af!important;border-color:#374151!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' .fp-b44-tabbar{background:#1f2937!important;border-color:#374151!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' .fp-b44-tab{background:#273244!important;border-color:#374151!important;color:#e5e7eb!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' input:not([type="checkbox"]):not([type="radio"]),html.fp-dark .' + ROOT_CLASS + ' select,html.fp-dark .' + ROOT_CLASS + ' textarea{background:#111827!important;color:#f3f4f6!important;border-color:#4b5563!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' table,html.fp-dark .' + ROOT_CLASS + ' thead,html.fp-dark .' + ROOT_CLASS + ' th,html.fp-dark .' + ROOT_CLASS + ' td,html.fp-dark .' + ROOT_CLASS + ' .fp-b44-panel,html.fp-dark .' + ROOT_CLASS + ' .fp-b44-terms,html.fp-dark .' + ROOT_CLASS + ' .fp-b44-footer{background:#111827!important;color:#e5e7eb!important;border-color:#374151!important;}',
    'html.fp-dark .' + ROOT_CLASS + ' h1,html.fp-dark .' + ROOT_CLASS + ' h2,html.fp-dark .' + ROOT_CLASS + ' h3,html.fp-dark .' + ROOT_CLASS + ' h4{color:#f3f4f6!important;}',

    '@media(max-width:900px){.' + ROOT_CLASS + ' .fp-b44-companybar{display:none!important;}.' + ROOT_CLASS + ' .fp-b44-tab{min-width:150px!important;}.' + ROOT_CLASS + ' table{min-width:820px!important;}.' + ROOT_CLASS + ' .fp-b44-terms{min-width:0!important;}}',
    '@media(max-width:600px){.' + ROOT_CLASS + '{font-size:11px!important;}.' + ROOT_CLASS + ' .fp-b44-tabbar{height:34px!important;min-height:34px!important;}.' + ROOT_CLASS + ' input:not([type="checkbox"]):not([type="radio"]),.' + ROOT_CLASS + ' select,.' + ROOT_CLASS + ' textarea{font-size:16px!important;}.' + ROOT_CLASS + ' .fp-b44-primary,.' + ROOT_CLASS + ' .fp-b44-outline{min-height:40px!important;}}'
  ].join('');

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function txt(el) {
    return String(el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function looksLikeTransactionForm(el) {
    if (!el || el.nodeType !== 1) return false;
    var t = txt(el);
    if (!t || t.length < 120) return false;
    var hasItems = /ITEM|Item Name|PRICE\/UNIT|Price\/Unit/i.test(t) && /QTY|Qty/i.test(t);
    var hasMoney = /Payment Type|Discount|Balance|Received/i.test(t);
    var hasDoc = /Sale|Purchase|Estimate|Quotation|Proforma|Order|Return|Delivery/i.test(t);
    return hasItems && hasMoney && hasDoc;
  }

  function findRoot() {
    var z = document.querySelectorAll('div[style*="z-index: 60"],div[style*="z-index:60"],div[style*="z-index: 70"],div[style*="z-index:70"],div[style*="z-index: 80"],div[style*="z-index:80"]');
    for (var i = z.length - 1; i >= 0; i--) if (looksLikeTransactionForm(z[i])) return z[i];
    var dialogs = document.querySelectorAll('[role="dialog"],#fp-main > div');
    for (var j = dialogs.length - 1; j >= 0; j--) if (looksLikeTransactionForm(dialogs[j])) return dialogs[j];
    return null;
  }

  function directChildByText(root, needle) {
    var all = root.querySelectorAll('div,section,article');
    for (var i = 0; i < all.length; i++) {
      var t = txt(all[i]);
      if (t.indexOf(needle) > -1 && t.length < 1400) return all[i];
    }
    return null;
  }

  function markButtons(root) {
    var bs = root.querySelectorAll('button,label[style*="cursor:pointer"],label[style*="cursor: pointer"]');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], t = txt(b).toLowerCase();
      b.classList.remove('fp-b44-primary','fp-b44-outline','fp-b44-muted','fp-b44-action-control');
      if (/^(save|hifadhi)\b/.test(t) || /^save\s*&/.test(t)) b.classList.add('fp-b44-primary');
      else if (/^(share|sambaza)\b/.test(t) || /add row/i.test(t)) b.classList.add('fp-b44-outline');
      else if (/add image|add document|add description|ongeza picha|ongeza document|maelezo/i.test(t)) b.classList.add('fp-b44-action-control');
      else if (/cancel|close|futa|delete/i.test(t)) b.classList.add('fp-b44-muted');
    }
  }

  function markLabels(root) {
    var labels = root.querySelectorAll('label');
    for (var i = 0; i < labels.length; i++) {
      var t = txt(labels[i]);
      if (/^(Customer|Supplier|Party|Mteja|Muuzaji)/i.test(t)) labels[i].classList.add('fp-b44-blue-label');
    }
  }

  function markPanels(root) {
    var terms = directChildByText(root, 'Terms & Conditions') || directChildByText(root, 'Terms and Conditions');
    if (terms) terms.classList.add('fp-b44-terms');

    var tables = root.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var p = tables[i].parentElement;
      if (p) p.classList.add('fp-b44-soft');
    }

    var nodes = root.querySelectorAll('div,section');
    for (var j = 0; j < nodes.length; j++) {
      var t = txt(nodes[j]);
      if (t.length > 20 && t.length < 700 && (/Discount/.test(t) && /Balance/.test(t) && /Received/.test(t))) nodes[j].classList.add('fp-b44-money');
      if (t.length > 10 && t.length < 120 && /^Total\b/i.test(t)) nodes[j].classList.add('fp-b44-total');
    }
  }

  function titleFor(root) {
    var h = root.querySelector('h1,h2,h3');
    if (h && txt(h)) return txt(h);
    var t = txt(root);
    var m = t.match(/(Estimate\s*\/\s*Quotation|Proforma Invoice|Purchase(?: Bill)?|Sale Order|Sale Return|Delivery Challan|Sale)/i);
    return m ? m[1] : 'Transaction';
  }

  function addChrome(root) {
    if (!root.querySelector('.fp-b44-companybar')) {
      var bar = document.createElement('div');
      bar.className = 'fp-b44-companybar';
      bar.innerHTML = '<span>Company&nbsp;&nbsp;&nbsp; Help&nbsp;&nbsp;&nbsp; Versions&nbsp;&nbsp;&nbsp; Shortcuts</span><span class="fp-b44-spacer"></span><span>WhatsApp Chat Support &nbsp; <b>+255 658 843 344</b></span>';
      root.insertBefore(bar, root.firstChild);
    }
    if (!root.querySelector('.fp-b44-tabbar')) {
      var tabbar = document.createElement('div');
      tabbar.className = 'fp-b44-tabbar';
      var title = titleFor(root);
      tabbar.innerHTML = '<div class="fp-b44-tab"><span>' + title.replace(/[&<>]/g, '') + '</span><span style="margin-left:auto;color:#6b7280">×</span></div>';
      var company = root.querySelector('.fp-b44-companybar');
      if (company && company.nextSibling) root.insertBefore(tabbar, company.nextSibling); else root.appendChild(tabbar);
    }
  }

  function decorate(root) {
    if (!root) return;
    root.classList.add(ROOT_CLASS);
    addChrome(root);
    markButtons(root);
    markLabels(root);
    markPanels(root);
  }

  var pending = false;
  function scan() {
    pending = false;
    addStyles();
    var root = findRoot();
    if (root) decorate(root);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  function boot() {
    addStyles();
    scan();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
    setInterval(scan, 1100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
