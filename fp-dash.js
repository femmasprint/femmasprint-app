/* fp-dash.js — FemmasBot dashboard: interactive sales chart + liveliness.
 * Adds hover crosshair, a tooltip that follows the line (date + value),
 * a moving highlight dot, and a line draw-in entrance animation.
 * Self-contained; re-attaches after the app re-renders the chart. */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var CSS =
    ".fp-tip{position:absolute;transform:translate(-50%,-100%);background:rgba(12,20,38,.97);" +
    "color:#fff;border:1px solid rgba(0,142,206,.55);border-radius:11px;padding:7px 11px;" +
    "font:600 12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none;" +
    "white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.45);transition:opacity .12s,left .05s,top .05s;z-index:60}" +
    ".fp-tip .d{font-size:10.5px;opacity:.72;font-weight:500;letter-spacing:.02em}" +
    ".fp-tip .v{font-size:15px;color:#38bdf8;margin-top:1px}" +
    ".fp-hoverdot{filter:drop-shadow(0 0 7px rgba(0,142,206,.95));transition:opacity .12s}" +
    ".fp-cross{transition:opacity .12s}";

  function injectCss() {
    if (document.getElementById("fpDashCss")) return;
    var s = document.createElement("style");
    s.id = "fpDashCss";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function parseVal(t) {
    t = (t || "").trim().replace(/,/g, "");
    var m = t.match(/([\d.]+)\s*([MK]?)/i);
    if (!m) return null;
    var n = parseFloat(m[1]);
    if (/m/i.test(m[2])) n *= 1e6;
    else if (/k/i.test(m[2])) n *= 1e3;
    return n;
  }

  function findChart() {
    var svgs = document.querySelectorAll("svg");
    for (var i = 0; i < svgs.length; i++) {
      var s = svgs[i];
      var vb = s.getAttribute("viewBox") || "";
      if (vb.indexOf("920") > -1 && vb.indexOf("320") > -1) {
        var r = s.getBoundingClientRect();
        if (r.width > 500) return s;
      }
    }
    return null;
  }

  function enhance() {
    var svg = findChart();
    if (!svg || svg.__fpDash) return;
    svg.__fpDash = true;

    var texts = [].slice.call(svg.querySelectorAll("text"));
    var yLab = [], xLab = [];
    texts.forEach(function (t) {
      var x = parseFloat(t.getAttribute("x")), y = parseFloat(t.getAttribute("y"));
      if (x < 40) { var v = parseVal(t.textContent); if (v !== null) yLab.push({ y: y, v: v }); }
      else if (y > 295) xLab.push({ x: x, t: (t.textContent || "").trim() });
    });
    if (yLab.length < 2 || xLab.length < 2) { svg.__fpDash = false; return; }
    yLab.sort(function (a, b) { return a.y - b.y; });
    xLab.sort(function (a, b) { return a.x - b.x; });
    var yTop = yLab[0].y, vTop = yLab[0].v, yBot = yLab[yLab.length - 1].y, vBot = yLab[yLab.length - 1].v;

    var line = null, paths = svg.querySelectorAll("path");
    for (var i = 0; i < paths.length; i++) {
      if (paths[i].getAttribute("fill") === "none" || paths[i].getAttribute("stroke")) { line = paths[i]; break; }
    }
    if (!line) { svg.__fpDash = false; return; }

    // Entrance: draw the line in — only ONCE per page load, so theme toggles and
    // period changes (which re-render the chart) don't re-animate and feel janky.
    if (!document.__fpChartAnim) {
      document.__fpChartAnim = true;
      try {
        var len = line.getTotalLength();
        line.style.transition = "none";
        line.style.strokeDasharray = len + " " + len;
        line.style.strokeDashoffset = len;
        line.getBoundingClientRect();
        line.style.transition = "stroke-dashoffset 1.15s cubic-bezier(.3,.8,.3,1)";
        line.style.strokeDashoffset = "0";
      } catch (e) {}
    }

    // Crosshair + hover dot.
    var cross = document.createElementNS(NS, "line");
    cross.setAttribute("class", "fp-cross");
    cross.setAttribute("y1", yTop - 6); cross.setAttribute("y2", yBot);
    cross.setAttribute("stroke", "#008ece"); cross.setAttribute("stroke-width", "1");
    cross.setAttribute("stroke-dasharray", "4 4"); cross.setAttribute("opacity", "0");
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", "fp-hoverdot"); dot.setAttribute("r", "6");
    dot.setAttribute("fill", "#008ece"); dot.setAttribute("stroke", "#fff");
    dot.setAttribute("stroke-width", "2"); dot.setAttribute("opacity", "0");
    var overlay = document.createElementNS(NS, "rect");
    overlay.setAttribute("x", xLab[0].x - 16); overlay.setAttribute("y", yTop - 12);
    overlay.setAttribute("width", 920 - (xLab[0].x - 16)); overlay.setAttribute("height", yBot - yTop + 24);
    overlay.setAttribute("fill", "transparent"); overlay.style.cursor = "crosshair";
    svg.appendChild(cross); svg.appendChild(dot); svg.appendChild(overlay);

    var host = svg.parentElement;
    if (host && getComputedStyle(host).position === "static") host.style.position = "relative";
    var tip = document.createElement("div");
    tip.className = "fp-tip"; tip.style.opacity = "0";
    host.appendChild(tip);

    function yAtX(px) {
      var L = line.getTotalLength(), lo = 0, hi = L, best = line.getPointAtLength(0);
      for (var it = 0; it < 20; it++) {
        var mid = (lo + hi) / 2, p = line.getPointAtLength(mid);
        best = p;
        if (p.x < px) lo = mid; else hi = mid;
      }
      return best;
    }
    function dateAt(px) {
      var a = xLab[0], b = xLab[xLab.length - 1];
      for (var i = 0; i < xLab.length - 1; i++) {
        if (px >= xLab[i].x && px <= xLab[i + 1].x) { a = xLab[i]; b = xLab[i + 1]; break; }
      }
      var da = parseInt(a.t, 10), db = parseInt(b.t, 10);
      if (!isNaN(da) && !isNaN(db) && b.x > a.x) {
        var frac = (px - a.x) / (b.x - a.x);
        var day = Math.round(da + (db - da) * frac);
        var month = a.t.replace(/^\d+\s*/, "");
        return day + (month ? " " + month : "");
      }
      return Math.abs(px - a.x) < Math.abs(px - b.x) ? a.t : b.t;
    }
    function toSvgX(clientX) {
      var pt = svg.createSVGPoint(); pt.x = clientX; pt.y = 0;
      var m = svg.getScreenCTM(); if (!m) return null;
      return pt.matrixTransform(m.inverse()).x;
    }
    function fmt(v) { return "Sh " + Math.round(v).toLocaleString(); }

    function move(e) {
      var sx = toSvgX(e.clientX); if (sx === null) return;
      if (sx < xLab[0].x) sx = xLab[0].x; if (sx > 920) sx = 920;
      var p = yAtX(sx);
      var val = vBot + (vTop - vBot) * (yBot - p.y) / (yBot - yTop);
      cross.setAttribute("x1", p.x); cross.setAttribute("x2", p.x); cross.setAttribute("opacity", ".5");
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("opacity", "1");
      tip.innerHTML = '<div class="d">' + dateAt(p.x) + '</div><div class="v">' + fmt(val) + "</div>";
      var r = svg.getBoundingClientRect(), hr = host.getBoundingClientRect();
      var tx = p.x * (r.width / 920) + (r.left - hr.left);
      var ty = p.y * (r.height / 320) + (r.top - hr.top);
      tip.style.left = tx + "px"; tip.style.top = (ty - 12) + "px"; tip.style.opacity = "1";
    }
    function leave() {
      cross.setAttribute("opacity", "0"); dot.setAttribute("opacity", "0"); tip.style.opacity = "0";
    }
    overlay.addEventListener("mousemove", move);
    overlay.addEventListener("mouseleave", leave);
    // Tap support on touch devices.
    overlay.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) { move(e.touches[0]); e.preventDefault(); }
    }, { passive: false });
  }

  // Count-up: animate the big dashboard numbers from 0 once, for a lively feel.
  function countUp() {
    if (document.__fpCounted) return;
    if (!findChart()) return;
    document.__fpCounted = true;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n, targets = [];
    while ((n = w.nextNode())) {
      var s = (n.nodeValue || "").trim();
      if (!/^[\d,]{4,}$/.test(s)) continue;
      var digits = s.replace(/,/g, "");
      if (digits.length < 4 || digits.length > 12) continue;
      var el = n.parentElement; if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.top > 620 || r.width === 0) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 20) continue; // big numbers only
      targets.push({ node: n, val: parseInt(digits, 10) });
    }
    targets.slice(0, 10).forEach(function (t) {
      var start = performance.now(), dur = 950, final = t.val.toLocaleString();
      function step(now) {
        var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
        t.node.nodeValue = Math.round(t.val * e).toLocaleString();
        if (p < 1) requestAnimationFrame(step); else t.node.nodeValue = final;
      }
      requestAnimationFrame(step);
    });
  }

  function boot() { injectCss(); enhance(); countUp(); }
  function start() {
    try { new MutationObserver(function () { enhance(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    boot();
    setInterval(enhance, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
