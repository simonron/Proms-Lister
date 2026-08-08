/* Royal Albert Hall interactive seating-plan + Safari calendar support.
   Coordinates are percentages of rah-seating-plan.jpg.
   User corrections are stored locally and override/interpolate the estimated map. */
(function(){
'use strict';

const CORR_KEY='rahSeatCorrectionsV1';
const BASE={
  'O|1|114':{x:61.8,y:36.8,kind:'mapped'}, 'O|1|112':{x:62.0,y:38.3,kind:'mapped'},
  'O|1|110':{x:62.2,y:39.8,kind:'mapped'}, 'O|1|108':{x:62.5,y:41.3,kind:'mapped'},
  'O|1|106':{x:62.8,y:43.0,kind:'mapped'}, 'O|1|105':{x:63.0,y:44.6,kind:'mapped'},
  'O|1|104':{x:63.1,y:45.3,kind:'mapped'}, 'O|1|103':{x:63.2,y:46.1,kind:'mapped'},
  'O|1|102':{x:63.3,y:46.9,kind:'mapped'}, 'O|1|101':{x:63.4,y:47.7,kind:'mapped'},
  'O|1|100':{x:63.5,y:48.5,kind:'mapped'}, 'O|1|99':{x:63.6,y:49.3,kind:'mapped'},
  'O|1|98':{x:63.7,y:50.1,kind:'mapped'}
};

/* Approximate hall geometry.  These are deliberately labelled estimated until corrected. */
const MODELS={
 A:{area:'Stalls',cx:38.0,cy:48.0,angle:178,rowMax:28,seat0:1,seatMin:1,seatMax:70,rowDx:-.08,rowDy:.83,seatDx:.42,seatDy:.02},
 B:{area:'Stalls',cx:44.5,cy:49.0,angle:180,rowMax:30,seat0:1,seatMin:1,seatMax:80,rowDx:0,rowDy:.82,seatDx:.37,seatDy:0},
 C:{area:'Stalls',cx:50.0,cy:50.0,angle:180,rowMax:32,seat0:1,seatMin:1,seatMax:90,rowDx:0,rowDy:.80,seatDx:.35,seatDy:0},
 D:{area:'Stalls',cx:55.5,cy:49.0,angle:0,rowMax:30,seat0:1,seatMin:1,seatMax:90,rowDx:0,rowDy:.82,seatDx:.37,seatDy:0},
 E:{area:'Stalls',cx:61.0,cy:48.0,angle:2,rowMax:28,seat0:1,seatMin:1,seatMax:100,rowDx:.08,rowDy:.83,seatDx:.42,seatDy:.02},
 F:{area:'Stalls',cx:66.0,cy:45.0,angle:-12,rowMax:24,seat0:1,seatMin:1,seatMax:120,rowDx:.25,rowDy:.82,seatDx:.41,seatDy:-.08},
 G:{area:'Stalls',cx:35.5,cy:38.5,angle:150,rowMax:16,seat0:1,seatMin:1,seatMax:35,rowDx:-.75,rowDy:.45,seatDx:-.38,seatDy:.22},
 H:{area:'Stalls',cx:31.5,cy:51.0,angle:178,rowMax:18,seat0:31,seatMin:1,seatMax:70,rowDx:-.85,rowDy:.04,seatDx:-.42,seatDy:.02},
 J:{area:'Stalls',cx:36.5,cy:67.0,angle:208,rowMax:18,seat0:45,seatMin:20,seatMax:90,rowDx:-.58,rowDy:.64,seatDx:-.35,seatDy:-.18},
 K:{area:'Stalls',cx:49.5,cy:73.0,angle:180,rowMax:18,seat0:56,seatMin:25,seatMax:95,rowDx:0,rowDy:.78,seatDx:-.36,seatDy:0},
 L:{area:'Stalls',cx:62.5,cy:67.0,angle:-28,rowMax:18,seat0:68,seatMin:35,seatMax:120,rowDx:.58,rowDy:.64,seatDx:.35,seatDy:-.18},
 M:{area:'Stalls',cx:69.0,cy:51.0,angle:2,rowMax:18,seat0:88,seatMin:55,seatMax:150,rowDx:.85,rowDy:.04,seatDx:.42,seatDy:.02},
 O:{area:'Stalls',cx:63.0,cy:44.6,angle:-82,rowMax:18,seat0:105,seatMin:70,seatMax:170,rowDx:1.05,rowDy:.20,seatDx:.10,seatDy:.80},
 P:{area:'Circle',cx:13.0,cy:42.0,rowMax:12,seat0:1,seatMin:1,seatMax:80,rowDx:-.65,rowDy:.25,seatDx:-.12,seatDy:.42},
 Q:{area:'Circle',cx:10.0,cy:52.0,rowMax:12,seat0:1,seatMin:1,seatMax:90,rowDx:-.65,rowDy:.05,seatDx:-.05,seatDy:.38},
 R:{area:'Circle',cx:13.0,cy:64.0,rowMax:12,seat0:1,seatMin:1,seatMax:90,rowDx:-.55,rowDy:.35,seatDx:.12,seatDy:.38},
 S:{area:'Circle',cx:22.0,cy:76.0,rowMax:12,seat0:1,seatMin:1,seatMax:100,rowDx:-.32,rowDy:.55,seatDx:.30,seatDy:.25},
 T:{area:'Circle',cx:38.0,cy:85.0,rowMax:12,seat0:1,seatMin:1,seatMax:110,rowDx:-.05,rowDy:.65,seatDx:.34,seatDy:.08},
 U:{area:'Circle',cx:55.0,cy:86.0,rowMax:12,seat0:1,seatMin:1,seatMax:110,rowDx:.05,rowDy:.65,seatDx:.34,seatDy:-.08},
 V:{area:'Circle',cx:72.0,cy:76.0,rowMax:12,seat0:1,seatMin:1,seatMax:100,rowDx:.32,rowDy:.55,seatDx:.30,seatDy:-.25},
 W:{area:'Circle',cx:86.0,cy:64.0,rowMax:12,seat0:1,seatMin:1,seatMax:90,rowDx:.55,rowDy:.35,seatDx:.12,seatDy:-.38},
 X:{area:'Circle',cx:90.0,cy:52.0,rowMax:12,seat0:1,seatMin:1,seatMax:90,rowDx:.65,rowDy:.05,seatDx:-.05,seatDy:-.38},
 Y:{area:'Circle',cx:87.0,cy:42.0,rowMax:12,seat0:1,seatMin:1,seatMax:80,rowDx:.65,rowDy:.25,seatDx:-.12,seatDy:-.42},
 EC:{area:'East Choir',cx:22.0,cy:24.0,rowMax:10,seat0:1,seatMin:1,seatMax:80,rowDx:-.35,rowDy:-.45,seatDx:.32,seatDy:-.10},
 WC:{area:'West Choir',cx:78.0,cy:24.0,rowMax:10,seat0:1,seatMin:1,seatMax:80,rowDx:.35,rowDy:-.45,seatDx:-.32,seatDy:-.10}
};

function loadCorrections(){try{return JSON.parse(localStorage.getItem(CORR_KEY)||'{}')}catch{return {}}}
function saveCorrections(v){localStorage.setItem(CORR_KEY,JSON.stringify(v));}
function cleanSection(v){let s=String(v||'').toUpperCase();if(/EAST\s*CHOIR/.test(s))return'EC';if(/WEST\s*CHOIR/.test(s))return'WC';return s.replace(/STALLS|SECTION|ARENA|CIRCLE|GALLERY|GRAND TIER|SECOND TIER|LOGGIA|BOX/g,'').replace(/[^A-Z]/g,'').trim();}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?Number(m[0]):NaN;}
function keyOf(p){return cleanSection(p.section||p.area)+'|'+num(p.row)+'|'+num(p.seat);}
function allAnchors(){const c=loadCorrections(),out={...BASE};for(const [k,v] of Object.entries(c))out[k]={...v,kind:'corrected'};return out;}
function generatedPoints(){const pts=[];for(const [section,m] of Object.entries(MODELS)){for(let row=1;row<=m.rowMax;row++){for(let seat=m.seatMin;seat<=m.seatMax;seat++){const ds=seat-m.seat0,dr=row-1,x=m.cx+ds*m.seatDx+dr*m.rowDx,y=m.cy+ds*m.seatDy+dr*m.rowDy;if(x>=3&&x<=97&&y>=8&&y<=94)pts.push({section,row,seat,x,y,area:m.area,kind:'estimated'});}}}return pts;}
let GENERATED=null;function generated(){return GENERATED||(GENERATED=generatedPoints());}
function anchorPoints(){return Object.entries(allAnchors()).map(([k,v])=>{const [section,row,seat]=k.split('|');return {section,row:Number(row),seat:Number(seat),x:v.x,y:v.y,door:v.door||'',area:v.area||MODELS[section]?.area||'',kind:v.kind||'mapped'};});}
function nearest(x,y){let best=null,bd=Infinity;for(const p of [...anchorPoints(),...generated()]){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}}return best?{...best,distance:bd}:null;}
function pct(ev,img){const r=img.getBoundingClientRect();return {x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height};}
function seatText(p){if(!p)return'No seat identified';const model=MODELS[p.section],area=p.area||model?.area||'Section';const section=(p.section==='EC'?'East Choir':p.section==='WC'?'West Choir':(area==='Stalls'?'Stalls ':'')+p.section);return [p.door&&'Door '+p.door,section,'Row '+p.row,'Seat '+p.seat,p.kind==='corrected'?'corrected':p.kind==='mapped'?'mapped':'estimated'].filter(Boolean).join(' · ');}

