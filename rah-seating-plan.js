/* Royal Albert Hall interactive seating-plan support.
   Coordinates are percentages of rah-seating-plan.jpg.
   Keep this separate from the generated Proms Lister bootstrap so mappings can be maintained safely. */
(function(){
'use strict';

const SEATS={
  'O|1|114':{x:61.8,y:36.8}, 'O|1|112':{x:62.0,y:38.3},
  'O|1|110':{x:62.2,y:39.8}, 'O|1|108':{x:62.5,y:41.3},
  'O|1|106':{x:62.8,y:43.0}, 'O|1|105':{x:63.0,y:44.6},
  'O|1|104':{x:63.1,y:45.3}, 'O|1|103':{x:63.2,y:46.1},
  'O|1|102':{x:63.3,y:46.9}, 'O|1|101':{x:63.4,y:47.7},
  'O|1|100':{x:63.5,y:48.5}, 'O|1|99':{x:63.6,y:49.3},
  'O|1|98':{x:63.7,y:50.1}
};

function points(){return Object.entries(SEATS).map(([key,p])=>{const [section,row,seat]=key.split('|');return {section,row:Number(row),seat:Number(seat),x:p.x,y:p.y};});}
function nearest(x,y){let best=null,bd=Infinity;for(const p of points()){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}}return best?{...best,distance:bd}:null;}
function pct(ev,img){const r=img.getBoundingClientRect();return {x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height};}
function fmt(p){return p?'Stalls '+p.section+' · Row '+p.row+' · Seat '+p.seat+' · X '+p.x.toFixed(1)+'% · Y '+p.y.toFixed(1)+'%':'No mapped seat';}

function install(){
 const modal=document.getElementById('rahPlanModal'),img=document.getElementById('rahImg');
 if(!modal||!img||img.dataset.hoverSeats==='1')return;
 img.dataset.hoverSeats='1';
 img.style.cursor='crosshair';
 /* The supplied scan tops out around light grey rather than RGB white. Brighten only the display; geometry and stored JPEG coordinates stay unchanged. */
 img.style.filter='brightness(1.28)';
 const host=document.getElementById('pi')||img.parentElement;
 const read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.90);color:white;padding:7px 10px;border-radius:6px;font:13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap;box-shadow:0 2px 8px #0008';document.body.appendChild(read);
 const fixed=document.createElement('div');fixed.id='rahHoverFixed';fixed.style.cssText='position:absolute;left:8px;bottom:8px;z-index:25;pointer-events:none;background:rgba(255,255,255,.94);color:#111;padding:6px 9px;border-radius:6px;font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 1px 5px #0004';fixed.textContent='Move over the plan for seat / X-Y details';host.appendChild(fixed);
 const cross=document.createElement('div');cross.id='rahHoverMark';cross.style.cssText='display:none;position:absolute;width:12px;height:12px;margin:-6px;border-radius:50%;border:2px solid #00a7ff;background:rgba(255,255,255,.8);pointer-events:none;z-index:20';host.appendChild(cross);
 img.addEventListener('mousemove',ev=>{
   const q=pct(ev,img),n=nearest(q.x,q.y),near=n&&n.distance<5.0;
   const text=near?fmt(n):'X '+q.x.toFixed(1)+'% · Y '+q.y.toFixed(1)+'% · no nearby mapped seat';
   read.style.display='block';read.style.left=(ev.clientX+14)+'px';read.style.top=(ev.clientY+14)+'px';read.textContent=text;fixed.textContent=text;
   if(near){cross.style.display='block';cross.style.left=n.x+'%';cross.style.top=n.y+'%';}else cross.style.display='none';
 });
 img.addEventListener('mouseleave',()=>{read.style.display='none';cross.style.display='none';fixed.textContent='Move over the plan for seat / X-Y details';});
}

const observer=new MutationObserver(install);observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.RAHSeatMap={seats:SEATS,nearest,install};
})();
