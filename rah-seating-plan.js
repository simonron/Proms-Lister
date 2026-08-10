/* EXCELLENT baseline: restore proven ticket selection/read path from 89d8084 + 394bb113. */
(function(){'use strict';
const PUSH_LABEL='10 Aug 2026 14:30 BST';
function addPushLabel(){let f=document.querySelector('.home-footer');if(!f)return;let x=document.getElementById('lastPushLabel');if(!x){x=document.createElement('div');x.id='lastPushLabel';x.style.cssText='margin-top:8px;font-weight:800;color:#6e1f26';f.appendChild(x)}x.textContent='Last push: '+PUSH_LABEL}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPushLabel);else addPushLabel();

/* Historical selector: score every page. savedPage is only a tie-breaker. */
window.bestTicketPage=function(c,pages,savedPage){const saved=Number(savedPage||0)-1;let best=0,bestScore=-Infinity;for(let i=0;i<pages.length;i++){const q=ticketPageScore(c,pages[i]);if(q>bestScore||(q===bestScore&&i===saved)){bestScore=q;best=i}}return best};

function historicalSeat(text){
 const s=String(text||'').replace(/\s+/g,' ').trim();
 /* Prefer the exact RAH ticket wording that the original reader handled. */
 let door=(s.match(/\bDoor\s*[:#-]?\s*(\d{1,3})\b/i)||[])[1]||'';
 let row=(s.match(/\bRow\s*[:#-]?\s*([A-Z0-9]{1,4})\b/i)||[])[1]||'';
 let seat=(s.match(/\bSeat(?:s)?\s*[:#-]?\s*(\d{1,4})\b/i)||[])[1]||'';
 let section='';
 let m=s.match(/\b(Stalls\s+[A-Z]{1,2}|Rausing Circle\s+[A-Z]{1,2}|Circle\s+[A-Z]{1,2}|Gallery\s+[A-Z]{1,2}|Choir\s+[A-Z]{1,2}|Grand Tier\s+[A-Z0-9]{1,4}|Second Tier\s+[A-Z0-9]{1,4}|Loggia\s+[A-Z0-9]{1,4}|Box\s+[A-Z0-9]{1,4}|Arena)\b/i);
 if(m)section=m[1].replace(/\s+/g,' ').trim();
 if(!section){m=s.match(/\bSection\s*[:#-]?\s*((?:Stalls\s+)?[A-Z]{1,2})\b/i);if(m)section=/^stalls/i.test(m[1])?m[1]:'Stalls '+m[1]}
 return {door,section,row,seat};
}

async function selectStoredPage(c){
 const k=keyFor(c),rec=await pdfGet(k);if(!rec||!rec.blob)throw Error('No attached ticket file is stored for this Prom.');
 const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream';
 const pages=(type==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf'))?await pdfPages(rec.blob):[await imageText(rec.blob)];
 if(!pages.length)throw Error('The ticket file contains no readable pages.');
 const old=loadTickets()[k]||{},idx=window.bestTicketPage(c,pages,old.ticketPage);
 return {k,rec,type,pages,idx,page:pages[idx],old};
}

async function readTicket(c){
 try{
  c=c||selected;if(!c)throw Error('No Prom selected.');
  const f=await selectStoredPage(c),parsed=historicalSeat(f.page);
  if(!parsed.section&&!parsed.row&&!parsed.seat&&!parsed.door){const legacy=parseTicket(f.page);Object.assign(parsed,legacy)}
  const all=loadTickets(),t=all[f.k]={...f.old,...parsed,hasTicket:true,pdfName:f.old.pdfName||f.rec.name,fileType:f.old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};
  saveTickets(all);render();openDetail(c);if(window.RAHSeatMap&&window.RAHSeatMap.setTicket)window.RAHSeatMap.setTicket(t);if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile();
  alert('Ticket read: '+[parsed.door&&'Door '+parsed.door,parsed.section,parsed.row&&'Row '+parsed.row,parsed.seat&&'Seat '+parsed.seat].filter(Boolean).join(' · '));
 }catch(e){console.error(e);alert('Read Seat Details failed: '+(e.message||e))}
}

async function openCorrectTicket(c){
 try{
  c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),all=loadTickets();
  all[f.k]={...f.old,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);
  const u=URL.createObjectURL(new Blob([f.rec.blob],{type:f.type}));
  window.open(u+'#page='+(f.idx+1)+'&zoom=page-width','_blank');setTimeout(()=>URL.revokeObjectURL(u),300000);
 }catch(e){console.error(e);alert('Open Ticket failed: '+(e.message||e))}
}

/* Override the EXCELLENT handlers without changing its UI. */
document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const id=b.id||'',t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(id==='readTicket'||t==='read seat details'||t==='read ticket'||t.includes('read seat')){e.preventDefault();e.stopImmediatePropagation();readTicket(selected);return}if(id==='openPdf'||t==='open ticket'){e.preventDefault();e.stopImmediatePropagation();openCorrectTicket(selected)}},true);

/* Keep the seating-plan API harmlessly available on the EXCELLENT UI. */
let active={};function setTicket(t){if(t)active=t;const l=document.getElementById('seatLabel');if(l)l.textContent=[active.door&&'Door '+active.door,active.section,active.row&&'Row '+active.row,active.seat&&'Seat '+active.seat].filter(Boolean).join(' · ')}
window.RAHSeatMap={mapRevision:'EXCELLENT-HISTORICAL-TICKET-RESTORE',install:setTicket,setTicket,renderMarker:function(){setTicket(active)},closeCorrectionUI:function(){},locate:function(){return null}};
window.RAHTicketRepair={readTicket,openCorrectTicket,selectStoredPage,historicalSeat};
})();