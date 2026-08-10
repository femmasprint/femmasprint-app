/* FEMMAS PRINT lightweight expense avatars.
 * Office => FP logo. Known staff => repo staff photo. Unknown people => initials.
 * Double-click avatar to save a small manual photo override in this browser.
 */
(function () {
  'use strict';

  var FP_LOGO = '/femmas-logo-03-mqrt99vq.png';
  var PHOTO = {
    'ismail issa': '/staff/ismail-salmu.png',
    'hassan mwesiumo': '/staff/hassan-official.png',
    'hasan': '/staff/hassan-official.png',
    'hassan': '/staff/hassan-official.png',
    'ismar salim hussein (suma)': '/staff/ismo.png',
    'ismo': '/staff/ismo.png',
    'suma': '/staff/suma.png',
    'steven mkope': '/staff/steave.png',
    'stive': '/staff/steave.png',
    'fadhili ally': '/staff/fadhili.png',
    'fadhil': '/staff/fadhili.png',
    'emanuel w. sese (ima)': '/staff/emanuel.png',
    'imma': '/staff/emanuel.png',
    'sedekia johnson laurent': '/staff/sidekea.png',
    'sedekia': '/staff/sidekea.png',
    'henry charles kwedi': '/staff/henry-kwedi.png',
    'kwedy': '/staff/henry-kwedi.png',
    'shaibu frank malekela': '/staff/shahibu.png',
    'shaibu': '/staff/shahibu.png',
    'omary': '/staff/omary.png',
    'omari': '/staff/omari.png',
    'magesa': '/staff/magessa.png',
    'felice masanje': '/staff/felician.png',
    'felician masanje': '/staff/felician.png'
  };

  function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function key(name) { return 'fp_person_avatar:' + norm(name); }
  function isOffice(name) { return /^(office|officee|ofisi)$/i.test(String(name || '').trim()); }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function override(name) { try { return localStorage.getItem(key(name)); } catch (e) { return null; } }
  function srcFor(name) { return override(name) || (isOffice(name) ? FP_LOGO : PHOTO[norm(name)] || null); }

  function resize(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var n = 192, c = document.createElement('canvas'), x = c.getContext('2d');
        c.width = c.height = n;
        var scale = Math.max(n / im.width, n / im.height), w = im.width * scale, h = im.height * scale;
        x.drawImage(im, (n - w) / 2, (n - h) / 2, w, h);
        cb(c.toDataURL('image/jpeg', .82));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function choose(name, avatar) {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = function () {
      var f = input.files && input.files[0]; if (!f) return;
      resize(f, function (data) {
        try { localStorage.setItem(key(name), data); } catch (e) {}
        paintAvatar(avatar, name, data);
      });
    };
    input.click();
  }

  function paintAvatar(el, name, forcedSrc) {
    var src = forcedSrc || srcFor(name);
    el.textContent = '';
    if (src) {
      var img = document.createElement('img');
      img.src = src; img.alt = name;
      img.style.cssText = 'width:26px;height:26px;border-radius:50%;object-fit:cover;display:block;background:#eef4fb';
      img.onerror = function () { el.textContent = initials(name); };
      el.appendChild(img);
    } else {
      el.textContent = initials(name);
    }
  }

  function makeAvatar(name) {
    var a = document.createElement('span');
    a.className = 'fp-exp-avatar';
    a.style.cssText = 'width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:0 0 26px;background:#2e90f0;color:#fff;font-size:10px;font-weight:800;overflow:hidden;cursor:pointer;vertical-align:middle;margin-right:7px';
    a.title = name + ' — double-click kubadilisha picha';
    a.ondblclick = function (e) { e.preventDefault(); e.stopPropagation(); choose(name, a); };
    paintAvatar(a, name);
    return a;
  }

  function expenseTable(t) {
    var hs = Array.prototype.map.call(t.querySelectorAll('thead th'), function (h) { return norm(h.textContent); });
    var hasName = hs.some(function (h) { return h === 'jina' || h === 'name'; });
    var hasReason = hs.some(function (h) { return h.indexOf('sababu') >= 0 || h.indexOf('reason') >= 0 || h.indexOf('kitu') >= 0; });
    return hasName && hasReason;
  }

  function enhance() {
    var tables = document.querySelectorAll('main table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i]; if (!expenseTable(t)) continue;
      var rows = t.querySelectorAll('tbody tr');
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll('td'); if (cells.length < 3) continue;
        var nameCell = cells[1];
        if (nameCell.querySelector('.fp-exp-avatar')) continue;
        var name = (nameCell.textContent || '').trim();
        if (!name || /^(jina|name)$/i.test(name)) continue;
        nameCell.style.whiteSpace = 'nowrap';
        nameCell.insertBefore(makeAvatar(name), nameCell.firstChild);
      }
    }
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    enhance();
    var timer;
    new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(enhance, 120); }).observe(document.body, { childList: true, subtree: true });
    setInterval(enhance, 2500);
  });
})();

