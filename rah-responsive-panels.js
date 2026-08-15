/* Bottom-docked, editable controls for the RAH seating map. Proms Lister Vr4.3.0. */
(function(){'use strict';
const VERSION='Vr4.3.0';
let ticket={};

function addVersion(){
 const season=document.querySelector('.home-hero .season');
 if(!season||document.getElementById('promsVersion'))return;
 const v=document.createElement('div');v.id='promsVersion';v.textContent=VERSION;
 v.style.cssText='margin-top:5px;color:#efd8bb;font-size:11px;font-weight:800;letter-spacing:.7px;text-align:center';
 season.insertAdjacentElement('afterend',v);
}
function capture(t){if(t&&typeof t==='object')ticket=t;return ticket}
function saveTicket(){
 try{
  if(typeof selected!=='undefined'&&selected&&typeof keyFor==='function'){
   const all=JSON.parse(localStorage.getItem('promsTicketsV2')||'{}'),k=keyFor(selected);
   all[k]=Object.assign({},all[k]||{},ticket);
   localStorage.setItem('promsTicketsV2',JSON.stringify(all));
  }
 }catch(e){console.warn('RAH seat edit save failed',e)}
}
function value(id){const e=document.getElementById(id);return e?e.value.trim():''}
function fieldsToTicket(){
 ticket.door=value('rahEditDoor');
 ticket.section=value('rahEditSection');
 ticket.area=ticket.section;
 const r=value('rahEditRow'),s=value('rahEditSeat');
 ticket.row=r?parseInt(r,10):'';ticket.seat=s?parseInt(s,10):'';
 saveTicket();
}
function field(id,label,val,numeric){
 const w=document.createElement('label');w.style.cssText='display:flex;align-items:center;gap:4px;white-space:nowrap;font-size:12px;font-weight:800';
 const t=document.createElement('span');t.textContent=label;
 const i=document.createElement('input');i.id=id;i.value=val==null?'':String(val);i.placeholder=label;
 i.type='text';if(numeric){i.inputMode='numeric';i.pattern='[0-9]*'}
 i.style.cssText='width:'+(label==='Section'?'112px':'64px')+';min-width:0;padding:6px 7px;border:1px solid #aaa;border-radius:7px;background:white;color:#111';
 i.addEventListener('input',()=>{if(numeric)i.value=i.value.replace(/[^0-9]/g,'');fieldsToTicket()});
 i.addEventListener('change',()=>{fieldsToTicket();try{if(window.RAHSeatMap)window.RAHSeatMap.setTicket(ticket)}catch(_){}});
 w.append(t,i);return w;
}
function editPopup(){
 const p=document.getElementById('rahSeatDetailsPopup');if(!p)return;
 if(p.dataset.editTicketKey===String(ticket&&ticket.door)+'|'+String(ticket&&ticket.section||ticket&&ticket.area)+'|'+String(ticket&&ticket.row)+'|'+String(ticket&&ticket.seat)&&p.querySelector('#rahEditSeat'))return;
 p.dataset.editTicketKey=String(ticket&&ticket.door)+'|'+String(ticket&&ticket.section||ticket&&ticket.area)+'|'+String(ticket&&ticket.row)+'|'+String(ticket&&ticket.seat);
 p.replaceChildren(
  field('rahEditDoor','Door',ticket.door||'',false),
  field('rahEditSection','Section',ticket.section||ticket.area||'',false),
  field('rahEditRow','Row',ticket.row||'',true),
  field('rahEditSeat','Seat',ticket.seat||'',true)
 );
 p.style.cssText='position:fixed!important;left:50%!important;bottom:66px!important;top:auto!important;transform:translateX(-50%)!important;z-index:2147483647!important;display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;padding:7px 9px;background:#fff!important;color:#111!important;border:1px solid #333;border-radius:10px;max-width:calc(100vw - 12px);box-sizing:border-box;overflow:auto';
 const sl=document.getElementById('seatLabel');if(sl){sl.style.display='none';sl.style.minHeight='0';sl.style.padding='0'}
}
function moveDot(){
 fieldsToTicket();
 if(!ticket.section||!ticket.row||!ticket.seat){const st=document.getElementById('rahCorrectionStatus');if(st)st.textContent='Enter Section, Row and Seat first';return}
 const text=[ticket.door&&('Door '+ticket.door),ticket.section,'Row '+ticket.row,'Seat '+ticket.seat].filter(Boolean).join(' ');
 const old=window.prompt;window.prompt=()=>text;
 try{window.RAHSeatMap.startCorrection()}finally{window.prompt=old}
 const st=document.getElementById('rahCorrectionStatus');if(st)st.textContent='Click the exact seat position';
}
function standardBar(){
 const b=document.getElementById('rahCorrectionBar');if(!b)return;
 [...b.querySelectorAll('button')].forEach(x=>{const t=(x.textContent||'').trim().toLowerCase();if(t==='correct seat'||t==='undo')x.remove()});
 let old=document.getElementById('rahCorrectionStatus');
 if(old&&old.tagName!=='SPAN'){old.remove();old=null}
 let mv=document.getElementById('rahMoveDot');if(!mv){mv=document.createElement('button');mv.id='rahMoveDot';mv.type='button';mv.textContent='Move Dot';mv.onclick=e=>{e.preventDefault();moveDot()};const cal=[...b.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Calibration');b.insertBefore(mv,cal||null)}
 if(!old){old=document.createElement('span');old.id='rahCorrectionStatus';old.textContent='';old.style.cssText='align-self:center;min-width:90px;text-align:center;font-size:12px';b.appendChild(old)}
 b.style.cssText='position:fixed;left:50%;bottom:8px;top:auto;transform:translateX(-50%);z-index:2147483647;display:flex;gap:6px;padding:6px 8px;background:#fff;color:#111;border:1px solid #333;border-radius:10px;max-width:calc(100vw - 12px);flex-wrap:wrap;justify-content:center;box-sizing:border-box';
}
function calibration(){const p=document.getElementById('rahCalibrationPanel');if(p)p.style.cssText+=';position:fixed!important;left:50%!important;bottom:8px!important;top:auto!important;transform:translateX(-50%)!important;max-width:calc(100vw - 12px)!important;z-index:2147483647!important'}
function scan(){const p=document.getElementById('rahScanReadout');if(p&&p.style.display!=='none')p.style.cssText+=';position:fixed!important;left:50%!important;bottom:70px!important;top:auto!important;transform:translateX(-50%)!important;max-width:calc(100vw - 16px)!important'}
function enhance(){addVersion();standardBar();editPopup();calibration();scan()}
function wrapMap(){
 const m=window.RAHSeatMap;if(!m||m.__editableWrapped)return false;m.__editableWrapped=true;
 const oi=m.install,os=m.setTicket,or=m.renderMarker,oa=m.addControls;
 m.install=function(t){capture(t);const r=oi.apply(this,arguments);requestAnimationFrame(enhance);return r};
 m.setTicket=function(t){capture(t);const r=os.apply(this,arguments);requestAnimationFrame(enhance);return r};
 m.renderMarker=function(){const r=or.apply(this,arguments);requestAnimationFrame(enhance);return r};
 m.addControls=function(){const r=oa.apply(this,arguments);requestAnimationFrame(enhance);return r};
 return true;
}
function boot(){addVersion();wrapMap();enhance()}
const mo=new MutationObserver(()=>requestAnimationFrame(boot));mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
window.addEventListener('resize',()=>requestAnimationFrame(enhance));
if(window.visualViewport)visualViewport.addEventListener('resize',()=>requestAnimationFrame(enhance));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();