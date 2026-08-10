/* Proms Lister ticket reader + Royal Albert Hall seat position marker.
   IMPORTANT: bestTicketPage/selectStoredPage are the known-good long-PDF selection path. */
(function(){'use strict';
const PUSH_LABEL='10 Aug 2026 16:00 BST';
function addPushLabel(){let f=document.querySelector('.home-footer');if(!f)return;let x=document.getElementById('lastPushLabel');if(!x){x=document.createElement('div');x.id='lastPushLabel';x.style.cssText='margin-top:8px;font-weight:800;color:#6e1f26';f.appendChild(x)}x.textContent='Last push: '+PUSH_LABEL}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPushLabel);else addPushLabel();

/* KNOWN GOOD LONG-PDF PAGE SELECTION — do not replace while changing seat UI. */
window.bestTicketPage=function(c,pages,savedPage){const saved=Number(savedPage||0)-1;let best=0,bestScore=-Infinity;for(let i=0;i<pages.length;i++){const q=ticketPageScore(c,pages[i]);if(q>bestScore||(q===bestScore&&i===saved)){bestScore=q;best=i}}return best};
function valueAfterLabel(s,label,valuePattern){const patterns=[new RegExp('\\b'+label+'\\b\\s*[:#-]?\\s*('+valuePattern+')\\b','i'),new RegExp('\\b'+label+'\\b(?:\\s|[:#-]){0,20}('+valuePattern+')\\b','i')];for(const re of patterns){const m=s.match(re);if(m&&m[1]&&!new RegExp('^(?:door|row|seat|section|box)$','i').test(m[1]))return m[1]}return''}
function historicalSeat(text){
 const s=String(text||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
 let door=valueAfterLabel(s,'Door','\\d{1,3}');
 let row=valueAfterLabel(s,'Row','[A-Z0-9]{1,4}');
 let seat=valueAfterLabel(s,'Seat(?:s)?','\\d{1,4}');
 let section='',m;
 const candidates=[/\b(Stalls\s+[A-Z]{1,2})\b/i,/\b(Rausing Circle\s+[A-Z]{1,2})\b/i,/\b(Circle\s+[A-Z]{1,2})\b/i,/\b(Gallery\s+[A-Z]{1,2})\b/i,/\b(Choir\s+[A-Z]{1,2})\b/i,/\b(Grand Tier\s+[A-Z0-9]{1,4})\b/i,/\b(Second Tier\s+[A-Z0-9]{1,4})\b/i,/\b(Loggia\s+[A-Z0-9]{1,4})\b/i,/\bBox\s*(?:No\.?|Number|:)\s*([A-Z0-9]{1,4})\b/i,/\bArena\b/i];
 for(const re of candidates){m=s.match(re);if(!m)continue;section=/^box/i.test(m[0])?'Box '+m[1]:(m[1]||m[0]);break}
 if(!section){m=s.match(/\bSection\b(?:\s|[:#-]){0,20}(Stalls\s+[A-Z]{1,2}|[A-Z]{1,2})\b/i);if(m)section=/^stalls/i.test(m[1])?m[1]:'Stalls '+m[1]}
 section=String(section||'').replace(/\s+/g,' ').trim();if(/^box(?:\s+box)?$/i.test(section))section='';
 if(!door||!row||!seat){
  const block=s.match(/\bDoor\b[\s\S]{0,120}?\b(?:Section|Area)\b[\s\S]{0,120}?\bRow\b[\s\S]{0,120}?\bSeat(?:s)?\b[\s:|·,-]*([0-9]{1,3})\s+(Stalls\s+[A-Z]{1,2}|Rausing Circle\s+[A-Z]{1,2}|Circle\s+[A-Z]{1,2}|Gallery\s+[A-Z]{1,2}|Choir\s+[A-Z]{1,2}|Grand Tier\s+[A-Z0-9]{1,4}|Second Tier\s+[A-Z0-9]{1,4}|Loggia\s+[A-Z0-9]{1,4}|Arena)\s+([A-Z0-9]{1,4})\s+([0-9]{1,4})\b/i);
  if(block){door=door||block[1];section=section||block[2];row=row||block[3];seat=seat||block[4]}
 }
 if(section&&(!door||!row||!seat)){
  const pos=s.toLowerCase().indexOf(section.toLowerCase()),tail=pos>=0?s.slice(pos+section.length):s;
  const nums=(tail.match(/\b\d{1,4}\b/g)||[]).map(Number);
  if(!door&&nums.length>=1&&nums[0]>=1&&nums[0]<=99)door=String(nums[0]);
  if(!row&&nums.length>=2)row=String(nums[1]);
  if(!seat&&nums.length>=3)seat=String(nums[2]);
 }
 return{door,section,row,seat};
}
async function selectStoredPage(c){const k=keyFor(c),rec=await pdfGet(k);if(!rec||!rec.blob)throw Error('No attached ticket file is stored for this Prom.');const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream';const pages=(type==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf'))?await pdfPages(rec.blob):[await imageText(rec.blob)];if(!pages.length)throw Error('The ticket file contains no readable pages.');const old=loadTickets()[k]||{},idx=window.bestTicketPage(c,pages,old.ticketPage);return{k,rec,type,pages,idx,page:pages[idx],old}}
async function readTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),parsed=historicalSeat(f.page);if(!parsed.door&&!parsed.section&&!parsed.row&&!parsed.seat)throw Error('Correct ticket page selected, but no seat fields were readable.');const all=loadTickets(),t=all[f.k]={...f.old,...parsed,hasTicket:true,pdfName:f.old.pdfName||f.rec.name,fileType:f.old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);active=t;render();openDetail(c);renderMarker();if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile()}catch(e){console.error(e);alert('Read Seat Details failed: '+(e.message||e))}}
async function openCorrectTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),all=loadTickets();all[f.k]={...f.old,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);const u=URL.createObjectURL(new Blob([f.rec.blob],{type:f.type}));window.open(u+'#page='+(f.idx+1)+'&zoom=page-width','_blank');setTimeout(()=>URL.revokeObjectURL(u),300000)}catch(e){console.error(e);alert('Open Ticket failed: '+(e.message||e))}}
document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const id=b.id||'',t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(id==='readTicket'||t==='read seat details'||t==='read ticket'||t.includes('read seat')){e.preventDefault();e.stopImmediatePropagation();readTicket(selected);return}if(id==='openPdf'||t==='open ticket'){e.preventDefault();e.stopImmediatePropagation();openCorrectTicket(selected)}},true);

