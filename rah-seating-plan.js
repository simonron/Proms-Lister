/* RAH seating plan safety build.
   Deliberately minimal: no timers, observers, hall-wide scans or DOM mutation loops.
   This restores a responsive viewer first. */
(function(){
'use strict';
const CORR_KEY='rahSeatCorrectionsV1';
const EXACT={'O|1|114':{x:61.8,y:36.8},'O|1|112':{x:62.0,y:38.3},'O|1|110':{x:62.2,y:39.8},'O|1|108':{x:62.5,y:41.3},'O|1|106':{x:62.8,y:43.0},'O|1|105':{x:63.0,y:44.6},'O|1|104':{x:63.1,y:45.3},'O|1|103':{x:63.2,y:46.1},'O|1|102':{x:63.3,y:46.9},'O|1|101':{x:63.4,y:47.7},'O|1|100':{x:63.5,y:48.5},'O|1|99':{x:63.6,y:49.3},'O|1|98':{x:63.7,y:50.1}};
function clean(v){const u=String(v||'').toUpperCase();if(/EAST\s*CHOIR/.test(u))return'EC';if(/WEST\s*CHOIR/.test(u))return'WC';return u.replace(/SECTION|STALLS|ARENA|CIRCLE|RAUSING|GRAND TIER|SECOND TIER|LOGGIA|BOX/g,'').replace(/[^A-Z]/g,'').trim()}
function num(v){const m=String(v==null?'':v).match(/\d+/);return m?Number(m[0]):NaN}
function corrections(){try{return JSON.parse(localStorage.getItem(CORR_KEY)||'{}')}catch(e){return{}}}
function locate(t){const s=clean(t&&(t.section||t.area)),r=num(t&&t.row),n=num(t&&t.seat);if(!s||!Number.isFinite(r)||!Number.isFinite(n))return null;const k=s+'|'+r+'|'+n,c=corrections()[k];if(c)return{section:s,row:r,seat:n,x:c.x,y:c.y,kind:'corrected'};const e=EXACT[k];if(e)return{section:s,row:r,seat:n,x:e.x,y:e.y,kind:'mapped'};return null}
function install(){const img=document.getElementById('rahImg');if(!img||img.dataset.rahSafe==='1')return;img.dataset.rahSafe='1';img.style.filter='brightness(1.28) contrast(1.08)';img.style.cursor='crosshair';const host=document.getElementById('pi')||img.parentElement;if(!host)return;let note=document.getElementById('rahHoverFixed');if(!note){note=document.createElement('div');note.id='rahHoverFixed';note.style.cssText='position:absolute;left:8px;top:8px;z-index:25;pointer-events:none;background:rgba(255,255,255,.95);color:#111;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';note.textContent='Seating plan ready';host.appendChild(note)}img.addEventListener('mousemove',function(){note.textContent='Seating plan ready — detailed hover temporarily disabled while performance is repaired'});let t={};try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')t=ticketFor(selected)||{}}catch(e){}const p=locate(t),m=document.getElementById('seatMark'),l=document.getElementById('seatLabel');if(p&&m){m.style.display='block';m.style.left=p.x+'%';m.style.top=p.y+'%'}if(l&&p)l.textContent=[t.door&&'Door '+t.door,t.section||t.area,t.row&&'Row '+t.row,t.seat&&'Seat '+t.seat].filter(Boolean).join(' · ')+' — '+p.kind}
function tryInstall(){install();if(!document.getElementById('rahImg'))requestAnimationFrame(tryInstall)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryInstall,{once:true});else tryInstall();
window.RAHSeatMap={locate:locate,install:install};
})();