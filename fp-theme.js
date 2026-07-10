/* fp-theme.js — FemmasBot: professional Light / Dark / System theme control.
 * Replaces the single sun/moon button with a clean 3-way segmented control
 * (Light / Dark / System) and drives the app's OWN theme toggle so its internal
 * darkMode state AND the html.fp-dark class update together — the settled theme
 * is always uniform (no permanent "half-dark").
 *
 * THE TRANSITION PROBLEM (seen in the user's screen recording): the app repaints
 * its heavy widget cards a beat AFTER the page background flips, so for a short
 * window you get a dark page with still-white cards (or the reverse) — the
 * "kupandiana-pandiana" / white flash. Chasing every inline card colour with CSS
 * is fragile. Instead we drop a full-screen CURTAIN in the *target* colour over
 * the whole switch, hold it until the repaint has actually settled (adaptive —
 * works on fast and slow machines), then fade it out. The mixing happens under
 * the curtain and is never seen. 'System' follows the OS live. */
(function () {
  var LS_MODE = 'fp_mode', LS_DARK = 'fp_dark';
  var DARK_BG = '#0a0e1a', LIGHT_BG = '#f4f6fb';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var CSS =
    /* Pin the page root to the dark colour the instant fp-dark is present, so the
       backdrop can never flash white during the repaint. */
    'html.fp-dark,html.fp-dark body{background:#0a0e1a !important}' +
    /* the switch curtain */
    '.fp-curtain{position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:0;' +
    'transition:opacity .13s ease}' +
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

  // The app's theme button; its title is translated by i18n, so match both languages.
  function findThemeBtn() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].title || '').toLowerCase();
      if (/light\s*\/\s*dark|mwanga\s*\/\s*giza/.test(t)) return btns[i];
    }
    return null;
  }

  // Flip the app's own darkMode state (+ class) so the SETTLED theme is uniform.
  function flip(dark) {
    var html = document.documentElement;
    set(LS_DARK, dark ? '1' : '0');
    if (html.classList.contains('fp-dark') === dark) return;
    var b = findThemeBtn();
    if (!b) { html.classList.toggle('fp-dark', dark); return; }
    b.click();
    if (html.classList.contains('fp-dark') !== dark) b.click(); // align if state diverged
  }

  // Is a point still showing a bright/white surface? Walk up a few ancestors to the
  // first element with a real (non-transparent) background and test its brightness.
  function brightAt(x, y) {
    var el = document.elementFromPoint(x, y); // curtain is pointer-events:none, so this sees THROUGH it
    for (var d = 0; el && d < 4; d++, el = el.parentElement) {
      var m = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (!m) continue;
      var a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a < 0.4) continue; // transparent layer — keep climbing
      return (+m[1] + +m[2] + +m[3]) > 620; // first solid surface decides
    }
    return false;
  }

  // Cheap settle check: sample a handful of viewport points where the laggy cards
  // live (right column, the two top cards, mid). In dark mode we're "settled" once
  // none of them is still bright. Only ~5 elementFromPoint probes — fast, so the
  // cap below is honoured and the curtain lifts the instant the repaint finishes.
  function settled(dark) {
    if (!dark) return true; // light target: nothing jarring to wait for
    var W = innerWidth, H = innerHeight;
    var pts = [[0.88, 0.35], [0.88, 0.60], [0.30, 0.31], [0.62, 0.31], [0.46, 0.70]];
    for (var i = 0; i < pts.length; i++) {
      if (brightAt(pts[i][0] * W, pts[i][1] * H)) return false;
    }
    return true;
  }

  var switching = false;
  // Cover the whole switch with a target-coloured curtain; lift it only once the
  // repaint has settled (adaptive, capped) so mixing is never visible.
  function switchTo(dark) {
    if (switching) return;
    switching = true;
    var c = document.createElement('div');
    c.className = 'fp-curtain';
    c.style.background = dark ? DARK_BG : LIGHT_BG;
    document.body.appendChild(c);
    c.getBoundingClientRect();
    c.style.opacity = '1';                 // fade the curtain IN (~130ms) over old theme
    setTimeout(function () {
      flip(dark);                          // switch underneath, hidden
      var t0 = performance.now();
      (function waitSettle() {
        if (settled(dark) || performance.now() - t0 > 1100) {
          // one extra frame so the last cards are painted, then fade out
          setTimeout(function () {
            c.style.transition = 'opacity .34s ease';
            c.style.opacity = '0';
            setTimeout(function () {
              if (c.parentNode) c.parentNode.removeChild(c);
              switching = false;
            }, 380);
          }, 40);
        } else {
          requestAnimationFrame(waitSettle);
        }
      })();
    }, 120);
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
    if (dark === isDark) { set(LS_DARK, dark ? '1' : '0'); return; } // already there
    if (booted) switchTo(dark);            // user switch → curtained crossfade
    else flip(dark);                       // initial load → just align, no curtain
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

  function boot() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    initMode();
    build();
    /* only start curtaining AFTER load has settled, so opening the app never flashes a curtain */
    setTimeout(function () { booted = true; }, 1200);
    /* rebuild on a light interval only — NO body-wide MutationObserver (that fired on
       every DOM change during the app's renders and helped storm/freeze the tab). */
    setInterval(build, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
