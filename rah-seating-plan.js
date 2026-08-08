/* RAH seating-plan enhancement — event driven, with no polling/observers.
   Full OCR-derived lookup will be added from the source JPEG pixels.
   This build restores safe hover infrastructure and a true monochrome display. */
(function(){
'use strict';
const EXACT={
 'O|1|114':{x:61.8,y:36.8},'O|1|112':{x:62.0,y:38.3},'O|1|110':{x:62.2,y:39.8},
 'O|1|108':{x:62.5,y:41.3},'O|1|106':{x:62.8,y:43.0},'O|1|105':{x:63.0,y:44.6},
 'O|1|104':{x:63.1,y:45.3},'O|1|103':{x:63.2,y:46.1},'O|1|102':{x:63.3,y:46.9},
 'O|1|101':{x:63.4,y:47.7},'O|1|100':{x:63.5,y:48.5},'O|1|99':{x:63.6,y:49.3},'O|1|98':{x:63.7,y:50.1}
};
function points(){return Object.entries(EXACT).map(([k,p])=>{const a=k.split('|');return{section:a[0],row:+a[1],seat:+a[2],x:p.x,y:p.y}})}
const PTS=points();
function nearest(x,y){let b=null,d=Infinity;for(const p of PTS){const q=(p.x-x)**2+(p.y-y)**2;if(q<d){d=q;b=p}}return b?{...b,distance:Math.sqrt(d)}:null}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height}}
function details(p){return p?'Stalls '+p.section+' · Row '+p.row+' · Seat '+p.seat:''}
function install(){
 const img=document.getElementById('rahImg'),host=document.getElementById('pi')||(img&&img.parentElement);if(!img||!host||img.dataset.rahHover==='1')return;
 img.dataset.rahHover='1';
 /* Make the scan genuinely monochrome and push its paper background towards white. */
 img.style.filter='grayscale(1) brightness(1.42) contrast(1.42)';
 img.style.cursor='crosshair';
 let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.90);color:#fff;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap';document.body.appendChild(read)}
 img.addEventListener('pointermove',ev=>{const q=pct(ev,img),n=nearest(q.x,q.y);if(n&&n.distance<2.2){read.textContent=details(n);read.style.display='block';read.style.left=Math.min(innerWidth-230,ev.clientX+14)+'px';read.style.top=Math.min(innerHeight-40,ev.clientY+14)+'px'}else read.style.display='none'});
 img.addEventListener('pointerleave',()=>read.style.display='none');
}
/* The main viewer creates its DOM synchronously in its click handler. Install once after that click returns. */
document.addEventListener('click',ev=>{const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;const t=(el.textContent||'').trim();if(/^RAH (interactive )?seating plan/i.test(t))setTimeout(install,0)},false);
window.RAHSeatMap={install,nearest,exact:EXACT};
})();
