(()=>{'use strict';
let coreSeed=null,coreClick=null;
function rememberCoreCard(card){if(!coreClick&&typeof card.onclick==='function'){coreSeed=card;coreClick=card.onclick}}
function openCoreDetail(id){
 if(!coreSeed||!coreClick)return false;
 const old=coreSeed.dataset.id;
 coreSeed.dataset.id=String(id);
 try{coreClick.call(coreSeed);return true}finally{coreSeed.dataset.id=old}
}
function install(){
 const results=document.getElementById('results');if(!results)return;
 const cards=[...results.querySelectorAll('.card')];
 cards.forEach(rememberCoreCard);
 cards.forEach(card=>{
  const id=card.dataset.id;if(!id)return;
  card.onclick=e=>{if(e.target.closest('.browseTick'))return;openCoreDetail(id)};
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
/* Selecting the same PDF/photo twice does not fire a file-input change event in many browsers.
   Clear the picker immediately before the core Attach/replace ticket button opens it. */
document.addEventListener('click',e=>{if(e.target.closest('#attachTicket')){const p=document.getElementById('ticketPicker');if(p)p.value=''}},true);
const mo=new MutationObserver(()=>requestAnimationFrame(install));mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();