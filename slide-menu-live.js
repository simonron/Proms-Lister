/* EXCELLENT UI: slide-in menus only. Ticket reading/sync logic untouched. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
    .home-wrap{position:relative}
    .home-wrap>.menu-row{position:absolute!important;left:28px!important;top:calc(env(safe-area-inset-top) + 38px)!important;z-index:95!important;margin:0!important;justify-content:flex-start!important}
    #homeMenuToggle{border:0!important;background:transparent!important;color:white!important;font-size:29px!important;width:44px!important;height:44px!important;padding:0!important;line-height:44px!important;border-radius:8px!important;overflow:hidden!important;text-indent:-9999px!important;position:relative!important}
    #homeMenuToggle::after{content:'☰';position:absolute;inset:0;text-indent:0;color:white;font-size:29px;line-height:44px;text-align:center}
    .concert-menu-row{justify-content:flex-start!important}
    #concertMenuToggle{border:0!important;background:transparent!important;font-size:29px!important;width:44px!important;height:44px!important;padding:0!important;line-height:44px!important;border-radius:8px!important;overflow:hidden!important;text-indent:-9999px!important;position:relative!important}
    #concertMenuToggle::after{content:'☰';position:absolute;inset:0;text-indent:0;color:var(--ink);font-size:29px;line-height:44px;text-align:center}
    .menu-panel{display:block!important;position:fixed!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:min(82vw,320px)!important;min-width:0!important;height:100vh!important;z-index:120!important;background:var(--paper)!important;border:0!important;border-right:1px solid var(--rule)!important;border-radius:0!important;padding:calc(env(safe-area-inset-top) + 70px) 14px 24px!important;box-shadow:8px 0 30px rgba(0,0,0,.28)!important;transform:translateX(-105%)!important;transition:transform .24s ease!important;overflow:auto!important}
    .menu-panel.open{transform:translateX(0)!important}
    .menu-panel button{background:transparent!important;padding:14px 11px!important;font-size:16px!important}
    .menu-panel button:hover,.menu-panel button:focus{background:var(--paper2)!important}
    #slideMenuShade{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:110;opacity:0;visibility:hidden;transition:opacity .22s ease}
    #slideMenuShade.open{opacity:1;visibility:visible}
    @media(max-width:620px){.home-wrap>.menu-row{left:24px!important}}
  `;
  document.head.appendChild(css);
  const shade=document.createElement('div'); shade.id='slideMenuShade'; document.body.appendChild(shade);
  function closeMenus(){document.querySelectorAll('.menu-panel.open').forEach(p=>p.classList.remove('open'));document.querySelectorAll('.menu-toggle').forEach(b=>b.setAttribute('aria-expanded','false'));shade.classList.remove('open');document.body.style.overflow='';}
  function syncShade(){const open=!!document.querySelector('.menu-panel.open');shade.classList.toggle('open',open);document.body.style.overflow=open?'hidden':'';}
  shade.addEventListener('click',closeMenus);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
  document.addEventListener('click',()=>setTimeout(syncShade,0),true);
  const obs=new MutationObserver(syncShade);obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
})();
