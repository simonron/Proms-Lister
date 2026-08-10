/* RAH marker drag fix: keep marker under pointer through map/browser zoom. */
(function(){'use strict';
const CORR='rahUserSeatCorrections:v1';
let drag=null;
function clean(v){return String(v||'').toUpperCase().replace(/STALLS|CIRCLE|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?+m[0]:NaN}
function currentTicket(){try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')return ticketFor(selected)||{}}catch(e){}return{}}
function key(t){return clean(t.section||t.area)+'|'+num(t.row)+'|'+num(t.seat)}
function save(p){const t=currentTicket();if(!t.section||!t.row||!t.seat)return;let a={};try{a=JSON.parse(localStorage.getItem(CORR)||'{}')}catch(e){}a[key(t)]={x:p.x,y:p.y};localStorage.setItem(CORR,JSON.stringify(a))}
function geometry(){const img=document.getElementById('rahImg'),host=document.getElementById('pi'),modal=document.getElementById('rahPlanModal');if(!img||!host)return null;const z=(modal&&modal._z)||1,hr=host.getBoundingClientRect();return{img,host,z,hr,w:img.offsetWidth||img.naturalWidth,h:img.offsetHeight||img.naturalHeight}}
function point(ev){const g=geometry();if(!g||!g.w||!g.h)return null;const x=(ev.clientX-g.hr.left)/g.z,y=(ev.clientY-g.hr.top)/g.z;return{px:x,py:y,x:Math.max(0,Math.min(100,x*100/g.w)),y:Math.max(0,Math.min(100,y*100/g.h))}}
function moveMarker(m,p){if(!p)return;m.style.left=p.px+'px';m.style.top=p.py+'px'}
/* Capture phase deliberately runs before the older marker handlers. */
document.addEventListener('pointerdown',function(ev){const m=ev.target&&ev.target.closest&&ev.target.closest('#seatMark');if(!m)return;drag={m,id:ev.pointerId};try{m.setPointerCapture(ev.pointerId)}catch(e){}m.style.cursor='grabbing';ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointermove',function(ev){if(!drag||ev.pointerId!==drag.id)return;const p=point(ev);moveMarker(drag.m,p);ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointerup',function(ev){if(!drag||ev.pointerId!==drag.id)return;const p=point(ev),m=drag.m;moveMarker(m,p);if(p)save(p);m.style.cursor='grab';try{m.releasePointerCapture(ev.pointerId)}catch(e){}drag=null;ev.preventDefault();ev.stopImmediatePropagation()},true);
document.addEventListener('pointercancel',function(ev){if(!drag||ev.pointerId!==drag.id)return;drag.m.style.cursor='grab';drag=null;ev.stopImmediatePropagation()},true);
/* The normal RAH renderer remains authoritative for the START position: it places
   the dot from Section/Row/Seat (or a saved correction) before dragging begins. */
window.RAHMarkerDragFix={revision:'seat-start-in-place-pointer-locked-20260811'};
})();