/* Tolerant natural-language seat parser.  This is local/private and does not send text away. */
function parseSeatInput(text){
 const raw=String(text||'').trim(),u=raw.toUpperCase();if(!raw)return null;
 let door=(u.match(/\bDOOR\s*[:#-]?\s*([A-Z0-9]+)/)||[])[1]||'';
 let row=(u.match(/\bROW\s*[:#-]?\s*([A-Z0-9]+)/)||[])[1]||'';
 let seat=(u.match(/\bSEAT(?:S)?\s*[:#-]?\s*(\d+)/)||[])[1]||'';
 let section='';
 if(/EAST\s*CHOIR/.test(u))section='EC';else if(/WEST\s*CHOIR/.test(u))section='WC';
 else {const m=u.match(/\b(?:STALLS|SECTION|CIRCLE|GALLERY|BOX)?\s*([A-Y])\b/);if(m)section=m[1];}
 const nums=(u.match(/\b\d+\b/g)||[]).map(Number);
 const letters=(u.match(/\b[A-Y]\b/g)||[]);
 if(!section&&letters.length)section=letters[0];
 if(!row||!seat){
   const compact=u.replace(/[,.;/|]+/g,' ').split(/\s+/).filter(Boolean);
   const simple=compact.filter(x=>/^[A-Z]$|^\d+$/.test(x));
   if(simple.length>=3){const li=simple.findIndex(x=>/^[A-Y]$/.test(x));if(li>=0){section=section||simple[li];const after=simple.slice(li+1).filter(x=>/^\d+$/.test(x));if(!row&&after[0])row=after[0];if(!seat&&after[1])seat=after[1];const before=simple.slice(0,li).filter(x=>/^\d+$/.test(x));if(!door&&before.length)door=before[before.length-1];}}
 }
 if(!seat&&nums.length)seat=String(nums[nums.length-1]);if(!row&&nums.length>=2)row=String(nums[nums.length-2]);
 if(!section||!row||!seat)return null;
 const s=cleanSection(section);return {door,section:s,area:MODELS[s]?.area||(/CHOIR/.test(u)?'Choir':''),row:String(row),seat:String(seat),raw};
}

function locate(ticket){const k=keyOf(ticket),anchors=allAnchors();if(anchors[k]){const [section,row,seat]=k.split('|');return{section,row:Number(row),seat:Number(seat),...anchors[k]};}const s=cleanSection(ticket&&(ticket.section||ticket.area)),r=num(ticket&&ticket.row),n=num(ticket&&ticket.seat);const p=generated().find(q=>q.section===s&&q.row===r&&q.seat===n);return p||null;}

function exportCorrections(){const blob=new Blob([JSON.stringify({format:'rah-seat-corrections-v1',savedAt:new Date().toISOString(),corrections:loadCorrections()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RAH-seat-corrections.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);}
function importCorrections(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=async()=>{try{const d=JSON.parse(await i.files[0].text()),c=d.corrections||d;if(c&&typeof c==='object'){saveCorrections({...loadCorrections(),...c});alert('Seat corrections imported.');}}catch(e){alert('Could not import corrections: '+e.message)}};i.click();}

let pendingCorrection=null,lastCorrectionKey='';
function beginCorrection(){const current=(()=>{try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function'){const t=ticketFor(selected)||{};return [t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(', ');}}catch(e){}return'';})();const text=prompt('Enter the seat details in any form, for example:\nDoor 9, Stalls O, Row 7, Seat 141\nor simply: 9 O 7 141',current);if(text===null)return;const p=parseSeatInput(text);if(!p){alert('I could not determine Section, Row and Seat. Try e.g. “Stalls O Row 7 Seat 141”.');return;}pendingCorrection=p;const fixed=document.getElementById('rahHoverFixed');if(fixed)fixed.textContent='Correction mode: click the exact position for '+seatText({...p,kind:'corrected'});}
function applyCorrection(ev,img){if(!pendingCorrection)return false;const q=pct(ev,img),k=keyOf(pendingCorrection),c=loadCorrections();c[k]={x:q.x,y:q.y,door:pendingCorrection.door||'',area:pendingCorrection.area||'',source:pendingCorrection.raw,savedAt:Date.now()};saveCorrections(c);lastCorrectionKey=k;GENERATED=null;const what=seatText({...pendingCorrection,kind:'corrected'});pendingCorrection=null;alert(what+' saved at the clicked position. This correction now overrides the estimated map.');updateTicketMarker();return true;}
function undoLastCorrection(){if(!lastCorrectionKey){alert('No correction has been made in this session.');return;}const c=loadCorrections();delete c[lastCorrectionKey];saveCorrections(c);lastCorrectionKey='';alert('Last correction removed.');updateTicketMarker();}

function install(){
 const modal=document.getElementById('rahPlanModal'),img=document.getElementById('rahImg');if(!modal||!img)return;
 img.style.cursor='crosshair';img.style.filter='brightness(1.28) contrast(1.08)';
 const host=document.getElementById('pi')||img.parentElement;if(!host)return;
 const toolbar=modal.firstElementChild;
 if(toolbar&&!document.getElementById('rahCorrect')){
   const b=document.createElement('button');b.id='rahCorrect';b.textContent='Correct seat';b.onclick=beginCorrection;toolbar.appendChild(b);
   const u=document.createElement('button');u.id='rahUndo';u.textContent='Undo correction';u.onclick=undoLastCorrection;toolbar.appendChild(u);
   const ex=document.createElement('button');ex.id='rahExportCorr';ex.textContent='Export corrections';ex.onclick=exportCorrections;toolbar.appendChild(ex);
   const im=document.createElement('button');im.id='rahImportCorr';im.textContent='Import corrections';im.onclick=importCorrections;toolbar.appendChild(im);
 }
 if(!document.getElementById('rahHoverReadout')){const read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.90);color:white;padding:7px 10px;border-radius:6px;font:13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap;box-shadow:0 2px 8px #0008';document.body.appendChild(read);}
 if(!document.getElementById('rahHoverFixed')){const fixed=document.createElement('div');fixed.id='rahHoverFixed';fixed.style.cssText='position:absolute;left:8px;top:8px;z-index:25;pointer-events:none;background:rgba(255,255,255,.95);color:#111;padding:6px 9px;border-radius:6px;font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 1px 5px #0004';fixed.textContent='Move over the plan to identify the nearest seat';host.appendChild(fixed);}
 if(!document.getElementById('rahHoverMark')){const cross=document.createElement('div');cross.id='rahHoverMark';cross.style.cssText='display:none;position:absolute;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #007aff;background:rgba(255,255,255,.8);pointer-events:none;z-index:20';host.appendChild(cross);}
 if(img.dataset.hoverSeats==='1')return;img.dataset.hoverSeats='1';
 const move=ev=>{const q=pct(ev,img),n=nearest(q.x,q.y),read=document.getElementById('rahHoverReadout'),fixed=document.getElementById('rahHoverFixed'),cross=document.getElementById('rahHoverMark');const text=pendingCorrection?'Correction mode: click exact position for '+seatText({...pendingCorrection,kind:'corrected'}):(n&&n.distance<3.5?seatText(n):'No seat confidently identified here');if(read){read.style.display='block';read.style.left=Math.min(window.innerWidth-330,ev.clientX+14)+'px';read.style.top=Math.min(window.innerHeight-45,ev.clientY+14)+'px';read.textContent=text;}if(fixed)fixed.textContent=text;if(cross&&n&&n.distance<3.5){cross.style.display='block';cross.style.left=n.x+'%';cross.style.top=n.y+'%';}else if(cross)cross.style.display='none';};
 img.addEventListener('pointermove',move);img.addEventListener('mousemove',move);img.addEventListener('click',ev=>{if(applyCorrection(ev,img)){ev.preventDefault();ev.stopPropagation();}});img.addEventListener('mouseleave',()=>{const r=document.getElementById('rahHoverReadout'),c=document.getElementById('rahHoverMark'),f=document.getElementById('rahHoverFixed');if(r)r.style.display='none';if(c)c.style.display='none';if(f&&!pendingCorrection)f.textContent='Move over the plan to identify the nearest seat';});
}

function updateTicketMarker(){const modal=document.getElementById('rahPlanModal');if(!modal||modal.style.display==='none')return;let ticket={};try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')ticket=ticketFor(selected)||{};}catch(e){}const p=locate(ticket),mark=document.getElementById('seatMark'),label=document.getElementById('seatLabel');if(!p){if(mark)mark.style.display='none';return;}if(mark){mark.style.display='block';mark.style.left=p.x+'%';mark.style.top=p.y+'%';}if(label)label.textContent=[ticket.door&&'Door '+ticket.door,ticket.section||ticket.area,ticket.row&&'Row '+ticket.row,ticket.seat&&'Seat '+ticket.seat,p.kind==='corrected'?'corrected position':p.kind==='mapped'?'mapped position':'estimated position'].filter(Boolean).join(' · ');}

/* ----- Safari / standards-based Calendar support ----- */
function escICS(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function dtICS(date,time){let h=19,m=30;const x=String(time||'').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);if(x){h=Number(x[1]);m=Number(x[2]||0);if(/pm/i.test(x[3]||'')&&h<12)h+=12;if(/am/i.test(x[3]||'')&&h===12)h=0;}return String(date||'').replace(/-/g,'')+'T'+String(h).padStart(2,'0')+String(m).padStart(2,'0')+'00';}
function selectedRecords(){try{const all=loadTickets();return concerts.filter(c=>{const t=all[keyFor(c)]||{};return t.myProm||t.hasTicket;}).map(c=>({c,t:all[keyFor(c)]||{}}));}catch(e){return[];}}
function recordDescription(c,t){return ['BBC '+(typeof promLabel==='function'?promLabel(c):'Prom'),'Door: '+(t.door||''),'Section: '+(t.section||t.area||''),'Row: '+(t.row||''),'Seat: '+(t.seat||''),'Reference: '+(t.reference||''),'',c.programme||'','',c.performers||'','',t.notes||''].join('\n');}
function downloadICS(){const rows=selectedRecords();if(!rows.length){alert('Mark at least one concert as My Prom or attach a ticket first.');return;}const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Proms Lister//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];for(const {c,t} of rows){const start=dtICS(c.date,c.time),end=start.slice(0,9)+String(Math.min(23,Number(start.slice(9,11))+3)).padStart(2,'0')+start.slice(11);lines.push('BEGIN:VEVENT','UID:'+escICS(keyFor(c))+'@proms-lister','DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+escICS((typeof promLabel==='function'?promLabel(c)+' — ':'')+(c.title||'Prom')),'LOCATION:'+escICS([c.venue||'Royal Albert Hall',t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ')),'DESCRIPTION:'+escICS(recordDescription(c,t)),'END:VEVENT');}lines.push('END:VCALENDAR');const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Proms-Lister.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);}
async function downloadSafariSyncZip(){if(typeof JSZip==='undefined'){downloadICS();return;}const rows=selectedRecords();if(!rows.length){alert('Mark at least one concert as My Prom or attach a ticket first.');return;}const zip=new JSZip(),records=[];for(const {c,t} of rows){let ticketFile='';if(t.pdfName&&typeof pdfGet==='function'){try{const rec=await pdfGet(keyFor(c));if(rec){const fn=(typeof safeTicketName==='function'?safeTicketName(c,t):('Prom_'+(typeof promNumber==='function'?promNumber(c):'')+'_'+rec.name)).replace(/[^A-Za-z0-9._-]+/g,'_');zip.file('Tickets/'+fn,rec.blob);ticketFile='Tickets/'+fn;}}catch(e){console.warn(e)}}let r;if(typeof calendarRecord==='function')r=calendarRecord(c,t,ticketFile);else r={id:keyFor(c),promNumber:typeof promNumber==='function'?promNumber(c):'',title:c.title,date:c.date,time:c.time,venue:c.venue,programme:c.programme,performers:c.performers,broadcast:c.broadcast,price:c.price,myProm:!!t.myProm,hasTicket:!!t.hasTicket,area:t.area,section:t.section,row:t.row,seat:t.seat,door:t.door,reference:t.reference,ticketFile,notes:t.notes};records.push(r);}zip.file('PromsCalendarSync.json',JSON.stringify({format:'proms-calendar-sync-v2',generatedAt:new Date().toISOString(),records},null,2));const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PromsCalendarSync.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);alert('Safari calendar package downloaded. The Mac helper can import this ZIP from Downloads on its next run.');}
function isSafari(){return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);}
function addCalendarUI(){const menu=document.querySelector('#homePage .home-menu');if(!menu)return;if(!document.getElementById('safariCalendarExport')){const b=document.createElement('button');b.id='safariCalendarExport';b.className='home-button';b.innerHTML='Calendar export / Safari<small>Download a Mac-helper ZIP, or an .ics file for direct Calendar import</small>';b.onclick=()=>{const choice=confirm('OK: download the full Mac-helper ZIP (includes ticket PDFs).\nCancel: download a standard .ics Calendar file.');if(choice)downloadSafariSyncZip();else downloadICS();};menu.appendChild(b);}const hc=document.getElementById('homeCalendar');if(hc&&isSafari()&&!hc.dataset.safari){hc.dataset.safari='1';hc.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();downloadSafariSyncZip();},true);hc.querySelector('small')&&(hc.querySelector('small').textContent='Safari: download a sync package for the Mac helper');}}

function tick(){install();updateTicketMarker();addCalendarUI();}
const observer=new MutationObserver(tick);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();setInterval(tick,900);
window.RAHSeatMap={parseSeatInput,loadCorrections,nearest,locate,install,beginCorrection,exportCorrections,importCorrections};
window.PromsCalendarSafari={downloadICS,downloadSafariSyncZip};
})();
