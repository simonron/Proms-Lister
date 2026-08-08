/* Royal Albert Hall seat map — OCR/geometry assisted.
   Event driven only: no observers, timers or background scans. */
(function(){
'use strict';
const EXACT={
 'O|7|141':{x:73.1,y:38.6,source:'read from scan'},
 'O|1|110':{x:63.1,y:43.4,source:'read from scan'},
 'O|1|105':{x:63.7,y:46.0,source:'read from scan'},
 'O|1|100':{x:64.2,y:48.6,source:'read from scan'}
};
const BLOCKS={
 O:{name:'Stalls O',rows:11,seatMin:92,seatMax:165,q:[[61.4,31.7],[76.7,27.5],[81.3,46.0],[65.0,50.0]]},
 M:{name:'Stalls M',rows:11,seatMin:88,seatMax:165,q:[[65.0,50.2],[81.4,46.2],[80.0,62.0],[62.0,61.0]]},
 L:{name:'Stalls L',rows:11,seatMin:56,seatMax:137,q:[[61.8,61.2],[80.0,62.2],[72.7,78.0],[54.7,70.5]]},
 K:{name:'Stalls K',rows:11,seatMin:45,seatMax:101,q:[[45.5,69.2],[54.5,70.5],[57.0,82.0],[42.0,80.0]]},
 J:{name:'Stalls J',rows:11,seatMin:31,seatMax:83,q:[[31.0,61.5],[45.3,69.0],[42.0,80.0],[22.0,76.0]]},
 H:{name:'Stalls H',rows:11,seatMin:14,seatMax:56,q:[[14.0,48.0],[31.0,50.0],[31.0,61.0],[13.5,61.5]]},
 G:{name:'Stalls G',rows:11,seatMin:1,seatMax:32,q:[[20.0,31.0],[38.5,37.0],[31.0,50.0],[14.0,47.5]]}
};
function lerp(a,b,t){return a+(b-a)*t}
function bilerp(q,u,v){const tx=lerp(q[0][0],q[1][0],u),ty=lerp(q[0][1],q[1][1],u),bx=lerp(q[3][0],q[2][0],u),by=lerp(q[3][1],q[2][1],u);return{x:lerp(tx,bx,v),y:lerp(ty,by,v)}}
function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function pointFor(s,r,n){const e=EXACT[s+'|'+r+'|'+n];if(e)return{section:s,row:r,seat:n,x:e.x,y:e.y,kind:'OCR anchor'};const b=BLOCKS[s];if(!b||!Number.isFinite(r)||!Number.isFinite(n))return null;const v=Math.max(0,Math.min(1,(r-1)/Math.max(1,b.rows-1))),u=Math.max(0,Math.min(1,(n-b.seatMin)/Math.max(1,b.seatMax-b.seatMin))),p=bilerp(b.q,u,v);return{section:s,row:r,seat:n,x:p.x,y:p.y,kind:'interpolated'}}
function locate(t){return pointFor(clean(t&&(t.section||t.area)),num(t&&t.row),num(t&&t.seat))}
function nearest(x,y){let best=null,bd=1e9;for(const [s,b] of Object.entries(BLOCKS)){for(let r=1;r<=b.rows;r++){for(let n=b.seatMin;n<=b.seatMax;n++){const p=pointFor(s,r,n),d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;best=p}}}}return best?Object.assign({},best,{distance:Math.sqrt(bd)}):null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function label(p){const b=p&&BLOCKS[p.section];return p?[(b&&b.name)||('Section '+p.section),'Row '+p.row,'Seat '+p.seat,p.kind].join(' · '):''}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}
function install(){const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host)return;img.style.filter='grayscale(1) brightness(1.75) contrast(1.65)';img.style.cursor='crosshair';let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:#000e;color:#fff;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap';document.body.appendChild(read)}
 if(img.dataset.rahMap!=='3'){
  img.dataset.rahMap='3';
  const move=ev=>{const q=pct(ev,img),p=nearest(q.x,q.y);if(p&&p.distance<1.6){read.textContent=label(p);read.style.display='block';read.style.left=Math.max(4,Math.min(window.innerWidth-330,ev.clientX+14))+'px';read.style.top=Math.max(4,Math.min(window.innerHeight-42,ev.clientY+14))+'px'}else read.style.display='none'};
  img.addEventListener('mousemove',move);img.addEventListener('pointermove',move);host.addEventListener('mousemove',ev=>{if(ev.target===img)move(ev)});img.addEventListener('mouseleave',()=>read.style.display='none');
 }
 const t=currentTicket(),p=locate(t),m=document.getElementById('seatMark'),l=document.getElementById('seatLabel');if(p&&m){m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%'}if(p&&l)l.textContent=[t.door&&'Door '+t.door,(BLOCKS[p.section]||{}).name||t.section,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat,p.kind].filter(Boolean).join(' · ');
}
/* Capture phase is essential: the bootstrap seating-plan click handler calls stopImmediatePropagation. */
document.addEventListener('click',ev=>{const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;if(/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(install,0)},true);
/* Main bootstrap can call this after constructing its modal. */
window.RAHSeatMap={install,locate,nearest,blocks:BLOCKS,exact:EXACT};
})();