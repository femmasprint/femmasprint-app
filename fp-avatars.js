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
