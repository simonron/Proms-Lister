(()=>{'use strict';
const coreHandlers=new Map();
function install(){
 const results=document.getElementById('results');if(!results)return;
 results.querySelectorAll('.card').forEach(card=>{
  const id=card.dataset.id;if(!id)return;
  /* Core app binds onclick when a list is first rendered. Keep that exact handler by concert id.
     Filter/date redraws replace the DOM cards without re-running core bind(), so new cards use the
     preserved core handler instead of a second detail/ticket implementation. */
  if(typeof card.onclick==='function'&&!card.dataset.coreRestored)coreHandlers.set(id,card.onclick);
  if(typeof card.onclick!=='function'&&coreHandlers.has(id)){
    card.onclick=coreHandlers.get(id);
    card.dataset.coreRestored='1';
  }
  if(card.querySelector('.browseTick'))return;
  let all={};try{all=JSON.parse(localStorage.getItem('promsTicketsV2')||'{}')}catch{}
  const r=all[id]||{};
  const label=document.createElement('label');label.className='browseTick';label.style.cssText='position:absolute;right:12px;bottom:10px;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;z-index:5;background:#fffdf8dd;padding:4px 7px;border-radius:8px';
  const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!r.myProm;cb.setAttribute('aria-label','Select this Prom');cb.style.cssText='width:20px;height:20px;margin:0';
  const text=document.createElement('span');text.textContent='My Prom';label.append(cb,text);card.appendChild(label);
  const stop=e=>e.stopPropagation();label.addEventListener('click',stop);label.addEventListener('pointerup',stop);
  cb.addEventListener('change',e=>{e.stopPropagation();let d={};try{d=JSON.parse(localStorage.getItem('promsTicketsV2')||'{}')}catch{};d[id]=Object.assign({},d[id]||{},{myProm:cb.checked});localStorage.setItem('promsTicketsV2',JSON.stringify(d));card.classList.toggle('my',cb.checked);let s=card.querySelector('.stickers');if(s){let tag=s.querySelector('.sticker.my');if(cb.checked&&!tag){tag=document.createElement('span');tag.className='sticker my';tag.textContent='My Prom';s.prepend(tag)}else if(!cb.checked&&tag)tag.remove()}});
 });
}
const mo=new MutationObserver(()=>requestAnimationFrame(install));mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();