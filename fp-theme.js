/* fp-theme.js — FemmasBot: professional Light / Dark / System theme control.
 * Drives the app's OWN theme toggle (single source of truth) so the internal
 * darkMode state, the html.fp-dark class, and fp_dark stay in perfect sync — this
 * prevents the state/class divergence that made the theme look "half switched".
 * A brief crossfade smooths the change; 'System' follows the OS preference live.
 * Replaces the old single sun/moon button with a clean 3-way segmented control. */
(function () {
  var LS_MODE = 'fp_mode', LS_DARK = 'fp_dark';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    /* smooth crossfade — only active during a switch */
    'html.fp-switching, html.fp-switching *{transition:background-color .35s ease,color .3s ease,' +
    'border-color .3s ease,fill .3s ease,stroke .35s ease,box-shadow .3s ease !important}' +
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

  // Drive the app's OWN toggle so its internal darkMode state, the html.fp-dark class,
  // and fp_dark stay perfectly in sync — one source of truth, no divergence/mixing.
  function ensureDark(dark, animate) {
    var html = document.documentElement;
    if (html.classList.contains('fp-dark') === dark) { set(LS_DARK, dark ? '1' : '0'); return; }
    if (animate) {
      html.classList.add('fp-switching');
      clearTimeout(ensureDark._t);
      ensureDark._t = setTimeout(function () { html.classList.remove('fp-switching'); }, 480);
    }
    var b = findThemeBtn();
    if (!b) { html.classList.toggle('fp-dark', dark); set(LS_DARK, dark ? '1' : '0'); return; }
    b.click(); // runs the app's toggleTheme (syncs state + class + fp_dark)
    // the class is updated synchronously; if state was diverged, one more click aligns it.
    if (html.classList.contains('fp-dark') !== dark) b.click();
  }

  var wrap = null;
  function paint(mode) {
    if (!wrap) return;
    [].forEach.call(wrap.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-m') === mode);
    });
  }

  function setMode(mode, animate) {
    set(LS_MODE, mode);
    var dark = mode === 'dark' ? true : mode === 'light' ? false : systemDark();
    ensureDark(dark, animate);
    paint(mode);
  }

  // The app's theme button; its title is translated by i18n, so match both languages.
  function findThemeBtn() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) return btns[i];
    }
    return null;
  }

  function build() {
    if (document.querySelector('.fp-theme')) { paint(get(LS_MODE) || 'system'); return true; }
    var oldBtn = findThemeBtn();
    if (!oldBtn || !oldBtn.parentNode) return false;
    wrap = document.createElement('div');
    wrap.className = 'fp-theme';
    ['light', 'dark', 'system'].forEach(function (m) {
      var b = document.createElement('button');
      b.setAttribute('data-m', m);
      b.title = m.charAt(0).toUpperCase() + m.slice(1);
      b.innerHTML = icon(m);
      b.addEventListener('click', function () { setMode(m, true); });
      wrap.appendChild(b);
    });
    oldBtn.style.display = 'none';
    oldBtn.parentNode.insertBefore(wrap, oldBtn);
    paint(get(LS_MODE) || 'system');
    return true;
  }

  function initMode() {
    var mode = get(LS_MODE);
    if (!mode) {
      mode = get(LS_DARK) === '1' ? 'dark' : (get(LS_DARK) === '0' ? 'light' : 'system');
      set(LS_MODE, mode);
    }
    setMode(mode, false);
    if (mq) {
      var onChange = function () { if (get(LS_MODE) === 'system') setMode('system', true); };
      try { mq.addEventListener('change', onChange); } catch (e) { try { mq.addListener(onChange); } catch (e2) {} }
    }
  }

  function boot() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    initMode();
    build();
    setInterval(build, 1500);
    try { new MutationObserver(function () { build(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
