/* Royal Albert Hall seat map — map revision 2026-08-08B (1346x1536 source).
   SCRIPT ONLY. The JPEG is not modified here.
   User corrections are versioned so old-image coordinates cannot corrupt this map. */
(function(){
'use strict';
const MAP_REV='RAH-1346x1536-20260808B';
const STORE='rahUserSeatCorrections:'+MAP_REV;
const OLD_STORE='rahUserSeatCorrectionsV3';
const LOOKUP={};

/* New image geometry.  Stalls O row 7 is deliberately represented as a local row run,
   not by the obsolete whole-section transform.  Coordinates are percentages of the
   new 1346 x 1536 JPEG.  User corrections always override these values. */
(function(){
  /* Seat 141 is initially an image-read anchor on the new scan.  Neighbours are local
     same-row interpolation only. They can be replaced individually by Correct seat. */
  const row=7, anchorSeat=141, anchorX=77.86, anchorY=29.82;
  const stepX=0.405, stepY=0.565; // local direction along the printed row on the new image
  for(let seat=121;seat<=153;seat++){
    const d=seat-anchorSeat;
    LOOKUP['O|'+row+'|'+seat]={x:anchorX+d*stepX,y:anchorY-d*stepY,section:'O',row,seat,kind:seat===anchorSeat?'new-image anchor':'same-row interpolated',mapRev:MAP_REV};
  }
})();

function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function key(s,r,n){return s+'|'+r+'|'+n}
function loadCorrections(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return{}}}
function saveCorrections(c){localStorage.setItem(STORE,JSON.stringify(c))}
function allPoints(){return Object.values(Object.assign({},LOOKUP,loadCorrections()))}
function locate(t){const s=clean(t&&(t.section||t.area)),r=num(t&&t.row),n=num(t&&t.seat),k=key(s,r,n),c=loadCorrections()[k];return c||LOOKUP[k]||null}
function nearest(x,y){let best=null,bd=Infinity;for(const p of allPoints()){const d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;best=p}}return best?Object.assign({},best,{distance:Math.sqrt(bd)}):null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function seatText(p){return p?['Stalls '+p.section,'Row '+p.row,'Seat '+p.seat,p.kind].filter(Boolean).join(' · '):''}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}
function parseSeat(s){const u=String(s||'').toUpperCase(),dm=u.match(/DOOR\s*[:#-]?\s*([A-Z0-9]+)/),rm=u.match(/ROW\s*[:#-]?\s*(\d+)/),sm=u.match(/SEAT\w*\s*[:#-]?\s*(\d+)/);let sec='';const xm=u.match(/(?:STALLS|SECTION|CIRCLE)\s*([A-Z]{1,2})\b/);if(xm)sec=xm[1];const nums=(u.match(/\b\d+\b/g)||[]).map(Number);let row=rm?+rm[1]:NaN,seat=sm?+sm[1]:NaN;if(!Number.isFinite(seat)&&nums.length)seat=nums[nums.length-1];if(!Number.isFinite(row)&&nums.length>1)row=nums[nums.length-2];if(!sec){const m=u.match(/\b([A-Y])\b/);if(m)sec=m[1]}return sec&&Number.isFinite(row)&&Number.isFinite(seat)?{door:dm?dm[1]:'',section:sec,row,seat}:null}
let pending=null;
function startCorrection(){const t=currentTicket(),def=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' '),s=prompt('Which seat are you correcting?\nExample: Door 9 Stalls O Row 7 Seat 141',def);if(s===null)return;pending=parseSeat(s);if(!pending){alert('I could not identify Section, Row and Seat. Try: Stalls O Row 7 Seat 141');return}const b=document.getElementById('rahCorrectionStatus');if(b)b.textContent='Click the exact centre of Stalls '+pending.section+' · Row '+pending.row+' · Seat '+pending.seat}
function undoCorrection(){const t=currentTicket(),k=key(clean(t.section||t.area),num(t.row),num(t.seat)),c=loadCorrections();if(c[k]){delete c[k];saveCorrections(c);updateMarker();alert('Correction removed for this seat on the current map.')}else alert('This seat has no user correction on the current map.')}
function exportCorrections(){const payload={mapRevision:MAP_REV,image:{width:1346,height:1536},corrections:loadCorrections()},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RAH-seat-corrections-'+MAP_REV+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importCorrections(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files&&i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result),rev=x.mapRevision||'',data=x.corrections||x;if(rev&&rev!==MAP_REV){alert('These corrections belong to '+rev+' and cannot be applied to '+MAP_REV+'.');return}if(!data||typeof data!=='object'||Array.isArray(data))throw 0;saveCorrections(Object.assign(loadCorrections(),data));updateMarker();alert('Seat corrections imported for '+MAP_REV+'.')}catch(e){alert('That is not a valid RAH corrections file.')}};r.readAsText(f)};i.click()}
function addControls(host){let bar=document.getElementById('rahCorrectionBar');if(bar)return;bar=document.createElement('div');bar.id='rahCorrectionBar';bar.style.cssText='position:absolute;right:10px;top:10px;z-index:40;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end';[['Correct seat',startCorrection],['Undo',undoCorrection],['Export',exportCorrections],['Import',importCorrections]].forEach(([txt,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText='padding:6px 9px;border-radius:6px;border:1px solid #777;background:#fff;color:#111;cursor:pointer';b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};bar.appendChild(b)});const st=document.createElement('span');st.id='rahCorrectionStatus';st.style.cssText='width:100%;text-align:right;background:rgba(255,255,255,.92);padding:4px 7px;border-radius:5px;font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';st.textContent='Map '+MAP_REV+' · corrections saved in this browser';bar.appendChild(st);host.appendChild(bar)}
function install(){const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host)return;/* Do not alter the new JPEG appearance. */img.style.filter='none';img.style.cursor=pending?'copy':'crosshair';addControls(host);let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.9);color:white;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap';document.body.appendChild(read)}if(img.dataset.rahMapRev!==MAP_REV){img.dataset.rahMapRev=MAP_REV;const move=ev=>{if(pending){read.textContent='Click to place Stalls '+pending.section+' · Row '+pending.row+' · Seat '+pending.seat;read.style.display='block'}else{const q=pct(ev,img),p=nearest(q.x,q.y);if(p&&p.distance<1.15){read.textContent=seatText(p);read.style.display='block'}else read.style.display='none'}if(read.style.display==='block'){read.style.left=Math.max(4,Math.min(innerWidth-330,ev.clientX+14))+'px';read.style.top=Math.max(4,Math.min(innerHeight-42,ev.clientY+14))+'px'}};img.addEventListener('mousemove',move);img.addEventListener('pointermove',move);img.addEventListener('mouseleave',()=>{if(!pending)read.style.display='none'});img.addEventListener('click',ev=>{if(!pending)return;ev.preventDefault();ev.stopPropagation();const q=pct(ev,img),c=loadCorrections(),k=key(pending.section,pending.row,pending.seat);c[k]={x:q.x,y:q.y,door:pending.door,section:pending.section,row:pending.row,seat:pending.seat,kind:'user corrected',mapRev:MAP_REV,savedAt:new Date().toISOString()};saveCorrections(c);const done=pending;pending=null;read.style.display='none';const st=document.getElementById('rahCorrectionStatus');if(st)st.textContent='Saved: Stalls '+done.section+' · Row '+done.row+' · Seat '+done.seat;updateMarker()})}updateMarker()}
function updateMarker(){const t=currentTicket(),p=locate(t),m=document.getElementById('seatMark'),l=document.getElementById('seatLabel');if(p&&m){m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%'}else if(m)m.style.display='none';if(l){const d=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');l.textContent=p?d+' — '+p.kind:d+' — position not yet indexed on '+MAP_REV}}
document.addEventListener('click',ev=>{const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(el&&/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(install,0)},true);
/* Old V3 corrections are intentionally not migrated: they belong to the previous image geometry. */
window.RAHSeatMap={mapRevision:MAP_REV,install,locate,nearest,startCorrection,exportCorrections,importCorrections,lookup:LOOKUP,oldCorrectionStore:OLD_STORE};
})();