/* FEMMAS BASE44 EXACT UI BRIDGE
 * Presentation-only migration from femmasprint/femmasbase into the real production app.
 * Keeps production data/auth/routes/handlers intact. Light mode only.
 */
(function () {
  "use strict";

  var STYLE_ID="fp-base44-exact-css";
  var CSS=[
    ":root{",
      "--b44-bg:#F6F8FA;",
      "--b44-fg:#15233B;",
      "--b44-card:#FFFFFF;",
      "--b44-muted:#66758A;",
      "--b44-border:#DEE5EC;",
      "--b44-primary:#338FE0;",
      "--b44-accent:#3B568F;",
      "--b44-sidebar:#1D3560;",
      "--b44-sidebar-fg:#AAB8CB;",
      "--b44-sidebar-border:#2D4D7A;",
      "--b44-sidebar-active:#2F9EEA;",
      "--b44-green:#25D366;",
      "--b44-radius:10px;",
      "--b44-shadow:0 4px 14px rgba(15,23,42,.08);",
    "}",
    "html,body{color-scheme:light!important;background:var(--b44-bg)!important;color:var(--b44-fg)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;}",
    "html.fp-dark{background:var(--b44-bg)!important;color:var(--b44-fg)!important;}",
    "html.fp-dark body{background:var(--b44-bg)!important;color:var(--b44-fg)!important;}",
    ".fp-theme,.fp-skin-theme,[data-theme-toggle],button[title*='Light / Dark'],button[title*='Mwanga / Giza']{display:none!important;}",
    ".fp-legacy-chrome,.fp-legacy-tabs,[data-topbanner='1']{display:none!important;}",

    "body>div[style*='min-height:100vh'],#fp-main{background:var(--b44-bg)!important;color:var(--b44-fg)!important;}",
    "#fp-main{min-width:0!important;overflow-x:hidden!important;}",

    "aside.fp-v3-sidebar,body aside{width:224px!important;background:var(--b44-sidebar)!important;color:var(--b44-sidebar-fg)!important;border-right:1px solid var(--b44-sidebar-border)!important;box-shadow:none!important;}",
    "body aside nav{padding:8px!important;}",
    "body aside nav a,body aside nav button{min-height:34px!important;border-radius:7px!important;color:var(--b44-sidebar-fg)!important;font-size:12px!important;font-weight:600!important;box-shadow:none!important;transform:none!important;}",
    "body aside nav a:hover,body aside nav button:hover{background:rgba(255,255,255,.055)!important;color:#fff!important;transform:none!important;}",
    "body aside nav a svg,body aside nav button svg{width:15px!important;height:15px!important;color:#7E91AA!important;stroke:currentColor!important;}",
    "body aside nav a:hover svg,body aside nav button:hover svg{color:#fff!important;}",
    "body aside .fp-v3-active,body aside [aria-current='page']{background:rgba(51,158,234,.16)!important;color:#52AEF0!important;border-left:2px solid #3BA3E8!important;box-shadow:none!important;}",
    "body aside .fp-v3-active svg,body aside [aria-current='page'] svg{color:#3BA3E8!important;}",
    "body aside img[src*='femmas-logo']{display:block!important;max-width:170px!important;max-height:48px!important;object-fit:contain!important;}",

    "#fp-main>.fp-v3-topbar,#fp-main>header{position:sticky!important;top:0!important;z-index:40!important;min-height:56px!important;height:auto!important;padding:7px 14px!important;background:#fff!important;color:var(--b44-fg)!important;border:0!important;border-bottom:1px solid var(--b44-border)!important;box-shadow:none!important;gap:8px!important;overflow:visible!important;}",
    "#fp-main>.fp-v3-topbar *,#fp-main>header *{line-height:1.25!important;}",
    "#fp-main>.fp-v3-topbar input,#fp-main>header input{height:36px!important;background:#F7F9FB!important;color:var(--b44-fg)!important;border:1px solid var(--b44-border)!important;border-radius:8px!important;box-shadow:none!important;}",
    "#fp-main>.fp-v3-topbar button,#fp-main>header button,#fp-main>.fp-v3-topbar a,#fp-main>header a{min-height:34px!important;border-radius:8px!important;box-shadow:none!important;}",

    "#fp-main main,#fp-main>[data-screen-label],#fp-main>.fp-content{background:var(--b44-bg)!important;}",
    "#fp-main :is(section,article,form,[role='dialog']):not(.fp-printable):not(#fpSheet){border-color:var(--b44-border)!important;}",
    "#fp-main [data-widget-col],#fp-main .fp-v3-card,#fp-main .fp-base44-card{background:#fff!important;color:var(--b44-fg)!important;border:1px solid var(--b44-border)!important;border-radius:12px!important;box-shadow:var(--b44-shadow)!important;}",

    "#fp-main :is(input:not([type='checkbox']):not([type='radio']),select,textarea){background:#fff!important;color:var(--b44-fg)!important;border:1px solid var(--b44-border)!important;border-radius:8px!important;box-shadow:none!important;}",
    "#fp-main :is(input,select,textarea):focus{border-color:var(--b44-primary)!important;outline:none!important;box-shadow:0 0 0 3px rgba(51,143,224,.12)!important;}",
    "#fp-main :is(input,textarea)::placeholder{color:#8A99AC!important;}",

    "#fp-main button:not(.fpPrint):not(.fpShare),#fp-main [role='button']{border-radius:8px!important;box-shadow:none!important;transition:background .14s ease,border-color .14s ease,color .14s ease,transform .12s ease!important;}",
    "#fp-main button:active,#fp-main [role='button']:active{transform:translateY(1px)!important;}",
    "#fp-main .fp-v3-primary,#fp-main button[data-primary='1']{background:var(--b44-primary)!important;color:#fff!important;border-color:var(--b44-primary)!important;box-shadow:none!important;}",

    "#fp-main table:not(.fp-printable table),#fpSkin #fpTableWrap table{width:100%!important;background:#fff!important;color:var(--b44-fg)!important;border-collapse:separate!important;border-spacing:0!important;border:1px solid var(--b44-border)!important;border-radius:10px!important;box-shadow:none!important;overflow:hidden!important;}",
    "#fp-main th,#fpSkin #fpTableWrap th{background:#F3F6F9!important;color:#42536A!important;border-color:var(--b44-border)!important;font-size:11px!important;font-weight:700!important;}",
    "#fp-main td,#fpSkin #fpTableWrap td{background:#fff!important;color:var(--b44-fg)!important;border-color:#E8EDF2!important;}",
    "#fp-main tr:hover td,#fpSkin #fpTableWrap tr:hover td{background:#F7FAFD!important;}",

    "#fpSkin{background:var(--b44-bg)!important;color:var(--b44-fg)!important;}",
    "#fpSkin>div:first-child{background:#fff!important;color:var(--b44-fg)!important;border-bottom:1px solid var(--b44-border)!important;box-shadow:none!important;}",
    "#fpSkin>div:first-child .fpAdd,#fpSkin>div:first-child .fpAddP{background:var(--b44-primary)!important;color:#fff!important;border-color:var(--b44-primary)!important;box-shadow:none!important;}",
    "#fpSkin .fpPrintList,#fpSkin .fpTopMenu{color:var(--b44-accent)!important;}",

    ".fp-lang-switch,.fp-skin-lang{height:34px!important;min-width:50px!important;padding:0 9px!important;background:#F7FBFF!important;color:var(--b44-accent)!important;border:1px solid #CFE0EF!important;border-radius:8px!important;box-shadow:none!important;}",

    "#fp-main svg{shape-rendering:geometricPrecision;}",
    "#fp-main .fp-v3-bar{filter:none!important;animation-duration:.38s!important;}",
    "#fp-main .fp-tip{border-radius:8px!important;box-shadow:0 10px 30px rgba(15,23,42,.18)!important;}",

    ".fp-printable,#fpSheet,#fpPrintArea,#fpPrintArea *{color-scheme:light!important;}",
    "#fpSheet,#fpPrintArea,#fp-main .fp-printable{background:#fff!important;color:#111827!important;box-shadow:none!important;}",

    "@media(max-width:1023px){",
      "body aside{width:224px!important;max-width:82vw!important;}",
      "#fp-main>.fp-v3-topbar,#fp-main>header{padding:7px 10px!important;min-height:54px!important;}",
      "#fp-main table{max-width:none!important;}",
    "}",
    "@media(max-width:640px){",
      "#fp-main>.fp-v3-topbar,#fp-main>header{gap:6px!important;}",
      "#fp-main [data-widget-col],#fp-main .fp-v3-card{border-radius:10px!important;}",
    "}",
    "@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important;}}"
  ].join("");

  function inject(){
    if(document.getElementById(STYLE_ID)) return;
    var st=document.createElement("style");
    st.id=STYLE_ID;
    st.textContent=CSS;
    document.head.appendChild(st);
  }

  function norm(s){return String(s||"").replace(/\s+/g," ").trim();}

  function removeLegacyChrome(){
    if(!document.body) return;
    var nodes=document.body.querySelectorAll("div,header,nav,section");
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      if(el.id==="fp-main" || (el.closest && el.closest("#fp-main"))) continue;
      var t=norm(el.textContent);
      if(!t || t.length>220) continue;
      var menu=/Company\s+Help\s+Versions\s+Shortcuts/i.test(t);
      var support=/WhatsApp\s+Chat\s+Support/i.test(t) && /255\s*658\s*843\s*344/.test(t);
      var tab=/^Sale\s*[×x]?$/i.test(t);
      if(menu||support||tab){
        var r=el.getBoundingClientRect();
        if(r.top<160 && r.height<100){
          el.classList.add(tab?"fp-legacy-tabs":"fp-legacy-chrome");
          el.style.setProperty("display","none","important");
        }
      }
    }
  }

  function mark(){
    document.documentElement.classList.remove("fp-dark");
    try{localStorage.setItem("fp_mode","light");localStorage.setItem("fp_dark","0");}catch(e){}

    var aside=document.querySelector("aside");
    if(aside) aside.classList.add("fp-v3-sidebar");

    var main=document.getElementById("fp-main");
    if(main){
      var headers=main.querySelectorAll(":scope > header");
      for(var h=0;h<headers.length;h++) headers[h].classList.add("fp-v3-topbar");

      var cards=main.querySelectorAll("[data-widget-col],section[style*='border-radius'],article[style*='border-radius'],div[style*='box-shadow']");
      for(var c=0;c<cards.length;c++){
        var el=cards[c];
        if(el.closest && (el.closest(".fp-printable")||el.closest("#fpSheet")||el.closest("#fpPrintArea"))) continue;
        var r=el.getBoundingClientRect();
        if(r.width>180 && r.height>54 && r.height<900) el.classList.add("fp-base44-card");
      }
    }

    var toggles=document.querySelectorAll(".fp-theme,.fp-skin-theme,button[title*='Light / Dark'],button[title*='Mwanga / Giza']");
    for(var j=0;j<toggles.length;j++) toggles[j].style.setProperty("display","none","important");

    removeLegacyChrome();
  }

  var pending=false;
  function schedule(){
    if(pending) return;
    pending=true;
    requestAnimationFrame(function(){pending=false;mark();});
  }

  function boot(){
    inject();
    mark();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("hashchange",schedule);
    window.addEventListener("popstate",schedule);
    setInterval(mark,1600);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
