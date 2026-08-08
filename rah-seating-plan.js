/* Royal Albert Hall interactive seating-plan support.
   Coordinates are percentages of rah-seating-plan.jpg.
   This module is deliberately separate from the generated Proms Lister bootstrap. */
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

function points(){return Object.entries(SEATS).map(([key,p])=>{const [section,row,seat]=key.split('|');return {section,row:Number(row),seat:Number(seat),x:p.x,y:p.y,kind:'mapped'};});}
function nearest(x,y){let best=null,bd=Infinity;for(const p of points()){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}}return best?{...best,distance:bd}:null;}
function pct(ev,img){const r=img.getBoundingClientRect();return {x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height};}
function fmt(p){return p?'Stalls '+p.section+' · Row '+p.row+' · Seat '+p.seat+' · X '+p.x.toFixed(1)+'% · Y '+p.y.toFixed(1)+'%':'No mapped seat';}
function cleanSection(v){return String(v||'').toUpperCase().replace(/STALLS|SECTION|ARENA/g,'').replace(/[^A-Z]/g,'').trim();}
function number(v){const m=String(v==null?'':v).match(/\d+/);return m?Number(m[0]):NaN;}

/* Extend the existing Row 1 calibration into Stalls O until more readable anchors are entered.
   This is explicitly an estimate, not a claim that the JPEG has been fully digitised. */
function estimateO(row,seat){
 if(!Number.isFinite(row)||!Number.isFinite(seat))return null;
 const x0=63.0,y0=44.6;             // existing O / Row 1 / Seat 105 calibration
 const seatDx=.10,seatDy=.80;        // observed direction along Row 1
 const rowDx=1.15,rowDy=.18;         // outward displacement for successive rows
 const ds=seat-105,dr=row-1;
 const x=x0+ds*seatDx+dr*rowDx,y=y0+ds*seatDy+dr*rowDy;
 if(x<5||x>95||y<5||y>95)return null;
 return {section:'O',row,seat,x,y,kind:'estimated'};
}
function locate(ticket){
 const section=cleanSection(ticket&&(ticket.section||ticket.area)),row=number(ticket&&ticket.row),seat=number(ticket&&ticket.seat);
 const exact=SEATS[section+'|'+row+'|'+seat];if(exact)return {section,row,seat,...exact,kind:'mapped'};
 if(section==='O')return estimateO(row,seat);
 return null;
}

function install(){
 const modal=document.getElementById('rahPlanModal'),img=document.getElementById('rahImg');
 if(!modal||!img)return;
 img.style.cursor='crosshair';
 img.style.filter='brightness(1.28) contrast(1.08)';
 const host=document.getElementById('pi')||img.parentElement;
 if(!host)return;
 if(!document.getElementById('rahHoverReadout')){
   const read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.90);color:white;padding:7px 10px;border-radius:6px;font:13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap;box-shadow:0 2px 8px #0008';document.body.appendChild(read);
 }
 if(!document.getElementById('rahHoverFixed')){
   const fixed=document.createElement('div');fixed.id='rahHoverFixed';fixed.style.cssText='position:absolute;left:8px;top:8px;z-index:25;pointer-events:none;background:rgba(255,255,255,.95);color:#111;padding:6px 9px;border-radius:6px;font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 1px 5px #0004';fixed.textContent='Move over the plan for seat / X-Y details';host.appendChild(fixed);
 }
 if(!document.getElementById('rahHoverMark')){
   const cross=document.createElement('div');cross.id='rahHoverMark';cross.style.cssText='display:none;position:absolute;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #007aff;background:rgba(255,255,255,.8);pointer-events:none;z-index:20';host.appendChild(cross);
 }
 if(img.dataset.hoverSeats==='1')return;
 img.dataset.hoverSeats='1';
 const move=ev=>{
   const q=pct(ev,img),n=nearest(q.x,q.y),near=n&&n.distance<5.0,read=document.getElementById('rahHoverReadout'),fixed=document.getElementById('rahHoverFixed'),cross=document.getElementById('rahHoverMark');
   const text=near?fmt(n):'X '+q.x.toFixed(1)+'% · Y '+q.y.toFixed(1)+'% · no nearby mapped seat';
   if(read){read.style.display='block';read.style.left=Math.min(window.innerWidth-310,ev.clientX+14)+'px';read.style.top=Math.min(window.innerHeight-45,ev.clientY+14)+'px';read.textContent=text;}
   if(fixed)fixed.textContent=text;
   if(cross){if(near){cross.style.display='block';cross.style.left=n.x+'%';cross.style.top=n.y+'%';}else cross.style.display='none';}
 };
 img.addEventListener('pointermove',move);img.addEventListener('mousemove',move);
 img.addEventListener('mouseleave',()=>{const r=document.getElementById('rahHoverReadout'),c=document.getElementById('rahHoverMark'),f=document.getElementById('rahHoverFixed');if(r)r.style.display='none';if(c)c.style.display='none';if(f)f.textContent='Move over the plan for seat / X-Y details';});
}

function updateTicketMarker(){
 const modal=document.getElementById('rahPlanModal');if(!modal||modal.style.display==='none')return;
 let ticket={};try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')ticket=ticketFor(selected)||{};}catch(e){}
 const p=locate(ticket);if(!p)return;
 const mark=document.getElementById('seatMark'),label=document.getElementById('seatLabel');
 if(mark){mark.style.display='block';mark.style.left=p.x+'%';mark.style.top=p.y+'%';}
 if(label&&p.kind==='estimated')label.textContent=[ticket.door&&'Door '+ticket.door,ticket.section||ticket.area,ticket.row&&'Row '+ticket.row,ticket.seat&&'Seat '+ticket.seat].filter(Boolean).join(' · ')+' — estimated position ('+p.x.toFixed(1)+'%, '+p.y.toFixed(1)+'%)';
}
function tick(){install();updateTicketMarker();}
const observer=new MutationObserver(tick);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
setInterval(tick,750);
window.RAHSeatMap={seats:SEATS,nearest,locate,install};
})();
