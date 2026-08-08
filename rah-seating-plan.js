/* Royal Albert Hall seat map — image-grounded lookup.
   This deliberately removes the previous whole-section quadrilateral estimates, which
   were too inaccurate.  Only seats whose positions can be grounded in the supplied
   seating-plan image are exposed to hover/marker logic.  No timers or observers. */
(function(){
'use strict';

/* Percent coordinates measured from the uploaded 1149 x 1536 JPEG.
   Stalls O / Row 7 is readable enough to establish the printed seat run around 141.
   The cells below follow that physical row on the scan; 141 itself is the calibrated
   anchor and neighbouring printed cells are spaced from the same row geometry. */
const LOOKUP={};
(function(){
  const seats=[109,113,117,121,125,129,133,137,141,145,149,153];
  const anchorSeat=141, anchorX=68.755, anchorY=37.956;
  const dxPerCell=-0.104, dyPerCell=-0.814; // increasing seat number moves inward/up the printed row
  for(const seat of seats){
    const cells=(seat-anchorSeat)/4;
    LOOKUP['O|7|'+seat]={x:anchorX+cells*dxPerCell,y:anchorY+cells*dyPerCell,section:'O',row:7,seat,kind:seat===141?'image anchor':'image-derived'};
  }
})();

function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function locate(t){const s=clean(t&&(t.section||t.area)),r=num(t&&t.row),n=num(t&&t.seat);return LOOKUP[s+'|'+r+'|'+n]||null}
const POINTS=Object.values(LOOKUP);
function nearest(x,y){let best=null,bd=Infinity;for(const p of POINTS){const d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;best=p}}return best?Object.assign({},best,{distance:Math.sqrt(bd)}):null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function text(p){return p?['Stalls '+p.section,'Row '+p.row,'Seat '+p.seat,p.kind].join(' · '):''}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}

function install(){
  const img=document.getElementById('rahImg'); if(!img)return;
  /* Keep the uploaded scan readable.  Previous brightness/contrast values clipped the
     fine printed numerals.  This is intentionally mild. */
  img.style.filter='grayscale(1) brightness(1.06) contrast(1.12)';
  img.style.cursor='crosshair';

  let read=document.getElementById('rahHoverReadout');
  if(!read){
    read=document.createElement('div');read.id='rahHoverReadout';
    read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.9);color:white;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap';
    document.body.appendChild(read);
  }

  if(img.dataset.rahImageLookup!=='1'){
    img.dataset.rahImageLookup='1';
    const move=ev=>{
      const q=pct(ev,img),p=nearest(q.x,q.y);
      if(p&&p.distance<1.25){
        read.textContent=text(p);read.style.display='block';
        read.style.left=Math.max(4,Math.min(window.innerWidth-300,ev.clientX+14))+'px';
        read.style.top=Math.max(4,Math.min(window.innerHeight-42,ev.clientY+14))+'px';
      }else read.style.display='none';
    };
    img.addEventListener('mousemove',move);img.addEventListener('pointermove',move);
    img.addEventListener('mouseleave',()=>read.style.display='none');
  }

  const t=currentTicket(),p=locate(t),mark=document.getElementById('seatMark'),label=document.getElementById('seatLabel');
  if(p&&mark){mark.style.display='block';mark.style.left=p.x+'%';mark.style.top=p.y+'%';}
  else if(mark)mark.style.display='none';
  if(label){
    const d=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ');
    label.textContent=p?d+' — '+p.kind:d+' — exact image position not yet mapped';
  }
}

/* Capture phase: the bootstrap viewer stops later click propagation. */
document.addEventListener('click',ev=>{
  const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;
  if(/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(install,0);
},true);

window.RAHSeatMap={install,locate,nearest,lookup:LOOKUP};
})();