/* Seat map coordinates are percentages of rah-seating-plan2.jpeg. */
const EXACT={
 'O|7|141':{x:73.1,y:38.6},
 'O|1|110':{x:63.1,y:43.4},
 'O|1|105':{x:63.7,y:46.0},
 'O|1|100':{x:64.2,y:48.6}
};
const BLOCKS={
 O:{name:'Stalls O',rows:11,seatMin:92,seatMax:165,q:[[61.4,31.7],[76.7,27.5],[81.3,46.0],[65.0,50.0]],rowAxis:'x'},
 M:{name:'Stalls M',rows:11,seatMin:88,seatMax:165,q:[[65.0,50.2],[81.4,46.2],[80.0,62.0],[62.0,61.0]],rowAxis:'x'},
 L:{name:'Stalls L',rows:11,seatMin:56,seatMax:137,q:[[61.8,61.2],[80.0,62.2],[72.7,78.0],[54.7,70.5]],rowAxis:'x'},
 K:{name:'Stalls K',rows:11,seatMin:45,seatMax:101,q:[[45.5,69.2],[54.5,70.5],[57.0,82.0],[42.0,80.0]],rowAxis:'x'},
 J:{name:'Stalls J',rows:11,seatMin:31,seatMax:83,q:[[31.0,61.5],[45.3,69.0],[42.0,80.0],[22.0,76.0]],rowAxis:'x'},
 H:{name:'Stalls H',rows:11,seatMin:14,seatMax:56,q:[[14.0,48.0],[31.0,50.0],[31.0,61.0],[13.5,61.5]],rowAxis:'x'},
 G:{name:'Stalls G',rows:11,seatMin:1,seatMax:32,q:[[20.0,31.0],[38.5,37.0],[31.0,50.0],[14.0,47.5]],rowAxis:'x'}
};
function lerp(a,b,t){return a+(b-a)*t}
function bilerp(q,u,v){const tx=lerp(q[0][0],q[1][0],u),ty=lerp(q[0][1],q[1][1],u),bx=lerp(q[3][0],q[2][0],u),by=lerp(q[3][1],q[2][1],u);return{x:lerp(tx,bx,v),y:lerp(ty,by,v)}}
function clean(v){const s=String(v||'').toUpperCase();return s.replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function pointFor(s,r,n){const e=EXACT[s+'|'+r+'|'+n];if(e)return{section:s,row:r,seat:n,x:e.x,y:e.y,kind:'mapped'};const b=BLOCKS[s];if(!b||!Number.isFinite(r)||!Number.isFinite(n))return null;let v=Math.max(0,Math.min(1,(r-1)/Math.max(1,b.rows-1))),u=Math.max(0,Math.min(1,(n-b.seatMin)/Math.max(1,b.seatMax-b.seatMin)));if(b.rowAxis==='x'){const z=u;u=v;v=z}const p=bilerp(b.q,u,v);return{section:s,row:r,seat:n,x:p.x,y:p.y,kind:'interpolated'}}
function locate(t){return pointFor(clean(t&&(t.section||t.area)),num(t&&t.row),num(t&&t.seat))}
let active={};
function currentTicket(){if(active&&active.section&&active.row&&active.seat)return active;try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function'){const t=ticketFor(selected)||{};if(t&&Object.keys(t).length)return t}}catch(e){}return active||{}}
function ensureMarker(){const host=document.getElementById('pi');if(!host)return null;let mark=document.getElementById('seatMark');if(!mark){mark=document.createElement('div');mark.id='seatMark';mark.style.cssText='display:none;position:absolute;width:18px;height:18px;transform:translate(-50%,-50%);border-radius:50%;background:#e4002b;border:3px solid white;box-shadow:0 0 0 3px #e4002b,0 2px 10px #0008;pointer-events:none;z-index:50';host.appendChild(mark)}return mark}
function install(){const img=document.getElementById('rahImg');if(!img)return;ensureMarker();renderMarker()}
function setTicket(t){if(t)active=t;renderMarker()}
function renderMarker(){const t=currentTicket(),p=locate(t),mark=ensureMarker(),label=document.getElementById('seatLabel');if(label)label.textContent=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');if(!mark)return p;if(!p){mark.style.display='none';return null}mark.style.display='block';mark.style.left=p.x+'%';mark.style.top=p.y+'%';mark.title=[t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');return p}
window.RAHSeatMap={mapRevision:'SEAT-MARKER-RESTORED-20260810',install,setTicket,renderMarker,closeCorrectionUI:function(){},locate};
window.RAHTicketRepair={readTicket,openCorrectTicket,selectStoredPage,historicalSeat};
})();