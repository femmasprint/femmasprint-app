/* fp-theme.js — FemmasBot: professional Light / Dark / System theme control + a
 * small language helper. The theme control drives the app's OWN toggle so the
 * darkMode state and html.fp-dark class stay in sync; persistent CSS darkens the
 * app's light surfaces so nothing can flash white on any re-render; and on load we
 * fast-apply the saved language (killing the flash-of-English) plus a supplementary
 * Swahili dictionary for form/invoice labels the app's own i18n misses. */
(function () {
  var LS_MODE = 'fp_mode', LS_DARK = 'fp_dark';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    /* Root stays dark the instant the class is present — backdrop can't flash white. */
    'html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
    /* Hide the app's ORIGINAL single sun/moon toggle by its title (EN + SW), instantly
       and on every re-render, so it never shows up beside our 3-way control. Our own
       buttons are titled "Light"/"Dark"/"System" so they are never matched. */
    'button[title*="Light / Dark"],button[title*="Mwanga / Giza"]{display:none !important}' +
    /* Any light card we tag during the switch is painted dark immediately, in place. */
    'html.fp-dark .fp-fd{background:#131a2b !important;background-color:#131a2b !important;' +
    'border-color:rgba(255,255,255,.07) !important;color:#e6edf7 !important}' +
    /* PERSISTENT dark override for the app's light surfaces so nothing can flash white on
       ANY re-render. The app leaves its full-page wrapper (and some cards) LIGHT and only
       the theme makes them dark; a transient JS tag only covered the switch, so re-renders
       (the Arifa card cycles ~1/s) briefly showed white. These CSS rules always apply while
       fp-dark is on. Grey/blue tones are background-only values so are safe unscoped; pure
       white is scoped to `background:` to avoid recolouring white TEXT (e.g. blue buttons). */
    'html.fp-dark [style*="rgb(245, 248, 252)"]{background:#0a0e1a !important;background-color:#0a0e1a !important}' +
    'html.fp-dark [style*="rgb(248, 249, 251)"],html.fp-dark [style*="rgb(244, 245, 247)"],' +
    'html.fp-dark [style*="rgb(233, 243, 254)"],' +
    'html.fp-dark [style*="background:#fff"],html.fp-dark [style*="background: #fff"],' +
    'html.fp-dark [style*="background: rgb(255, 255, 255)"],html.fp-dark [style*="background:rgb(255, 255, 255)"],' +
    'html.fp-dark [style*="background: rgba(255, 255, 255"],html.fp-dark [style*="background:rgba(255, 255, 255"]' +
    '{background:#131a2b !important;background-color:#131a2b !important;border-color:rgba(255,255,255,.07) !important}' +
    /* Dark slate/near-black text used on those cards -> light, so nothing goes
       invisible during the beat before the app repaints it. Colour accents
       (green / red / amber) are left untouched. */
    'html.fp-dark [style*="color: rgb(15, 23, 42)"],html.fp-dark [style*="color:#0f172a"],' +
    'html.fp-dark [style*="color: rgb(31, 41, 55)"],html.fp-dark [style*="color: rgb(71, 85, 105)"],' +
    'html.fp-dark [style*="color: rgb(19, 49, 90)"],html.fp-dark [style*="color:#13315a"],' +
    'html.fp-dark [style*="color: rgb(47, 86, 136)"]{color:#dbe6f5 !important}' +
    /* segmented control */
    '.fp-theme{display:inline-flex;align-items:center;gap:2px;background:rgba(130,150,180,.16);' +
    'border-radius:10px;padding:3px;vertical-align:middle}' +
    '.fp-theme button{all:unset;box-sizing:border-box;cursor:pointer;width:30px;height:26px;' +
    'display:flex;align-items:center;justify-content:center;border-radius:7px;color:#7d93b3;' +
    'transition:background .15s,color .15s}' +
    '.fp-theme button:hover{color:#cfe0f5}' +
    '.fp-theme button.on{background:#2e90f0;color:#fff;box-shadow:0 2px 6px rgba(46,144,240,.4)}' +
    '.fp-theme svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;' +
    'stroke-linecap:round;stroke-linejoin:round}';

  function icon(m) {
    if (m === 'light') return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    if (m === 'dark') return '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    return '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function systemDark() { return mq ? mq.matches : false; }

  function findThemeBtn() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) return btns[i];
    }
    return null;
  }

  function markLightCards(on) {
    var els = document.querySelectorAll('[style*="background"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!on) { el.classList.remove('fp-fd'); continue; }
      var m = (el.getAttribute('style') || '').match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/);
      if (!m) { el.classList.remove('fp-fd'); continue; }
      var c = m[1], rgb = c.match(/(\d+),\s*(\d+),\s*(\d+)/);
      var bright = rgb ? (+rgb[1] + +rgb[2] + +rgb[3]) > 560 : /#fff|#f[0-9a-f]|white/i.test(c);
      el.classList.toggle('fp-fd', bright);
    }
  }

  function flip(dark, animate) {
    var html = document.documentElement;
    set(LS_DARK, dark ? '1' : '0');
    if (html.classList.contains('fp-dark') === dark && !animate) return;
    var already = html.classList.contains('fp-dark') === dark;
    if (!already) {
      var b = findThemeBtn();
      if (!b) { html.classList.toggle('fp-dark', dark); }
      else { b.click(); if (html.classList.contains('fp-dark') !== dark) b.click(); }
    }
    if (!animate) return;
    if (dark) {
      var t0 = performance.now();
      (function chase() {
        markLightCards(true);
        if (performance.now() - t0 < 600) requestAnimationFrame(chase);
      })();
    } else {
      markLightCards(false);
    }
  }

  var wrap = null, booted = false;
  function paint(mode) {
    if (!wrap) return;
    [].forEach.call(wrap.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-m') === mode);
    });
  }

  function setMode(mode) {
    set(LS_MODE, mode);
    var dark = mode === 'dark' ? true : mode === 'light' ? false : systemDark();
    var isDark = document.documentElement.classList.contains('fp-dark');
    paint(mode);
    if (dark === isDark) { set(LS_DARK, dark ? '1' : '0'); if (dark) markLightCards(true); return; }
    flip(dark, booted);
  }

  function hideNatives() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) btns[i].style.setProperty('display', 'none', 'important');
    }
  }

  function build() {
    hideNatives();
    var existing = document.querySelectorAll('.fp-theme');
    if (existing.length) {
      for (var d = 1; d < existing.length; d++) { if (existing[d].parentNode) existing[d].parentNode.removeChild(existing[d]); }
      paint(get(LS_MODE) || 'system');
      return true;
    }
    var oldBtn = findThemeBtn();
    if (!oldBtn || !oldBtn.parentNode) return false;
    wrap = document.createElement('div');
    wrap.className = 'fp-theme';
    ['light', 'dark', 'system'].forEach(function (m) {
      var b = document.createElement('button');
      b.setAttribute('data-m', m);
      b.title = m.charAt(0).toUpperCase() + m.slice(1);
      b.innerHTML = icon(m);
      b.addEventListener('click', function () { setMode(m); });
      wrap.appendChild(b);
    });
    oldBtn.style.display = 'none';
    oldBtn.parentNode.insertBefore(wrap, oldBtn);
    setMode(get(LS_MODE) || 'system');
    return true;
  }

  function initMode() {
    var mode = get(LS_MODE);
    if (!mode) {
      mode = get(LS_DARK) === '1' ? 'dark' : (get(LS_DARK) === '0' ? 'light' : 'system');
      set(LS_MODE, mode);
    }
    setMode(mode);
    if (mq) {
      var onChange = function () { if (get(LS_MODE) === 'system') setMode('system'); };
      try { mq.addEventListener('change', onChange); } catch (e) { try { mq.addListener(onChange); } catch (e2) {} }
    }
  }

  // Fast-apply the saved language on load to remove the flash-of-English after reload.
  function fastLang() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    var t0 = Date.now();
    var iv = setInterval(function () {
      try { if (window.FPSetLang) window.FPSetLang(lang); } catch (e) {}
      if (Date.now() - t0 > 1600) clearInterval(iv);
    }, 60);
  }

  // Supplementary Swahili for strings the app's main i18n dictionary misses — mostly
  // form/modal/invoice labels that render after load. Applied (EN->SW) only when the
  // saved language is Swahili. Longer phrases first so partial matches don't clash.
  var EXTRA_SW = [
    ['Shipping/Delivery Address', 'Anwani ya Kupeleka'],
    ['Terms & Conditions', 'Masharti na Vigezo'],
    ['Preview & Share', 'Hakiki & Sambaza'],
    ['Delivery Details', 'Maelezo ya Usafirishaji'],
    ['Invoice Number', 'Namba ya Ankara'],
    ['Invoice Date', 'Tarehe ya Ankara'],
    ['Bill Number', 'Namba ya Bili'],
    ['Bill Date', 'Tarehe ya Bili'],
    ['Amount in Words', 'Kiasi kwa Maneno'],
    ['Enter supplier name', 'Weka jina la muuzaji'],
    ['Enter customer name', 'Weka jina la mteja'],
    ['Price/Unit', 'Bei/Kipimo'],
    ['Bill To', 'Ankara Kwa'],
    ['Payment', 'Malipo']
  ];
  function extraI18n() {
    var lang;
    try { lang = localStorage.getItem('fp_lang') || 'sw'; } catch (e) { lang = 'sw'; }
    if (lang !== 'sw') return;
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n;
      while ((n = w.nextNode())) {
        var v = n.nodeValue; if (!v || v.length > 60) continue;
        var nv = v;
        for (var i = 0; i < EXTRA_SW.length; i++) {
          if (nv.indexOf(EXTRA_SW[i][0]) >= 0) nv = nv.split(EXTRA_SW[i][0]).join(EXTRA_SW[i][1]);
        }
        if (nv !== v) n.nodeValue = nv;
      }
    } catch (e) {}
  }

  function boot() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    initMode();
    build();
    fastLang();
    extraI18n();
    setTimeout(function () { booted = true; }, 1200);
    setInterval(function () { build(); extraI18n(); }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
