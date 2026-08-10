/* EXCELLENT baseline. IMPORTANT: bestTicketPage/selectStoredPage below is the known-good long-PDF ticket selection point. Do not replace it while fixing field extraction. */
(function(){'use strict';
const PUSH_LABEL='10 Aug 2026 15:15 BST';
function addPushLabel(){let f=document.querySelector('.home-footer');if(!f)return;let x=document.getElementById('lastPushLabel');if(!x){x=document.createElement('div');x.id='lastPushLabel';x.style.cssText='margin-top:8px;font-weight:800;color:#6e1f26';f.appendChild(x)}x.textContent='Last push: '+PUSH_LABEL}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPushLabel);else addPushLabel();
/* KNOWN GOOD: correctly selects the ticket inside a long multi-ticket PDF as of commit immediately before this one. */
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
 /* RAH PDFs sometimes flatten the four headings first and the four values afterwards. Recover that layout conservatively. */
 if(!door||!row||!seat){
  const block=s.match(/\bDoor\b[\s\S]{0,120}?\b(?:Section|Area)\b[\s\S]{0,120}?\bRow\b[\s\S]{0,120}?\bSeat(?:s)?\b[\s:|·,-]*([0-9]{1,3})\s+(Stalls\s+[A-Z]{1,2}|Rausing Circle\s+[A-Z]{1,2}|Circle\s+[A-Z]{1,2}|Gallery\s+[A-Z]{1,2}|Choir\s+[A-Z]{1,2}|Grand Tier\s+[A-Z0-9]{1,4}|Second Tier\s+[A-Z0-9]{1,4}|Loggia\s+[A-Z0-9]{1,4}|Arena)\s+([A-Z0-9]{1,4})\s+([0-9]{1,4})\b/i);
  if(block){door=door||block[1];section=section||block[2];row=row||block[3];seat=seat||block[4]}
 }
 /* Another common extraction order is Section value followed later by the numeric Door/Row/Seat values. */
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
async function readTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),parsed=historicalSeat(f.page);if(!parsed.door&&!parsed.section&&!parsed.row&&!parsed.seat)throw Error('Correct ticket page selected, but no seat fields were readable.');const all=loadTickets(),t=all[f.k]={...f.old,...parsed,hasTicket:true,pdfName:f.old.pdfName||f.rec.name,fileType:f.old.fileType||f.type,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);render();openDetail(c);if(window.RAHSeatMap&&window.RAHSeatMap.setTicket)window.RAHSeatMap.setTicket(t);if(typeof writeCalendarSyncFile==='function')writeCalendarSyncFile();alert('Ticket read: '+[parsed.door&&'Door '+parsed.door,parsed.section,parsed.row&&'Row '+parsed.row,parsed.seat&&'Seat '+parsed.seat].filter(Boolean).join(' · '))}catch(e){console.error(e);alert('Read Seat Details failed: '+(e.message||e))}}
async function openCorrectTicket(c){try{c=c||selected;if(!c)throw Error('No Prom selected.');const f=await selectStoredPage(c),all=loadTickets();all[f.k]={...f.old,ticketPage:f.idx+1,updatedAt:Date.now()};saveTickets(all);const u=URL.createObjectURL(new Blob([f.rec.blob],{type:f.type}));window.open(u+'#page='+(f.idx+1)+'&zoom=page-width','_blank');setTimeout(()=>URL.revokeObjectURL(u),300000)}catch(e){console.error(e);alert('Open Ticket failed: '+(e.message||e))}}
document.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;const id=b.id||'',t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(id==='readTicket'||t==='read seat details'||t==='read ticket'||t.includes('read seat')){e.preventDefault();e.stopImmediatePropagation();readTicket(selected);return}if(id==='openPdf'||t==='open ticket'){e.preventDefault();e.stopImmediatePropagation();openCorrectTicket(selected)}},true);
let active={};function setTicket(t){if(t)active=t;const l=document.getElementById('seatLabel');if(l)l.textContent=[active.door&&'Door '+active.door,active.section,active.row&&'Row '+active.row,active.seat&&'Seat '+active.seat].filter(Boolean).join(' · ')}
window.RAHSeatMap={mapRevision:'EXCELLENT-KNOWN-GOOD-TICKET-SELECTION',install:setTicket,setTicket,renderMarker:function(){setTicket(active)},closeCorrectionUI:function(){},locate:function(){return null}};window.RAHTicketRepair={readTicket,openCorrectTicket,selectStoredPage,historicalSeat};})();