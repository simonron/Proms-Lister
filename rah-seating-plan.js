/* EXCELLENT baseline: proven ticket selection/read path with strict RAH field parsing. */
(function(){'use strict';
const PUSH_LABEL='10 Aug 2026 15:00 BST';
function addPushLabel(){let f=document.querySelector('.home-footer');if(!f)return;let x=document.getElementById('lastPushLabel');if(!x){x=document.createElement('div');x.id='lastPushLabel';x.style.cssText='margin-top:8px;font-weight:800;color:#6e1f26';f.appendChild(x)}x.textContent='Last push: '+PUSH_LABEL}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPushLabel);else addPushLabel();
window.bestTicketPage=function(c,pages,savedPage){const saved=Number(savedPage||0)-1;let best=0,bestScore=-Infinity;for(let i=0;i<pages.length;i++){const q=ticketPageScore(c,pages[i]);if(q>bestScore||(q===bestScore&&i===saved)){bestScore=q;best=i}}return best};
function historicalSeat(text){
 const s=String(text||'').replace(/\s+/g,' ').trim();
 const door=(s.match(/\bDoor\s*[:#-]?\s*(\d{1,3})\b/i)||[])[1]||'';
 const row=(s.match(/\bRow\s*[:#-]?\s*([A-Z0-9]{1,4})\b/i)||[])[1]||'';
 const seat=(s.match(/\bSeat(?:s)?\s*[:#-]?\s*(\d{1,4})\b/i)||[])[1]||'';
 let section='',m;
 const candidates=[
  /\b(Stalls\s+[A-Z]{1,2})\b/i,/\b(Rausing Circle\s+[A-Z]{1,2})\b/i,/\b(Circle\s+[A-Z]{1,2})\b/i,
  /\b(Gallery\s+[A-Z]{1,2})\b/i,/\b(Choir\s+[A-Z]{1,2})\b/i,/\b(Grand Tier\s+[A-Z0-9]{1,4})\b/i,
  /\b(Second Tier\s+[A-Z0-9]{1,4})\b/i,/\b(Loggia\s+[A-Z0-9]{1,4})\b/i,
  /\bBox\s*(?:No\.?|Number|:)\s*([A-Z0-9]{1,4})\b/i,/\bArena\b/i
 ];
 for(const re of candidates){m=s.match(re);if(!m)continue;if(/^box/i.test(m[0]))section='Box '+m[1];else section=m[1]||m[0];break}
 if(!section){m=s.match(/\bSection\s*[:#-]?\s*(Stalls\s+[A-Z]{1,2}|[A-Z]{1,2})\b/i);if(m)section=/^stalls/i.test(m[1])?m[1]:'Stalls '+m[1]}
 section=String(section||'').replace(/\s+/g,' ').trim();
 if(/^box\s+box$/i.test(section)||/^box$/i.test(section))section='';
 return {door,section,row,seat};
}
async function selectStoredPage(c){const k=keyFor(c),rec=await pdfGet(k);if(!rec||!rec.blob)throw Error('No attached ticket file is stored for this Prom.');const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream';const pages=(type==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf'))?await pdfPages(rec.blob):[await imageText(rec.blob)];if(!pages.length)throw Error('The ticket file contains no readable pages.');const old=loadTickets()[k]||{},idx=window.bestTicketPage(c,pages,old.ticketPage);return{k,rec,type,pages,idx,page:pages[idx],old}}
async function readTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),parsed=historicalSeat(f.page);if(!parsed.section&&!parsed.row&&!parsed.seat&&!parsed.door){const legacy=parseTicket(f.page);if(legacy.door&&/^\d+$/.test(String(legacy.door)))parsed.door=legacy.door;if(legacy.row&&/^[A-Z0-9]{1,4}$/i.test(String(legacy.row)))parsed.row=legacy.row;if(legacy.seat&&/^\d{1,4}$/.test(String(legacy.seat)))parsed.seat=legacy.seat;if(legacy.section&&!/^box(?:\s+box)?$/i.test(String(legacy.section).trim()))parsed.section=legacy.section}if(!parsed.door&&!parsed.section&&!parsed.row&&!parsed.seat)throw Error('Ticket page selected, but no valid Door / Section / Row / Seat fields were found.');const all=loadTickets(),t=all[f.k]={...f.old,...parsed,hasTicket:true,pdfName:f.old.pdfName||f.rec.name,fileType:f.old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);render();openDetail(c);if(window.RAHSeatMap&&window.RAHSeatMap.setTicket)window.RAHSeatMap.setTicket(t);if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile();alert('Ticket read: '+[parsed.door&&'Door '+parsed.door,parsed.section,parsed.row&&'Row '+parsed.row,parsed.seat&&'Seat '+parsed.seat].filter(Boolean).join(' · '))}catch(e){console.error(e);alert('Read Seat Details failed: '+(e.message||e))}}
async function openCorrectTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),all=loadTickets();all[f.k]={...f.old,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);const u=URL.createObjectURL(new Blob([f.rec.blob],{type:f.type}));window.open(u+'#page='+(f.idx+1)+'&zoom=page-width','_blank');setTimeout(()=>URL.revokeObjectURL(u),300000)}catch(e){console.error(e);alert('Open Ticket failed: '+(e.message||e))}}
document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const id=b.id||'',t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(id==='readTicket'||t==='read seat details'||t==='read ticket'||t.includes('read seat')){e.preventDefault();e.stopImmediatePropagation();readTicket(selected);return}if(id==='openPdf'||t==='open ticket'){e.preventDefault();e.stopImmediatePropagation();openCorrectTicket(selected)}},true);
let active={};function setTicket(t){if(t)active=t;const l=document.getElementById('seatLabel');if(l)l.textContent=[active.door&&'Door '+active.door,active.section,active.row&&'Row '+active.row,active.seat&&'Seat '+active.seat].filter(Boolean).join(' · ')}
window.RAHSeatMap={mapRevision:'EXCELLENT-HISTORICAL-TICKET-RESTORE',install:setTicket,setTicket,renderMarker:function(){setTicket(active)},closeCorrectionUI:function(){},locate:function(){return null}};window.RAHTicketRepair={readTicket,openCorrectTicket,selectStoredPage,historicalSeat};})();