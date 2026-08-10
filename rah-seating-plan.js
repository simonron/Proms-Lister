/* Proms Lister ticket reader + RAH marker/fixer. GOOD baseline retained. */
(function(){'use strict';
const PUSH_LABEL='10 Aug 2026 16:35 BST',CORR='rahUserSeatCorrections:v1';
function addPushLabel(){const f=document.querySelector('.home-footer');if(!f)return;let x=document.getElementById('lastPushLabel');if(!x){x=document.createElement('div');x.id='lastPushLabel';x.style.cssText='margin-top:8px;font-weight:800;color:#6e1f26';f.appendChild(x)}x.textContent='Last push: '+PUSH_LABEL}

/* GOOD: correctly selects the ticket inside a long multi-ticket PDF. DO NOT ALTER. */
window.bestTicketPage=function(c,pages,savedPage){const saved=Number(savedPage||0)-1;let best=0,bestScore=-Infinity;for(let i=0;i<pages.length;i++){const q=ticketPageScore(c,pages[i]);if(q>bestScore||(q===bestScore&&i===saved)){bestScore=q;best=i}}return best};

function historicalSeat(text){
 const s=String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
 let section='',m;
 for(const re of [/\b(Stalls\s+[A-Z]{1,2})\b/i,/\b(Rausing Circle\s+[A-Z]{1,2})\b/i,/\b(Circle\s+[A-Z]{1,2})\b/i,/\b(Gallery\s+[A-Z]{1,2})\b/i,/\b(Choir\s+[A-Z]{1,2})\b/i,/\b(Grand Tier\s+[A-Z0-9]{1,4})\b/i,/\b(Second Tier\s+[A-Z0-9]{1,4})\b/i,/\b(Loggia\s+[A-Z0-9]{1,4})\b/i,/\bBox\s*(?:No\.?|Number|:)\s*([A-Z0-9]{1,4})\b/i,/\bArena\b/i]){m=s.match(re);if(m){section=/^box/i.test(m[0])?'Box '+m[1]:(m[1]||m[0]);break}}
 if(!section){m=s.match(/\bSection\b\s*[:#-]?\s*(Stalls\s+[A-Z]{1,2}|[A-Z]{1,2})\b/i);if(m)section=/^stalls/i.test(m[1])?m[1]:'Stalls '+m[1]}
 section=String(section||'').replace(/\s+/g,' ').trim();if(/^box(?:\s+box)?$/i.test(section))section='';
 function between(label,nextLabels,pattern){const re=new RegExp('\\b'+label+'\\b([\\s\\S]{0,80}?)(?=\\b(?:'+nextLabels.join('|')+')\\b|$)','i'),block=(s.match(re)||[])[1]||'',v=block.match(new RegExp('(?:^|[^0-9A-Z])('+pattern+')(?:[^0-9A-Z]|$)','i'));return v?v[1]:''}
 let door=between('Door',['Section','Area','Row','Seat(?:s)?'],'\\d{1,3}');
 let row=between('Row',['Seat(?:s)?','Door','Section','Area'],'[A-Z0-9]{1,4}');
 let seat=between('Seat(?:s)?',['Door','Section','Area','Row'],'\\d{1,4}');
 if(section&&(!door||!row||!seat)){
   const labels=s.match(/\bDoor\b[\s\S]{0,80}?\b(?:Section|Area)\b[\s\S]{0,80}?\bRow\b[\s\S]{0,80}?\bSeat(?:s)?\b/i);
   if(labels){const after=s.slice((labels.index||0)+labels[0].length),secPos=after.toLowerCase().indexOf(section.toLowerCase());if(secPos>=0){const before=after.slice(0,secPos),afterSec=after.slice(secPos+section.length),beforeNums=before.match(/\b\d{1,3}\b/g)||[],afterNums=afterSec.match(/\b\d{1,4}\b/g)||[];if(!door&&beforeNums.length)door=beforeNums[beforeNums.length-1];if(!row&&afterNums.length)row=afterNums[0];if(!seat&&afterNums.length>1)seat=afterNums[1]}}
 }
 return{door,section,row,seat};
}

async function selectStoredPage(c,cache){
 const k=keyFor(c),rec=await pdfGet(k);if(!rec||!rec.blob)throw Error('No attached ticket file is stored for this Prom.');
 const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream',cacheKey=(rec.name||'ticket')+'|'+rec.blob.size+'|'+type;
 let pages=cache&&cache.get(cacheKey);if(!pages){pages=(type==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf'))?await pdfPages(rec.blob):[await imageText(rec.blob)];if(cache)cache.set(cacheKey,pages)}
 if(!pages.length)throw Error('The ticket file contains no readable pages.');
 const old=loadTickets()[k]||{},idx=window.bestTicketPage(c,pages,old.ticketPage);return{k,rec,type,pages,idx,page:pages[idx],old};
}

async function readTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),parsed=historicalSeat(f.page);if(!parsed.door&&!parsed.section&&!parsed.row&&!parsed.seat)throw Error('Correct ticket page selected, but no seat fields were readable.');const all=loadTickets(),t=all[f.k]={...f.old,...parsed,hasTicket:true,pdfName:f.old.pdfName||f.rec.name,fileType:f.old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);active=t;render();openDetail(c);renderMarker();if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile()}catch(e){console.error(e);alert('Read Seat Details failed: '+(e.message||e))}}
async function openCorrectTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),all=loadTickets();all[f.k]={...f.old,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);const u=URL.createObjectURL(new Blob([f.rec.blob],{type:f.type}));window.open(u+'#page='+(f.idx+1)+'&zoom=page-width','_blank');setTimeout(()=>URL.revokeObjectURL(u),300000)}catch(e){console.error(e);alert('Open Ticket failed: '+(e.message||e))}}

document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const id=b.id||'',t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(id==='readTicket'||t==='read seat details'||t==='read ticket'||t.includes('read seat')){e.preventDefault();e.stopImmediatePropagation();readTicket(selected);return}if(id==='openPdf'||t==='open ticket'){e.preventDefault();e.stopImmediatePropagation();openCorrectTicket(selected)}},true);

