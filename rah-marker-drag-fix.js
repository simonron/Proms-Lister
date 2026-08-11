/* RAH map/marker correction: keep viewport fixed, zoom only map, align marker exactly. */
(function(){'use strict';
const CORR='rahUserSeatCorrections:v1';
let drag=null,zoom=1,baseW=0,baseH=0;
function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}
function key(t){return clean(t.section||t.area)+'|'+num(t.row)+'|'+num(t.seat)}
function save(p){const t=currentTicket();if(!t.section||!t.row||!t.seat)return;let a={};try{a=JSON.parse(localStorage.getItem(CORR)||'{}')}catch(e){}a[key(t)]={x:p.x,y:p.y};localStorage.setItem(CORR,JSON.stringify(a))}
function ensureCanvas(){const pi=document.getElementById('pi'),img=document.getElementById('rahImg');if(!pi||!img)return null;pi.style.transform='none';pi.style.transformOrigin='';pi.style.width='100%';pi.style.height='100%';pi.style.flex='1 1 auto';pi.style.overflow='auto';let c=document.getElementById('rahMapCanvas');if(!c){c=document.createElement('div');c.id='rahMapCanvas';c.style.cssText='position:relative;transform:none;transform-origin:top left;margin:0;padding:0;';img.parentNode.insertBefore(c,img);c.appendChild(img)}if(!baseW)baseW=img.naturalWidth||img.width||img.offsetWidth||1346;if(!baseH){const ratio=(img.naturalWidth&&img.naturalHeight)?img.naturalHeight/img.naturalWidth:(img.offsetHeight&&img.offsetWidth?img.offsetHeight/img.offsetWidth:1);baseH=Math.round(baseW*ratio)}const m=document.getElementById('seatMark');if(m&&m.parentNode!==c)c.appendChild(m);applyZoom();return c}
function applyZoom(){const c=document.getElementById('rahMapCanvas'),img=document.getElementById('rahImg'),modal=document.getElementById('rahPlanModal');if(!c||!img||!baseW||!baseH)return;zoom=Math.max(.25,Math.min(6,zoom));const w=baseW*zoom,h=baseH*zoom;c.style.width=w+'px';c.style.height=h+'px';img.style.width='100%';img.style.height='100%';img.style.maxWidth='none';img.style.display='block';img.style.transform='none';if(modal)modal._z=zoom}
function setZoom(z){zoom=z;ensureCanvas();applyZoom()}
function point(ev){const c=ensureCanvas();if(!c)return null;const r=c.getBoundingClientRect();if(!r.width||!r.height)return null;return{x:Math.max(0,Math.min(100,(ev.clientX-r.left)*100/r.width)),y:Math.max(0,Math.min(100,(ev.clientY-r.top)*100/r.height))}}
function moveMarker(m,p){if(!m||!p)return;m.style.left=p.x+'%';m.style.top=p.y+'%';m.style.transform='translate(-50%,-50%)'}
function placeAtPointer(ev,m,commit){const p=point(ev);if(!p)return;moveMarker(m,p);if(commit)save(p)}
function syncStartPosition(){const c=ensureCanvas(),m=document.getElementById('seatMark');if(!c||!m)return;if(m.parentNode!==c)c.appendChild(m);m.style.transform='translate(-50%,-50%)';if(window.RAHSeatMap&&window.RAHSeatMap.renderMarker)window.RAHSeatMap.renderMarker()}
/* Keep the viewport full-size. Intercept the old transform-based zoom controls. */
document.addEventListener('click',function(ev){const b=ev.target&&ev.target.closest&&ev.target.closest('#rahTopBar button');if(!b)return;const t=(b.textContent||'').trim();if(t==='−'){ev.preventDefault();ev.stopImmediatePropagation();setZoom(zoom-.25)}else if(t==='+'){ev.preventDefault();ev.stopImmediatePropagation();setZoom(zoom+.25)}else if(/^Reset$/i.test(t)){ev.preventDefault();ev.stopImmediatePropagation();setZoom(1)}},true);
/* Marker centre follows the pointer exactly. */
document.addEventListener('pointerdown',function(ev){const m=ev.target&&ev.target.closest&&ev.target.closest('#seatMark');if(!m)return;ensureCanvas();drag={m,id:ev.pointerId};try{m.setPointerCapture(ev.pointerId)}catch(e){}m.style.cursor='grabbing';placeAtPointer(ev,m,false);ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointermove',function(ev){if(!drag||ev.pointerId!==drag.id)return;placeAtPointer(ev,drag.m,false);ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointerup',function(ev){if(!drag||ev.pointerId!==drag.id)return;const m=drag.m;placeAtPointer(ev,m,true);m.style.cursor='grab';try{m.releasePointerCapture(ev.pointerId)}catch(e){}drag=null;ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointercancel',function(ev){if(!drag||ev.pointerId!==drag.id)return;drag.m.style.cursor='grab';drag=null;ev.stopImmediatePropagation()},true);
/* Move-marker mode: dot sits exactly where map is clicked/tapped. */
document.addEventListener('pointerdown',function(ev){if(drag)return;const img=ev.target&&ev.target.closest&&ev.target.closest('#rahImg');if(!img)return;const bar=document.getElementById('rahCorrectionBar'),button=bar&&bar.querySelector('#rahFixStart');if(!button||!/^Tap seat position$/i.test(button.textContent||''))return;const m=document.getElementById('seatMark');if(!m)return;placeAtPointer(ev,m,true);ev.preventDefault();ev.stopImmediatePropagation()},true);
/* Rebuild the aligned canvas whenever the RAH map opens. The main renderer then places
   the initial dot from the Section/Row/Seat coordinates inside this same canvas. */
document.addEventListener('click',function(ev){const el=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(!el)return;if(/^RAH (interactive )?seating plan/i.test((el.textContent||'').trim()))setTimeout(syncStartPosition,20)},true);
const mo=new MutationObserver(()=>{if(document.getElementById('rahPlanModal')&&document.getElementById('rahImg'))setTimeout(syncStartPosition,0)});mo.observe(document.documentElement,{childList:true,subtree:true});
window.RAHMarkerDragFix={revision:'fixed-viewport-scaled-map-exact-pointer-20260811',setZoom,syncStartPosition};
})();