/* Proms Lister live fix.
   The known-good page selector in ticket-history.js is left unchanged.
   All ticket detail reading here starts from the stored PDF Blob and the selected PDF page. */
(function(){
 const readInFlight=new Set();
 const previousParse=window.parseTicket;
 const previousOpenDetail=window.openDetail;

 function pageText(page){return (typeof page==='string'?page:(page&&page.text)||'').replace(/\s+/g,' ').trim()}

 window.parseTicket=function(page){
  const base=typeof previousParse==='function'?previousParse(page):{};
  const text=pageText(page);
  let door='',section='',row='',seat='',reference='';

  // RAH ticket text commonly flattens to:
  // Henry Wood Promenade Concerts 9 Mr Simon Anthony Stalls O ... 1 105 143446017 Fri, 07 Aug 2026
  let m=text.match(/Henry Wood Promenade Concerts\s+(\d{1,2})\s+(?:Mr|Mrs|Ms|Miss|Dr)\b[\s\S]{0,140}?\b(Stalls|Rausing Circle|Circle|Gallery|Arena|Choir|Grand Tier|Second Tier|Loggia|Box)\s+([A-Z]{1,2})\b/i);
  if(m){door=m[1];section=m[2]+' '+m[3].toUpperCase()}

  const order=text.match(/\b(\d{9})\s+(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)/i)||text.match(/\b(\d{9})\b/);
  if(order){
   reference=order[1];
   const before=text.slice(0,order.index);
   const nums=[...before.matchAll(/\b(\d{1,3})\b/g)].map(x=>x[1]);
   for(let i=nums.length-2;i>=0;i--){
    const r=+nums[i],s=+nums[i+1];
    if(r>=1&&r<=99&&s>=1&&s<=999){row=nums[i];seat=nums[i+1];break}
   }
  }
  if(!section){const s=text.match(/\b(Stalls|Rausing Circle|Circle|Gallery|Arena|Choir|Grand Tier|Second Tier|Loggia|Box)\s+([A-Z]{1,2})\b/i);if(s)section=s[1]+' '+s[2].toUpperCase()}
  if(!door){const d=text.match(/Henry Wood Promenade Concerts\s+(\d{1,2})\b/i);if(d)door=d[1]}

  const result={...base};
  if(door)result.door=door;if(section)result.section=section;if(row)result.row=row;if(seat)result.seat=seat;if(reference)result.reference=reference;
  console.info('RAH PDF parser:',{door:result.door,section:result.section,row:result.row,seat:result.seat,reference:result.reference});
  return result;
 };

 async function readSelectedPdf(c,force=false){
  const k=keyFor(c);
  if(readInFlight.has(k))return ticketFor(c);
  const rec=await pdfGet(k);
  if(!rec)throw new Error('No ticket PDF is attached to this Prom.');
  const type=rec.blob.type||mimeForName(rec.name)||'';
  if(type!=='application/pdf'&&!String(rec.name||'').toLowerCase().endsWith('.pdf'))throw new Error('The attached ticket is not a PDF.');
  readInFlight.add(k);
  try{
   // This is the crucial data path: IndexedDB PDF Blob -> PDF.js -> selected page -> parser.
   const pages=await pdfPages(rec.blob),old=ticketFor(c)||{};
   const idx=bestTicketPage(c,pages,old.ticketPage||0);
   const selectedPage=pages[idx];
   const parsed=window.parseTicket(selectedPage);
   console.info('READING STORED PDF, selected page',idx+1,'text:',pageText(selectedPage),'parsed:',parsed);
   const all=loadTickets();
   all[k]={...(all[k]||{}),...parsed,hasTicket:true,ticketPage:idx+1,updatedAt:Date.now()};
   saveTickets(all);
   render();
   try{await writeCalendarSyncFile()}catch(e){console.warn('Calendar sync skipped after ticket read',e)}
   return all[k];
  }finally{readInFlight.delete(k)}
 }
 window.readSelectedTicketPdf=readSelectedPdf;

 function showPlan(c){
  const t=ticketFor(c);let m=document.getElementById('rahPlanModal');
  if(!m){
   m=document.createElement('div');m.id='rahPlanModal';m.style='position:fixed;inset:0;background:#222e;z-index:99999;display:flex;flex-direction:column';
   m.innerHTML='<div style="background:white;padding:8px;display:flex;gap:8px;align-items:center"><strong style="flex:1">Royal Albert Hall seating plan</strong><button id="zp">＋</button><button id="zm">−</button><button id="zr">Reset</button><button id="pc">Close</button></div><div id="pv" style="flex:1;overflow:auto;text-align:center;position:relative"><div id="pi" style="position:relative;display:inline-block;transform-origin:top left"><img id="rahImg" src="./rah-seating-plan2.jpeg" width="1346" height="1536" style="display:block;max-width:none;width:1346px;height:1536px"></div></div><div id="seatLabel" style="background:white;padding:8px;text-align:center"></div>';
   document.body.appendChild(m);m._z=1;const apply=()=>m.querySelector('#pi').style.transform='scale('+m._z+')';
   m.querySelector('#zp').onclick=()=>{m._z=Math.min(6,m._z+.25);apply()};m.querySelector('#zm').onclick=()=>{m._z=Math.max(.25,m._z-.25);apply()};m.querySelector('#zr').onclick=()=>{m._z=1;apply()};m.querySelector('#pc').onclick=()=>m.style.display='none';
  }
  m.style.display='flex';
  setTimeout(()=>{if(window.RAHSeatMap){window.RAHSeatMap.install(t);window.RAHSeatMap.setTicket(t);window.RAHSeatMap.renderMarker()}},0);
 }

 window.openDetail=function(c){
  previousOpenDetail(c);
  // Remove the two unwanted note shortcuts.
  document.querySelectorAll('#detail button.quick').forEach(b=>b.remove());

  // Replace the dead external RAH link with our internal plan.
  const links=[...document.querySelectorAll('#detail a.btn')];
  const dead=links.find(a=>(a.textContent||'').trim()==='RAH seating plan');
  if(dead){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent='RAH seating plan';b.onclick=()=>showPlan(c);dead.replaceWith(b)}

  // The historical "Copy seat details" control is now a PDF diagnostic/read button,
  // never a reader of DOM/form text.
  const copy=document.getElementById('copySeat');
  if(copy){
   copy.textContent='Read Seat Details from PDF';
   copy.onclick=async()=>{try{const t=await readSelectedPdf(c,true);if(selected&&keyFor(selected)===keyFor(c))window.openDetail(c);const vals=[t.door&&'Door '+t.door,t.section&&'Section '+t.section,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');if(!vals)alert('The selected PDF page was read, but no seat details were recognised.')}catch(e){console.error(e);alert('Ticket PDF read failed: '+e.message)}};
  }

  // Automatically read existing attached PDFs when the seat fields are incomplete.
  const t=ticketFor(c);
  if(t.pdfName&&(!t.section||!t.row||!t.seat||!t.door)){
   readSelectedPdf(c).then(()=>{if(selected&&keyFor(selected)===keyFor(c))window.openDetail(c)}).catch(e=>console.warn('Automatic ticket PDF read failed',e));
  }
 };

 // Stop stale File System Access API handles throwing createWritable errors.
 const oldWrite=window.writeCalendarSyncFile;
 window.writeCalendarSyncFile=async function(){
  try{
   if(typeof calendarSyncHandle!=='undefined'&&calendarSyncHandle&&typeof calendarSyncHandle.createWritable!=='function'){
    calendarSyncHandle=null;try{await settingPut('calendarSyncHandle',null)}catch(_){};if(typeof setCalendarStatus==='function')setCalendarStatus('Mac Calendar sync needs reconnecting.');return;
   }
   return await oldWrite();
  }catch(e){console.warn('Calendar sync unavailable',e);if(typeof setCalendarStatus==='function')setCalendarStatus('Mac Calendar sync needs reconnecting.');}
 };

 console.info('Proms live fix loaded: selected PDF page reader + clean ticket UI + internal RAH plan');
})();
