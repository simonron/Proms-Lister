(()=>{'use strict';
const BUILD='Version 3.0.4';
function install(){
 const v=document.querySelector('.hero .version');if(v&&v.textContent!==BUILD)v.textContent=BUILD;
 const results=document.getElementById('results');if(!results)return;
 results.querySelectorAll('.card').forEach(card=>{
  if(card.querySelector('.browseTick'))return;
  const id=card.dataset.id;if(!id)return;
  let all={};try{all=JSON.parse(localStorage.getItem('promsTicketsV2')||'{}')}catch{}
  const r=all[id]||{};
  const label=document.createElement('label');label.className='browseTick';label.style.cssText='position:absolute;right:12px;bottom:10px;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;z-index:5;background:#fffdf8dd;padding:4px 7px;border-radius:8px';
  const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!r.myProm;cb.setAttribute('aria-label','Select this Prom');cb.style.cssText='width:20px;height:20px;margin:0';
  const text=document.createElement('span');text.textContent='My Prom';
  label.append(cb,text);card.appendChild(label);
  const stop=e=>e.stopPropagation();label.addEventListener('click',stop);label.addEventListener('pointerup',stop);
  cb.addEventListener('change',e=>{e.stopPropagation();let d={};try{d=JSON.parse(localStorage.getItem('promsTicketsV2')||'{}')}catch{};d[id]=Object.assign({},d[id]||{},{myProm:cb.checked});localStorage.setItem('promsTicketsV2',JSON.stringify(d));card.classList.toggle('my',cb.checked);let s=card.querySelector('.stickers');if(s){let tag=s.querySelector('.sticker.my');if(cb.checked&&!tag){tag=document.createElement('span');tag.className='sticker my';tag.textContent='My Prom';s.prepend(tag)}else if(!cb.checked&&tag)tag.remove()}});
 });
}
const mo=new MutationObserver(()=>requestAnimationFrame(install));mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();