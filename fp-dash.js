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
    boot();
    /* interval only — NO body-wide MutationObserver. That observer fired on every app
       re-render and, on a theme switch, cascaded with the other scripts into a storm
       that froze the tab. A light interval re-attaches the chart just as well. */
    setInterval(enhance, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();


/* FEMMAS APP V3 REAL-DATA BARS
 * Converts the existing sales line into rounded interactive bars without changing
 * its source, period controls, values or tooltip calculations.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "fp-v3-real-bars-css";
  var css = [
    ".fp-v3-bars{pointer-events:none;}",
    ".fp-v3-bar-track{fill:rgba(19,49,90,.075);}",
    ".fp-v3-bar{fill:#13315A;filter:drop-shadow(0 7px 8px rgba(19,49,90,.13));transform-box:fill-box;transform-origin:center bottom;animation:fpV3BarRise .72s cubic-bezier(.2,.78,.28,1) both;}",
    ".fp-v3-bar.fp-v3-bar-selected{fill:#3399FF;filter:drop-shadow(0 9px 11px rgba(51,153,255,.28));}",
    ".fp-v3-chart-line{opacity:.075!important;}",
    ".fp-cross{stroke:#3399FF!important;stroke-dasharray:3 4!important;}",
    ".fp-hoverdot{fill:#3399FF!important;filter:drop-shadow(0 0 7px rgba(51,153,255,.95))!important;}",
    ".fp-tip{border-color:rgba(51,153,255,.65)!important;background:rgba(10,26,47,.97)!important;}",
    ".fp-tip .v{color:#72BDFF!important;}",
    "html.fp-dark .fp-v3-bar-track{fill:rgba(220,234,255,.085);}",
    "html.fp-dark .fp-v3-bar{fill:#6EAFF0;filter:drop-shadow(0 8px 10px rgba(0,5,14,.34));}",
    "html.fp-dark .fp-v3-bar.fp-v3-bar-selected{fill:#3399FF;filter:drop-shadow(0 9px 12px rgba(51,153,255,.34));}",
    "@keyframes fpV3BarRise{from{transform:scaleY(.025);opacity:.2}to{transform:scaleY(1);opacity:1}}",
    "@media(prefers-reduced-motion:reduce){.fp-v3-bar{animation:none!important;}}"
  ].join("");

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function findChart() {
    var svgs = document.querySelectorAll("#fp-main svg");
    for (var i = 0; i < svgs.length; i++) {
      var viewBox = svgs[i].getAttribute("viewBox") || "";
      if (viewBox.indexOf("920") > -1 && viewBox.indexOf("320") > -1) return svgs[i];
    }
    return null;
  }

  function readAxes(svg) {
    var labels = svg.querySelectorAll("text");
    var x = [], y = [];
    for (var i = 0; i < labels.length; i++) {
      var px = parseFloat(labels[i].getAttribute("x"));
      var py = parseFloat(labels[i].getAttribute("y"));
      if (!isFinite(px) || !isFinite(py)) continue;
      if (px < 40) y.push({ y: py, label: (labels[i].textContent || "").trim() });
      else if (py > 295) x.push({ x: px, label: (labels[i].textContent || "").trim() });
    }
    x.sort(function (a, b) { return a.x - b.x; });
    y.sort(function (a, b) { return a.y - b.y; });
    return { x: x, y: y };
  }

  function findDataLine(svg, axes) {
    var paths = svg.querySelectorAll("path");
    var best = null, bestScore = -1;
    var minWidth = axes.x.length > 1 ? (axes.x[axes.x.length - 1].x - axes.x[0].x) * .65 : 300;
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      try {
        var box = path.getBBox();
        var length = path.getTotalLength();
        var stroke = path.getAttribute("stroke");
        var fill = path.getAttribute("fill");
        if (box.width < minWidth || box.height < 4 || length < minWidth) continue;
        if (!stroke && fill && fill !== "none") continue;
        var score = box.width + box.height * 2 + Math.min(length, 1800) * .05;
        if (score > bestScore) { best = path; bestScore = score; }
      } catch (e) {}
    }
    return best;
  }

  function pointAtX(path, targetX) {
    var total = path.getTotalLength();
    var low = 0, high = total, point = path.getPointAtLength(0);
    for (var i = 0; i < 22; i++) {
      var mid = (low + high) / 2;
      point = path.getPointAtLength(mid);
      if (point.x < targetX) low = mid;
      else high = mid;
    }
    var a = path.getPointAtLength(low);
    var b = path.getPointAtLength(high);
    return Math.abs(a.x - targetX) < Math.abs(b.x - targetX) ? a : b;
  }

  function makeRect(className, x, y, width, height, delay) {
    var rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", className);
    rect.setAttribute("x", x.toFixed(2));
    rect.setAttribute("y", y.toFixed(2));
    rect.setAttribute("width", width.toFixed(2));
    rect.setAttribute("height", Math.max(0, height).toFixed(2));
    rect.setAttribute("rx", Math.min(12, width / 2).toFixed(2));
    if (delay) rect.style.animationDelay = delay + "ms";
    return rect;
  }

  function decorate() {
    addStyles();
    var svg = findChart();
    if (!svg) return;
    if (svg.__fpBarsV3 && svg.querySelector(".fp-v3-bars")) return;

    var old = svg.querySelector(".fp-v3-bars");
    if (old) old.remove();

    var axes = readAxes(svg);
    if (axes.x.length < 2 || axes.y.length < 2) return;
    var line = findDataLine(svg, axes);
    if (!line) return;

    var yTop = axes.y[0].y;
    var yBottom = axes.y[axes.y.length - 1].y;
    if (!isFinite(yTop) || !isFinite(yBottom) || yBottom <= yTop) return;

    var gaps = [];
    for (var g = 1; g < axes.x.length; g++) gaps.push(axes.x[g].x - axes.x[g - 1].x);
    gaps.sort(function (a, b) { return a - b; });
    var medianGap = gaps[Math.floor(gaps.length / 2)] || 70;
    var width = Math.max(18, Math.min(44, medianGap * .54));

    var group = document.createElementNS(NS, "g");
    group.setAttribute("class", "fp-v3-bars");
    group.setAttribute("aria-hidden", "true");

    var points = [];
    for (var i = 0; i < axes.x.length; i++) {
      try {
        var point = pointAtX(line, axes.x[i].x);
        var py = Math.max(yTop, Math.min(yBottom, point.y));
        points.push({ x: axes.x[i].x, y: py });
      } catch (e) {
        points.push({ x: axes.x[i].x, y: yBottom });
      }
    }

    var selectedIndex = -1;
    for (var s = points.length - 1; s >= 0; s--) {
      if (yBottom - points[s].y > 3) { selectedIndex = s; break; }
    }
    if (selectedIndex < 0) selectedIndex = Math.floor(points.length / 2);

    for (var b = 0; b < points.length; b++) {
      var left = points[b].x - width / 2;
      group.appendChild(makeRect("fp-v3-bar-track", left, yTop, width, yBottom - yTop, 0));
      var fillHeight = Math.max(3, yBottom - points[b].y);
      var classes = "fp-v3-bar" + (b === selectedIndex ? " fp-v3-bar-selected" : "");
      group.appendChild(makeRect(classes, left, yBottom - fillHeight, width, fillHeight, b * 54));
    }

    var firstInteractive = svg.querySelector(".fp-cross,.fp-hoverdot,rect[fill='transparent']");
    if (firstInteractive) svg.insertBefore(group, firstInteractive);
    else svg.appendChild(group);

    line.classList.add("fp-v3-chart-line");
    svg.__fpBarsV3 = true;

    var overlay = svg.querySelector("rect[fill='transparent']");
    if (overlay && !overlay.__fpBarHover) {
      overlay.__fpBarHover = true;
      overlay.addEventListener("mousemove", function (event) {
        var pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        var local = pt.matrixTransform(svg.getScreenCTM().inverse());
        var nearest = 0, distance = Infinity;
        for (var j = 0; j < points.length; j++) {
          var d = Math.abs(points[j].x - local.x);
          if (d < distance) { distance = d; nearest = j; }
        }
        var bars = group.querySelectorAll(".fp-v3-bar");
        for (var k = 0; k < bars.length; k++) bars[k].classList.toggle("fp-v3-bar-selected", k === nearest);
      });
      overlay.addEventListener("mouseleave", function () {
        var bars = group.querySelectorAll(".fp-v3-bar");
        for (var k = 0; k < bars.length; k++) bars[k].classList.toggle("fp-v3-bar-selected", k === selectedIndex);
      });
    }
  }

  function boot() {
    decorate();
    var main = document.getElementById("fp-main");
    if (main) {
      new MutationObserver(function () { requestAnimationFrame(decorate); })
        .observe(main, { childList: true, subtree: true });
    }
    setInterval(decorate, 1300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
