/* Royal Albert Hall seat map — 1346x1536 map geometry. SCRIPT ONLY. */
(function(){
'use strict';
const MAP_REV='RAH-1346x1536-20260808K',STORE='rahUserSeatCorrections:'+MAP_REV;
const LOOKUP={};
(function(){const row=7,anchorSeat=141,anchorX=72.3221588764,anchorY=31.2775528198,stepX=-0.4065618346,stepY=-0.97884648;for(let seat=84;seat<=153;seat++){const d=seat-anchorSeat;LOOKUP['O|'+row+'|'+seat]={x:anchorX+d*stepX,y:anchorY+d*stepY,section:'O',row,seat,kind:seat===anchorSeat?'image anchor':'same-row indexed'}}})();
let activeTicket={},pending=null;
function sectionCode(v){let s=String(v||'').toUpperCase().trim();s=s.replace(/\b(ROYAL\s+ALBERT\s+HALL|STALLS|CIRCLE|SECTION|ARENA|RAUSING|GALLERY|CHOIR|GRAND\s+TIER|SECOND\s+TIER|LOGGIA|BOX)\b/g,' ').replace(/[^A-Z0-9]+/g,' ').trim();const m=s.match(/\b([A-Z]{1,2})\b/);return m?m[1]:s.replace(/[^A-Z]/g,'')}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function key(s,r,n){return sectionCode(s)+'|'+num(r)+'|'+num(n)}
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return{}}}
function save(c){localStorage.setItem(STORE,JSON.stringify(c))}
function locate(t){const k=key(t&&(t.section||t.area),t&&t.row,t&&t.seat);return load()[k]||LOOKUP[k]||null}
function allPoints(){return Object.values(Object.assign({},LOOKUP,load()))}
function nearest(x,y){let b=null,bd=Infinity;for(const p of allPoints()){const d=(p.x-x)**2+(p.y-y)**2;if(d<bd){bd=d;b=p}}return b?Object.assign({},b,{distance:Math.sqrt(bd)}):null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function field(id){const e=document.getElementById(id);return e&&'value'in e?String(e.value||'').trim():''}
function currentTicket(){const live={door:field('door'),section:field('section'),area:field('area'),row:field('row'),seat:field('seat')};if((live.section||live.area)&&live.row&&live.seat)return live;return activeTicket||{}}
function ensureMarker(host){let m=document.getElementById('rahAutoSeatMark');if(!m){m=document.createElement('div');m.id='rahAutoSeatMark';m.setAttribute('aria-label','Selected seat');m.style.cssText='position:absolute;width:28px;height:28px;border-radius:50%;background:red;border:4px solid white;box-shadow:0 0 0 4px red,0 2px 9px #000;transform:translate(-50%,-50%);z-index:2147483646;pointer-events:none;display:none';host.appendChild(m)}return m}
function labelTicket(t,p){const label=document.getElementById('seatLabel');if(!label)return;const d=[t.door&&'Door '+t.door,(t.section||t.area),t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');label.textContent=d+(p?' — '+p.kind:(d?' — position not yet indexed':''))}
function renderMarker(){const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host)return;const t=currentTicket(),p=locate(t),m=ensureMarker(host);if(p){m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%'}else m.style.display='none';labelTicket(t,p)}
function parseCorrection(s){const u=String(s||'').toUpperCase(),dm=u.match(/DOOR\s*[:#-]?\s*([A-Z0-9]+)/),rm=u.match(/ROW\s*[:#-]?\s*(\d+)/),sm=u.match(/SEAT\w*\s*[:#-]?\s*(\d+)/);let sec='';const xm=u.match(/(?:STALLS|SECTION|CIRCLE)\s*([A-Z]{1,2})\b/);if(xm)sec=xm[1];if(!sec){const m=u.match(/\b([A-Z])\b/);if(m)sec=m[1]}return sec&&rm&&sm?{door:dm?dm[1]:'',section:sec,row:+rm[1],seat:+sm[1]}:null}
function startCorrection(){const t=currentTicket(),def=[t.door&&'Door '+t.door,(t.section||t.area),t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' '),s=prompt('Which seat are you correcting?\nExample: Door 9 Stalls O Row 7 Seat 141',def);if(s===null)return;pending=parseCorrection(s);if(!pending){alert('Please enter Section, Row and Seat, e.g. Stalls O Row 7 Seat 141.');return}const st=document.getElementById('rahCorrectionStatus');if(st)st.textContent='Now click the exact centre of '+pending.section+' · Row '+pending.row+' · Seat '+pending.seat;const img=document.getElementById('rahImg');if(img)img.style.cursor='copy'}
function undo(){const t=currentTicket(),c=load(),k=key(t.section||t.area,t.row,t.seat);if(c[k]){delete c[k];save(c);renderMarker()}}
function addControls(host){let bar=document.getElementById('rahCorrectionBar');if(bar)return;bar=document.createElement('div');bar.id='rahCorrectionBar';bar.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483647;display:flex;gap:7px;align-items:center;max-width:calc(100vw - 36px);padding:8px;background:rgba(255,255,255,.96);border:1px solid #777;border-radius:10px;box-shadow:0 3px 16px rgba(0,0,0,.35);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';[['Correct seat',startCorrection],['Undo',undo]].forEach(([txt,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.style.cssText='padding:9px 13px;border-radius:7px;border:1px solid #444;background:white;color:#111;font-weight:700;white-space:nowrap;cursor:pointer';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});bar.appendChild(b)});const st=document.createElement('span');st.id='rahCorrectionStatus';st.style.cssText='font-size:12px;color:#222;max-width:300px';st.textContent='Correct seat: choose details, then click the seat on the plan';bar.appendChild(st);document.body.appendChild(bar)}
function install(ticket){if(ticket&&Object.keys(ticket).length)activeTicket=ticket;const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host)return;addControls(host);img.style.filter='none';img.style.cursor='crosshair';let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:2147483647;pointer-events:none;background:rgba(0,0,0,.9);color:white;padding:7px 10px;border-radius:6px;font:600 13px sans-serif;white-space:nowrap';document.body.appendChild(read)}if(img.dataset.rahMapRev!==MAP_REV){img.dataset.rahMapRev=MAP_REV;const move=ev=>{if(pending){read.textContent='Click to place '+pending.section+' · Row '+pending.row+' · Seat '+pending.seat;read.style.display='block'}else{const q=pct(ev,img),p=nearest(q.x,q.y);if(p&&p.distance<1.1){read.textContent='Stalls '+p.section+' · Row '+p.row+' · Seat '+p.seat;read.style.display='block'}else read.style.display='none'}if(read.style.display==='block'){read.style.left=(ev.clientX+14)+'px';read.style.top=(ev.clientY+14)+'px'}};img.addEventListener('pointermove',move);img.addEventListener('mousemove',move);img.addEventListener('mouseleave',()=>{if(!pending)read.style.display='none'});const place=ev=>{if(!pending)return;ev.preventDefault();ev.stopPropagation();const q=pct(ev,img),c=load(),k=key(pending.section,pending.row,pending.seat);c[k]={x:q.x,y:q.y,door:pending.door,section:sectionCode(pending.section),row:num(pending.row),seat:num(pending.seat),kind:'user corrected'};save(c);activeTicket=Object.assign({},activeTicket,pending);pending=null;img.style.cursor='crosshair';read.style.display='none';renderMarker()};img.addEventListener('click',place,true);img.addEventListener('pointerup',place,true);img.addEventListener('load',renderMarker)}renderMarker()}
function setTicket(t){if(t&&Object.keys(t).length)activeTicket=t;renderMarker()}
window.RAHSeatMap={mapRevision:MAP_REV,install,setTicket,locate,nearest,startCorrection,renderMarker,lookup:LOOKUP,currentTicket};
})();

/* iPhone/Safari ticket viewer fix. Kept outside the Lister HTML so the working UI is untouched. */
(function(){
async function iPhoneSafeOpenPdf(c){
  const viewer=window.open('about:blank','_blank');
  if(viewer){
    try{
      viewer.document.open();
      viewer.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ticket</title><body style="font-family:-apple-system,system-ui;padding:24px">Loading ticket…</body>');
      viewer.document.close();
    }catch(e){}
  }
  try{
    const k=keyFor(c),rec=await pdfGet(k);
    if(!rec){
      if(viewer)try{viewer.close()}catch(e){}
      alert('Ticket details are recorded, but the ticket file is not stored on this iPhone. Import the backup ZIP or attach the ticket file on this device.');
      return;
    }
    const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream';
    const blob=new Blob([rec.blob],{type});
    const u=URL.createObjectURL(blob);
    let page=0;
    try{
      const t=typeof ticketFor==='function'?ticketFor(c):{};
      page=Number(t&&t.ticketPage||0);
    }catch(e){}
    const target=(type==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf'))&&page?u+'#page='+page+'&zoom=page-width':u;
    if(viewer) viewer.location.replace(target);
    else window.location.href=target;
    setTimeout(()=>URL.revokeObjectURL(u),300000);
  }catch(err){
    if(viewer){try{viewer.document.body.innerHTML='<p style="font-family:-apple-system,system-ui;padding:24px">Ticket could not be opened.</p>'}catch(e){}}
    alert('Ticket could not be opened: '+(err&&err.message?err.message:err));
  }
}
/* The original openPdf is a global function declaration; assignment replaces it without touching HTML. */
try{openPdf=iPhoneSafeOpenPdf}catch(e){window.openPdf=iPhoneSafeOpenPdf}
})();