/* RAH marker + fixer. */
const EXACT={'O|7|141':{x:73.1,y:38.6},'O|1|110':{x:63.1,y:43.4},'O|1|105':{x:63.7,y:46.0},'O|1|100':{x:64.2,y:48.6}};
const BLOCKS={O:{name:'Stalls O',rows:11,seatMin:92,seatMax:165,q:[[61.4,31.7],[76.7,27.5],[81.3,46.0],[65,50]]},M:{name:'Stalls M',rows:11,seatMin:88,seatMax:165,q:[[65,50.2],[81.4,46.2],[80,62],[62,61]]},L:{name:'Stalls L',rows:11,seatMin:56,seatMax:137,q:[[61.8,61.2],[80,62.2],[72.7,78],[54.7,70.5]]},K:{name:'Stalls K',rows:11,seatMin:45,seatMax:101,q:[[45.5,69.2],[54.5,70.5],[57,82],[42,80]]},J:{name:'Stalls J',rows:11,seatMin:31,seatMax:83,q:[[31,61.5],[45.3,69],[42,80],[22,76]]},H:{name:'Stalls H',rows:11,seatMin:14,seatMax:56,q:[[14,48],[31,50],[31,61],[13.5,61.5]]},G:{name:'Stalls G',rows:11,seatMin:1,seatMax:32,q:[[20,31],[38.5,37],[31,50],[14,47.5]]}};
function lerp(a,b,t){return a+(b-a)*t}function bilerp(q,u,v){const tx=lerp(q[0][0],q[1][0],u),ty=lerp(q[0][1],q[1][1],u),bx=lerp(q[3][0],q[2][0],u),by=lerp(q[3][1],q[2][1],u);return{x:lerp(tx,bx,v),y:lerp(ty,by,v)}}function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}function seatKey(t){return clean(t&&(t.section||t.area))+'|'+num(t&&t.row)+'|'+num(t&&t.seat)}
function corrections(){try{return JSON.parse(localStorage.getItem(CORR)||'{}')}catch(e){return{}}}function saveCorrection(t,p){const a=corrections();a[seatKey(t)]={x:p.x,y:p.y};localStorage.setItem(CORR,JSON.stringify(a))}
function pointFor(s,r,n){const user=corrections()[s+'|'+r+'|'+n];if(user)return{section:s,row:r,seat:n,x:user.x,y:user.y,kind:'fixed'};const e=EXACT[s+'|'+r+'|'+n];if(e)return{section:s,row:r,seat:n,x:e.x,y:e.y,kind:'mapped'};const b=BLOCKS[s];if(!b||!Number.isFinite(r)||!Number.isFinite(n))return null;const v=Math.max(0,Math.min(1,(r-1)/Math.max(1,b.rows-1))),u=Math.max(0,Math.min(1,(n-b.seatMin)/Math.max(1,b.seatMax-b.seatMin))),p=bilerp(b.q,u,v);return{section:s,row:r,seat:n,x:p.x,y:p.y,kind:'interpolated'}}function locate(t){return pointFor(clean(t&&(t.section||t.area)),num(t&&t.row),num(t&&t.seat))}
let active={},fixing=false;function currentTicket(){if(active&&active.section&&active.row&&active.seat)return active;try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||active}catch(e){}return active}
function ensureMarker(){const host=document.getElementById('pi');if(!host)return null;let m=document.getElementById('seatMark');if(!m){m=document.createElement('div');m.id='seatMark';m.style.cssText='display:none;position:absolute;width:18px;height:18px;transform:translate(-50%,-50%);border-radius:50%;background:#e4002b;border:3px solid white;box-shadow:0 0 0 3px #e4002b,0 2px 10px #0008;pointer-events:none;z-index:50';host.appendChild(m)}return m}
function ensureFixer(){let bar=document.getElementById('rahCorrectionBar');if(bar)return bar;bar=document.createElement('div');bar.id='rahCorrectionBar';bar.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:100005;background:#fff;border:2px solid #6e1f26;border-radius:12px;padding:9px;box-shadow:0 8px 28px #0006;display:flex;gap:7px;align-items:center;flex-wrap:wrap';bar.innerHTML='<b style="margin-right:auto">Seat fixer</b><span id="rahFixStatus" style="font-size:12px">Marker frozen</span><button id="rahFixStart" type="button">Move marker</button><button id="rahFixReset" type="button">Reset</button>';document.body.appendChild(bar);bar.querySelector('#rahFixStart').onclick=()=>{fixing=!fixing;bar.querySelector('#rahFixStart').textContent=fixing?'Tap seat position':'Move marker';bar.querySelector('#rahFixStatus').textContent=fixing?'Tap the correct place on the map':'Marker frozen'};bar.querySelector('#rahFixReset').onclick=()=>{const t=currentTicket(),a=corrections();delete a[seatKey(t)];localStorage.setItem(CORR,JSON.stringify(a));fixing=false;renderMarker();bar.querySelector('#rahFixStatus').textContent='Reset to calculated position';bar.querySelector('#rahFixStart').textContent='Move marker'};return bar}
function install(){const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host)return;ensureMarker();ensureFixer();if(img.dataset.rahFixer!=='1'){img.dataset.rahFixer='1';img.addEventListener('click',ev=>{if(!fixing)return;ev.preventDefault();ev.stopPropagation();const r=img.getBoundingClientRect(),p={x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height},t=currentTicket();saveCorrection(t,p);fixing=false;renderMarker();const b=document.getElementById('rahCorrectionBar');if(b){b.querySelector('#rahFixStatus').textContent='Marker frozen at corrected position';b.querySelector('#rahFixStart').textContent='Move marker'}})}renderMarker()}
function setTicket(t){if(t)active=t;renderMarker()}function renderMarker(){const t=currentTicket(),p=locate(t),m=ensureMarker(),l=document.getElementById('seatLabel');if(l)l.textContent=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');if(!m)return p;if(!p){m.style.display='none';return null}m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%';return p}
function closeCorrectionUI(){fixing=false;document.querySelectorAll('#rahCorrectionBar,#rahHoverReadout').forEach(x=>x.remove())}
document.addEventListener('click',ev=>{const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;if(/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(install,0);if(el.id==='piClose'||/^(close|×)$/i.test((el.textContent||'').trim()))setTimeout(()=>{const modal=document.getElementById('rahPlanModal');if(!modal||getComputedStyle(modal).display==='none')closeCorrectionUI()},0)},true);

/* Add a real Back button to the concert/ticket detail sheet. */
function ensureDetailBack(){const d=document.getElementById('detail');if(!d||document.getElementById('ticketDetailBack'))return;const b=document.createElement('button');b.id='ticketDetailBack';b.type='button';b.className='btn';b.textContent='← Back';b.style.cssText='margin:0 0 10px 0';b.onclick=()=>{if(typeof closeSheet==='function')closeSheet();else{document.getElementById('backdrop')?.classList.remove('open');document.getElementById('sheet')?.classList.remove('open')}};d.insertBefore(b,d.firstChild)}

/* Auto-read every locally attached ticket quietly on load. */
async function autoReadAllTickets(){
 try{
  if(typeof concerts==='undefined'||typeof loadTickets!=='function'||typeof pdfGet!=='function')return;
  const all=loadTickets(),cache=new Map();let changed=false;
  for(const c of concerts){const k=keyFor(c),old=all[k]||{};if(!old.pdfName&&!old.hasTicket)continue;let rec;try{rec=await pdfGet(k)}catch(_){continue}if(!rec||!rec.blob)continue;try{const f=await selectStoredPage(c,cache),parsed=historicalSeat(f.page);if(!parsed.door&&!parsed.section&&!parsed.row&&!parsed.seat)continue;all[k]={...old,...parsed,hasTicket:true,pdfName:old.pdfName||f.rec.name,fileType:old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};changed=true}catch(e){console.warn('Auto-read ticket skipped',k,e)}}
  if(changed){saveTickets(all);if(typeof render==='function')render();if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile()}
 }catch(e){console.warn('Auto-read tickets failed',e)}
}

function boot(){addPushLabel();ensureDetailBack();const mo=new MutationObserver(()=>ensureDetailBack());const d=document.getElementById('detail');if(d)mo.observe(d,{childList:true});setTimeout(autoReadAllTickets,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

window.RAHSeatMap={mapRevision:'GOOD-SEAT-FIXER-20260810',install,setTicket,renderMarker,closeCorrectionUI,locate};
window.RAHTicketRepair={readTicket,openCorrectTicket,selectStoredPage,historicalSeat,autoReadAllTickets};
})();