/* FEMMAS PRINT — lightweight staff image enhancer.
 * Uses local /staff assets only. No Base44 dependency and no polling loop.
 */
(function () {
  'use strict';
  if (window.__fpStaffImages) return;
  window.__fpStaffImages = true;

  var PHOTO = {
    'benoz':'/staff/benoz.png',
    'princesier jelomini benoz':'/staff/benoz.png',
    'dr business':'/staff/dr-business.png',
    'athumani':'/staff/dr-business.png',
    'emanuel':'/staff/emanuel.png',
    'emanuel w. sese':'/staff/emanuel.png',
    'emanuel w. sese (ima)':'/staff/emanuel.png',
    'fadhili':'/staff/fadhili.png',
    'fadhili ally':'/staff/fadhili.png',
    'felician':'/staff/felician.png',
    'felician masanje':'/staff/felician.png',
    'felice masanje':'/staff/felician.png',
    'hassan':'/staff/hassan-official.png',
    'hassan mwesiumo':'/staff/hassan-official.png',
    'hasani':'/staff/hasani.png',
    'henry':'/staff/henry-kwedi.png',
    'henry charles kwedi':'/staff/henry-kwedi.png',
    'ismail':'/staff/ismail-salmu.png',
    'ismail issa':'/staff/ismail-salmu.png',
    'ismar salim hussein (suma)':'/staff/ismo.png',
    'suma':'/staff/suma.png',
    'jamali':'/staff/jamali.png',
    'kwedi':'/staff/kwedi-official.png',
    'magesa':'/staff/magessa.png',
    'mageza':'/staff/magessa.png',
    'omar mrangi':'/staff/omar-mrangi.png',
    'omari':'/staff/omari.png',
    'omary':'/staff/omary.png',
    'shaibu':'/staff/shahibu.png',
    'shaibu frank malekela':'/staff/shahibu.png',
    'sedekia':'/staff/sidekea.png',
    'sedekia johnson laurent':'/staff/sidekea.png',
    'steven':'/staff/steave.png',
    'steven mkope':'/staff/steave.png',
    'victor':'/staff/victor.png',
    'victor mapuga':'/staff/victor.png'
  };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function photoFor(text) {
    var t = norm(text);
    if (PHOTO[t]) return PHOTO[t];
    var keys = Object.keys(PHOTO);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].length >= 5 && t === keys[i]) return PHOTO[keys[i]];
    }
    return null;
  }

  function relevantContext(el) {
    var root = el.closest('main,section,article,[role="dialog"]') || document.body;
    var t = norm(root.textContent).slice(0,5000);
    return /employee|staff|mfanyakazi|payroll|mishahara|expense|matumizi/.test(t);
  }

  function enhance(root) {
    root = root && root.querySelectorAll ? root : document;
    var nodes = root.querySelectorAll('td,li,article,div[class*="card"],div[class*="row"]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.dataset.fpStaffImage === '1' || !relevantContext(el)) continue;
      var text = norm(el.textContent);
      if (!text || text.length > 90) continue;
      var src = photoFor(text);
      if (!src) continue;
      if (el.querySelector('img')) { el.dataset.fpStaffImage = '1'; continue; }

      var img = document.createElement('img');
      img.src = src;
      img.alt = text;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.cssText = 'width:34px;height:34px;border-radius:50%;object-fit:cover;flex:0 0 34px;margin-right:8px;vertical-align:middle;background:#eef4fb;border:1px solid #dbe7f3';
      img.onerror = function () { this.remove(); };
      el.insertBefore(img, el.firstChild);
      el.dataset.fpStaffImage = '1';
    }
  }

  var timer = 0;
  function schedule(root) {
    clearTimeout(timer);
    timer = setTimeout(function () { enhance(root || document); }, 120);
  }

  function boot() {
    enhance(document);
    new MutationObserver(function (mutations) {
      var target = null;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
          target = mutations[i].target;
          break;
        }
      }
      if (target) schedule(document);
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();