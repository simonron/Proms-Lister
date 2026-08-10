/* Live slide-in menu UI. Presentation only; existing menu actions remain wired to their original buttons. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
  .home-hero{position:relative}
  #homeMenuToggle{position:absolute!important;left:12px!important;top:12px!important;z-index:86;width:44px;height:44px;padding:0!important;border:0!important;background:rgba(255,255,255,.14)!important;color:white!important;border-radius:9px!important;font-size:29px!important;line-height:44px!important;text-align:center!important}
  #homePage>.home-wrap>.menu-row{position:static!important;height:0!important;margin:0!important}
  #homePage>.home-wrap>.menu-row .menu-wrap{position:static!important}
  .concert-menu-row{justify-content:flex-start!important}
  #concertMenuToggle{width:44px;height:44px;padding:0!important;border:0!important;background:transparent!important;border-radius:9px!important;font-size:29px!important;line-height:44px!important;text-align:center!important}
  .pl-drawer-shade{position:fixed;inset:0;background:rgba(0,0,0,.38);opacity:0;visibility:hidden;transition:opacity .22s ease;z-index:998}
  .pl-drawer-shade.open{opacity:1;visibility:visible}
  .pl-drawer{position:fixed;left:0;top:0;bottom:0;width:min(82vw,320px);background:var(--paper);border-right:1px solid var(--rule);box-shadow:8px 0 30px rgba(0,0,0,.25);transform:translateX(-105%);transition:transform .24s ease;z-index:999;padding:calc(env(safe-area-inset-top) + 18px) 14px 24px;overflow:auto}
  .pl-drawer.open{transform:translateX(0)}
  .pl-drawer-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--rule);padding:0 4px 12px;margin-bottom:8px}
  .pl-drawer-head strong{font:700 23px Iowan Old Style,Georgia,serif;color:var(--deep)}
  .pl-drawer-close{width:38px;height:38px;border:0;background:transparent;font-size:26px;border-radius:50%}
  .pl-drawer-action{display:block;width:100%;border:0;background:transparent;text-align:left;padding:14px 11px;border-radius:9px;font-weight:750;color:var(--ink)}
  .pl-drawer-action:hover,.pl-drawer-action:focus{background:var(--paper2)}
  `;
  document.head.appendChild(css);

  const shade=document.createElement('div'); shade.className='pl-drawer-shade'; document.body.appendChild(shade);
  const drawer=document.createElement('aside'); drawer.className='pl-drawer'; drawer.innerHTML='<div class="pl-drawer-head"><strong id="plDrawerTitle">Menu</strong><button type="button" class="pl-drawer-close" aria-label="Close">×</button></div><div id="plDrawerItems"></div>'; document.body.appendChild(drawer);
  const items=drawer.querySelector('#plDrawerItems'), title=drawer.querySelector('#plDrawerTitle');
  function close(){drawer.classList.remove('open');shade.classList.remove('open');document.body.style.overflow=''}
  function openFrom(panel,label){
    if(!panel)return;
    title.textContent=label||'Menu'; items.innerHTML='';
    panel.querySelectorAll('button').forEach(src=>{const b=document.createElement('button');b.type='button';b.className='pl-drawer-action';b.innerHTML=src.innerHTML;b.addEventListener('click',()=>{close();src.click()});items.appendChild(b)});
    drawer.classList.add('open');shade.classList.add('open');document.body.style.overflow='hidden';
  }
  shade.addEventListener('click',close);drawer.querySelector('.pl-drawer-close').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  function wire(toggleId,panelId,label){const t=document.getElementById(toggleId),p=document.getElementById(panelId);if(!t||!p||t.dataset.drawerWired)return;t.dataset.drawerWired='1';t.textContent='☰';t.setAttribute('aria-label','Menu');t.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openFrom(p,label)},true)}
  function wireAll(){wire('homeMenuToggle','homeMenuPanel','Menu');wire('concertMenuToggle','concertMenuPanel','Concert')}
  wireAll();
  new MutationObserver(wireAll).observe(document.body,{childList:true,subtree:true});
})();