/* FEMMAS PRINT — Employee Payroll profile phone hydrator.
 * The Employees sheet already stores these numbers. The current payroll profile form
 * renders an empty PHONE NUMBER field, so this bridge supplies the matching employee
 * number to the visible profile without overwriting anything the user has typed.
 */
(function () {
  'use strict';

  var STAFF = {
    'ismail issa': { phone: '+255711888798' },
    'hassan mwesiumo': { phone: '+255789276255' },
    'ismar salim hussein (suma)': { phone: '+255748727077' },
    'ismail salmu': { phone: '+255748727077' },
    'steven mkope': { phone: '+255713279556' },
    'fadhili ally': { phone: '+255621875988' },
    'fadhil ally': { phone: '+255621875988' },
    'emanuel w. sese (ima)': { phone: '+255692307562' },
    'emanuel w. sese': { phone: '+255692307562' },
    'sedekia johnson laurent': { phone: '+255613130661' },
    'sedekia johnson': { phone: '+255613130661' },
    'henry charles kwedi': { phone: '+255626605858' },
    'henry kwedi': { phone: '+255626605858' },
    'shaibu frank malekela': { phone: '+255792871472' },
    'shaibu frank': { phone: '+255792871472' }
  };

  function n(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findProfileRoot() {
    var nodes = document.querySelectorAll('div,section,article,form');
    for (var i = 0; i < nodes.length; i++) {
      if (!visible(nodes[i])) continue;
      var tx = n(nodes[i].textContent);
      if (tx.indexOf('employee profile') < 0 && tx.indexOf('taarifa binafsi') < 0) continue;
      if (nodes[i].querySelectorAll('input').length < 3) continue;
      var p = nodes[i];
      while (p.parentElement && p.parentElement.querySelectorAll('input').length < 18) {
        var pt = n(p.parentElement.textContent);
        if (pt.indexOf('employee profile') < 0 && pt.indexOf('taarifa binafsi') < 0) break;
        p = p.parentElement;
      }
      return p;
    }
    return null;
  }

  function employeeFor(root) {
    if (!root) return null;
    var els = root.querySelectorAll('h1,h2,h3,h4,strong,b,span,div');
    for (var i = 0; i < els.length; i++) {
      if (!visible(els[i])) continue;
      var t = n(els[i].textContent);
      if (STAFF[t]) return STAFF[t];
    }
    return null;
  }

  function inputFromLabel(root, wanted) {
    var els = root.querySelectorAll('label,span,div,p');
    for (var i = 0; i < els.length; i++) {
      if (!visible(els[i])) continue;
      var t = n(els[i].textContent);
      if (wanted.indexOf(t) < 0) continue;
      var box = els[i];
      for (var up = 0; up < 4 && box; up++, box = box.parentElement) {
        var inp = box.querySelector && box.querySelector('input');
        if (inp && visible(inp)) return inp;
      }
    }
    return null;
  }

  function nativeSet(input, value) {
    if (!input || !value) return;
    if (String(input.value || '').trim()) return;
    try {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
    } catch (e) {
      input.value = value;
    }
    input.setAttribute('value', value);
    input.setAttribute('data-fp-employee-phone', '1');
    try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e1) {}
    try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e2) {}
  }

  function hydrate() {
    var root = findProfileRoot();
    if (!root) return;
    var staff = employeeFor(root);
    if (!staff || !staff.phone) return;

    var phone = inputFromLabel(root, ['phone number', 'namba ya simu', 'simu']);
    if (!phone) {
      var candidates = root.querySelectorAll('input[placeholder*="07"],input[type="tel"]');
      if (candidates.length) phone = candidates[0];
    }
    nativeSet(phone, staff.phone);
  }

  function boot() {
    hydrate();
    var t = null;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(hydrate, 80);
    }).observe(document.body, { childList: true, subtree: true });
    setInterval(hydrate, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
