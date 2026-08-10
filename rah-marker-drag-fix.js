/* RAH marker drag fix: marker centre follows the actual clicked pointer position. */
(function(){'use strict';
const CORR='rahUserSeatCorrections:v1';
let drag=null;
function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}
function key(t){return clean(t.section||t.area)+'|'+num(t.row)+'|'+num(t.seat)}
function save(p){const t=currentTicket();if(!t.section||!t.row||!t.seat)return;let a={};try{a=JSON.parse(localStorage.getItem(CORR)||'{}')}catch(e){}a[key(t)]={x:p.x,y:p.y};localStorage.setItem(CORR,JSON.stringify(a))}
/* Use the image's ACTUAL transformed viewport rectangle. This automatically includes
   CSS map zoom, browser zoom, scrolling and transform origin. No manual zoom divisor. */
function point(ev){const img=document.getElementById('rahImg');if(!img)return null;const r=img.getBoundingClientRect();if(!r.width||!r.height)return null;return{x:Math.max(0,Math.min(100,(ev.clientX-r.left)*100/r.width)),y:Math.max(0,Math.min(100,(ev.clientY-r.top)*100/r.height))}}
/* Marker uses percentages in the same image/map coordinate system as its normal seat
   position, so its centre is exactly the clicked point and cannot accumulate offset. */
function moveMarker(m,p){if(!m||!p)return;m.style.left=p.x+'%';m.style.top=p.y+'%';m.style.transform='translate(-50%,-50%)'}
function placeAtPointer(ev,m,commit){const p=point(ev);if(!p)return;moveMarker(m,p);if(commit)save(p)}
/* Capture phase suppresses the older drag implementation. */
document.addEventListener('pointerdown',function(ev){const m=ev.target&&ev.target.closest&&ev.target.closest('#seatMark');if(!m)return;drag={m,id:ev.pointerId};try{m.setPointerCapture(ev.pointerId)}catch(e){}m.style.cursor='grabbing';placeAtPointer(ev,m,false);ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointermove',function(ev){if(!drag||ev.pointerId!==drag.id)return;placeAtPointer(ev,drag.m,false);ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointerup',function(ev){if(!drag||ev.pointerId!==drag.id)return;const m=drag.m;placeAtPointer(ev,m,true);m.style.cursor='grab';try{m.releasePointerCapture(ev.pointerId)}catch(e){}drag=null;ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointercancel',function(ev){if(!drag||ev.pointerId!==drag.id)return;drag.m.style.cursor='grab';drag=null;ev.stopImmediatePropagation()},true);
/* In Move-marker mode, clicking/tapping the map puts the dot exactly there immediately. */
document.addEventListener('pointerdown',function(ev){if(drag)return;const img=ev.target&&ev.target.closest&&ev.target.closest('#rahImg');if(!img)return;const bar=document.getElementById('rahCorrectionBar'),button=bar&&bar.querySelector('#rahFixStart');if(!button||!/^Tap seat position$/i.test(button.textContent||''))return;const m=document.getElementById('seatMark');if(!m)return;placeAtPointer(ev,m,true);setTimeout(()=>{if(window.RAHSeatMap&&window.RAHSeatMap.renderMarker)window.RAHSeatMap.renderMarker()},0);ev.preventDefault();ev.stopImmediatePropagation()},true);
/* Main renderer remains authoritative for the initial Section/Row/Seat position. */
window.RAHMarkerDragFix={revision:'exact-click-position-no-growing-offset-20260811'};
})();