/* Royal Albert Hall seat map — OCR/geometry assisted.
   Built from readable row/seat anchors in rah-seating-plan.jpg and interpolated through
   the regular printed seat grids. Event driven only: no observers, timers or background scans. */
(function(){
'use strict';
const CORR='rahSeatCorrectionsV2';
/* Hard anchors read directly from the supplied scan. Percentages are of the JPEG. */
const EXACT={
 'O|7|141':{x:73.1,y:38.6,source:'read from scan'},
 'O|1|110':{x:63.1,y:43.4,source:'read from scan'},
 'O|1|105':{x:63.7,y:46.0,source:'read from scan'},
 'O|1|100':{x:64.2,y:48.6,source:'read from scan'}
};
/* Each block is a quadrilateral around the printed seat grid.  rowAxis says which
   direction rows run.  Seat numbers are then inferred from readable sequences.
   These models deliberately remain compact rather than storing thousands of literal points. */
const BLOCKS={
 O:{name:'Stalls O',rows:11,seatMin:92,seatMax:165,q:[[61.4,31.7],[76.7,27.5],[81.3,46.0],[65.0,50.0]],rowAxis:'x'},
 M:{name:'Stalls M',rows:11,seatMin:88,seatMax:165,q:[[65.0,50.2],[81.4,46.2],[80.0,62.0],[62.0,61.0]],rowAxis:'x'},
 L:{name:'Stalls L',rows:11,seatMin:56,seatMax:137,q:[[61.8,61.2],[80.0,62.2],[72.7,78.0],[54.7,70.5]],rowAxis:'x'},
 K:{name:'Stalls K',rows:11,seatMin:45,seatMax:101,q:[[45.5,69.2],[54.5,70.5],[57.0,82.0],[42.0,80.0]],rowAxis:'x'},
 J:{name:'Stalls J',rows:11,seatMin:31,seatMax:83,q:[[31.0,61.5],[45.3,69.0],[42.0,80.0],[22.0,76.0]],rowAxis:'x'},
 H:{name:'Stalls H',rows:11,seatMin:14,seatMax:56,q:[[14.0,48.0],[31.0,50.0],[31.0,61.0],[13.5,61.5]],rowAxis:'x'},
 G:{name:'Stalls G',rows:11,seatMin:1,seatMax:32,q:[[20.0,31.0],[38.5,37.0],[31.0,50.0],[14.0,47.5]],rowAxis:'x'},
 C:{name:'Stalls C',rows:32,seatMin:11,seatMax:26,q:[[40.0,35.5],[49.0,35.5],[49.0,68.0],[40.0,67.0]],rowAxis:'y'},
 D:{name:'Stalls D',rows:32,seatMin:27,seatMax:34,q:[[51.0,35.5],[58.5,35.5],[59.0,67.0],[51.0,68.0]],rowAxis:'y'},
 A:{name:'Stalls A',rows:20,seatMin:5,seatMax:10,q:[[34.0,40.0],[39.5,40.0],[39.5,58.5],[34.0,58.5]],rowAxis:'y'},
 B:{name:'Stalls B',rows:20,seatMin:5,seatMax:10,q:[[34.0,58.5],[39.5,58.5],[39.5,68.0],[34.0,68.0]],rowAxis:'y'},
 E:{name:'Stalls E',rows:20,seatMin:27,seatMax:34,q:[[59.0,40.0],[64.0,40.0],[64.0,58.5],[59.0,58.5]],rowAxis:'y'},
 F:{name:'Stalls F',rows:20,seatMin:27,seatMax:34,q:[[59.0,58.5],[64.0,58.5],[64.0,68.0],[59.0,68.0]],rowAxis:'y'},
 P:{name:'Circle P',rows:7,seatMin:1,seatMax:70,q:[[6.5,25.0],[24.0,29.0],[14.0,42.0],[3.5,37.0]],rowAxis:'y'},
 Q:{name:'Circle Q',rows:7,seatMin:1,seatMax:80,q:[[3.5,37.0],[14.0,42.0],[14.0,55.0],[1.5,53.0]],rowAxis:'y'},
 R:{name:'Circle R',rows:7,seatMin:1,seatMax:90,q:[[1.5,53.0],[14.0,55.0],[20.0,69.0],[4.0,67.0]],rowAxis:'y'},
 S:{name:'Circle S',rows:7,seatMin:1,seatMax:90,q:[[4.0,67.0],[20.0,69.0],[29.0,82.0],[11.0,80.0]],rowAxis:'y'},
 T:{name:'Circle T',rows:7,seatMin:1,seatMax:90,q:[[11.0,80.0],[29.0,82.0],[43.0,92.0],[23.0,92.0]],rowAxis:'y'},
 U:{name:'Circle U',rows:7,seatMin:1,seatMax:90,q:[[43.0,82.0],[58.0,82.0],[77.0,92.0],[43.0,92.0]],rowAxis:'y'},
 V:{name:'Circle V',rows:7,seatMin:1,seatMax:90,q:[[58.0,82.0],[73.0,79.0],[89.0,80.0],[77.0,92.0]],rowAxis:'y'},
 W:{name:'Circle W',rows:7,seatMin:1,seatMax:90,q:[[73.0,68.0],[82.0,62.0],[96.0,67.0],[89.0,80.0]],rowAxis:'y'},
 X:{name:'Circle X',rows:7,seatMin:1,seatMax:90,q:[[82.0,49.0],[96.0,45.0],[98.0,60.0],[82.0,62.0]],rowAxis:'y'},
 Y:{name:'Circle Y',rows:7,seatMin:1,seatMax:80,q:[[76.0,29.0],[94.0,25.0],[97.0,45.0],[82.0,49.0]],rowAxis:'y'},
 EC:{name:'East Choir',rows:7,seatMin:1,seatMax:80,q:[[18.0,12.0],[42.0,18.0],[36.0,27.0],[15.0,22.0]],rowAxis:'y'},
 WC:{name:'West Choir',rows:7,seatMin:1,seatMax:80,q:[[58.0,18.0],[82.0,12.0],[85.0,22.0],[64.0,27.0]],rowAxis:'y'}
};
function lerp(a,b,t){return a+(b-a)*t}function bilerp(q,u,v){const tx=lerp(q[0][0],q[1][0],u),ty=lerp(q[0][1],q[1][1],u),bx=lerp(q[3][0],q[2][0],u),by=lerp(q[3][1],q[2][1],u);return{x:lerp(tx,bx,v),y:lerp(ty,by,v)}}
function clean(v){const u=String(v||'').toUpperCase();if(/EAST\s*CHOIR/.test(u))return'EC';if(/WEST\s*CHOIR/.test(u))return'WC';return u.replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}function key(s,r,n){return s+'|'+r+'|'+n}
function saved(){try{return JSON.parse(localStorage.getItem(CORR)||'{}')}catch(e){return{}}}
function pointFor(s,r,n){const k=key(s,r,n),c=saved()[k];if(c)return{section:s,row:r,seat:n,x:c.x,y:c.y,door:c.door||'',kind:'corrected'};if(EXACT[k])return{section:s,row:r,seat:n,...EXACT[k],kind:'OCR anchor'};const b=BLOCKS[s];if(!b)return null;let rr=Math.max(1,Math.min(b.rows,r)),v=(rr-1)/Math.max(1,b.rows-1),u=(n-b.seatMin)/Math.max(1,b.seatMax-b.seatMin);u=Math.max(0,Math.min(1,u));if(b.rowAxis==='x'){const z=u;u=v;v=z}const p=bilerp(b.q,u,v);return{section:s,row:r,seat:n,x:p.x,y:p.y,kind:'interpolated'} }
function locate(t){return pointFor(clean(t&&(t.section||t.area)),num(t&&t.row),num(t&&t.seat))}
/* Hover works in reverse: sample plausible row/seat positions in the block under the pointer and return nearest. */
function nearest(x,y){let best=null,bd=1e9;for(const [s,b] of Object.entries(BLOCKS)){for(let r=1;r<=b.rows;r++){const count=Math.min(100,b.seatMax-b.seatMin+1),step=Math.max(1,Math.round((b.seatMax-b.seatMin)/count));for(let n=b.seatMin;n<=b.seatMax;n+=step){const p=pointFor(s,r,n),d=(p.x-x)**2+(p.y-y)**2;if(d<bd){bd=d;best=p}}}}return best?{...best,distance:Math.sqrt(bd)}:null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function label(p){if(!p)return'No seat identified';const b=BLOCKS[p.section];return[(p.door&&'Door '+p.door),(b?b.name:'Section '+p.section),'Row '+p.row,'Seat '+p.seat,p.kind].filter(Boolean).join(' · ')}
function install(){const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host||img.dataset.rahMap==='2')return;img.dataset.rahMap='2';/* whiten the paper without altering geometry */img.style.filter='grayscale(1) brightness(1.75) contrast(1.65)';img.style.cursor='crosshair';let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:#000e;color:white;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap';document.body.appendChild(read)}img.addEventListener('pointermove',ev=>{const q=pct(ev,img),p=nearest(q.x,q.y);if(p&&p.distance<2.4){read.textContent=label(p);read.style.display='block';read.style.left=Math.min(innerWidth-330,ev.clientX+14)+'px';read.style.top=Math.min(innerHeight-42,ev.clientY+14)+'px'}else read.style.display='none'});img.addEventListener('pointerleave',()=>read.style.display='none');let t={};try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')t=ticketFor(selected)||{}}catch(e){}const p=locate(t),m=document.getElementById('seatMark'),l=document.getElementById('seatLabel');if(p&&m){m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%'}if(p&&l)l.textContent=[t.door&&'Door '+t.door,(BLOCKS[p.section]||{}).name||t.section,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat,p.kind].filter(Boolean).join(' · ')}
document.addEventListener('click',ev=>{const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;if(/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(install,0)},false);
window.RAHSeatMap={install,locate,nearest,blocks:BLOCKS,exact:EXACT};
})();