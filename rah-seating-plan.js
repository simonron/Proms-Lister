/* Royal Albert Hall interactive seating-plan support.
   Hall-wide image-derived seat map. Coordinates are percentages of rah-seating-plan.jpg.
   The JPEG is fuzzy, so most positions are interpolated from visible section/row/seat geometry.
   Explicit calibrations override the interpolation where available. */
(function(){
'use strict';

const EXACT={
  'O|1|114':{x:61.8,y:36.8}, 'O|1|112':{x:62.0,y:38.3},
  'O|1|110':{x:62.2,y:39.8}, 'O|1|108':{x:62.5,y:41.3},
  'O|1|106':{x:62.8,y:43.0}, 'O|1|105':{x:63.0,y:44.6},
  'O|1|104':{x:63.1,y:45.3}, 'O|1|103':{x:63.2,y:46.1},
  'O|1|102':{x:63.3,y:46.9}, 'O|1|101':{x:63.4,y:47.7},
  'O|1|100':{x:63.5,y:48.5}, 'O|1|99':{x:63.6,y:49.3},
  'O|1|98':{x:63.7,y:50.1}
};

/* Image-derived quadrilateral models. Each section is represented by inner-left/right
   and outer-left/right edges. Rows interpolate inner->outer; seat numbers interpolate
   left->right. Number ranges are deliberately generous because the source is a scan. */
const MODELS={
  A:{name:'Stalls A',rows:12,seats:[1,12], quad:[[37.5,38],[44,38],[42,61],[34,59]]},
  B:{name:'Stalls B',rows:12,seats:[1,12], quad:[[34,59],[42,61],[43,69],[35,66]]},
  C:{name:'Stalls C',rows:30,seats:[1,32], quad:[[42,38],[49,38],[49,68],[43,69]]},
  D:{name:'Stalls D',rows:30,seats:[1,32], quad:[[49,38],[56,38],[57,69],[49,68]]},
  E:{name:'Stalls E',rows:12,seats:[1,12], quad:[[56,38],[62.5,38],[66,59],[57,61]]},
  F:{name:'Stalls F',rows:12,seats:[1,12], quad:[[57,61],[66,59],[65,66],[57,69]]},

  G:{name:'Stalls G',rows:12,seats:[1,30], quad:[[29,32],[40,36],[33,50],[20,46]]},
  H:{name:'Stalls H',rows:14,seats:[31,56],quad:[[20,48],[34,50],[35,64],[18,63]]},
  J:{name:'Stalls J',rows:14,seats:[45,72],quad:[[18,64],[35,66],[42,76],[24,79]]},
  K:{name:'Stalls K',rows:14,seats:[56,83],quad:[[35,66],[57,69],[58,82],[42,76]]},
  L:{name:'Stalls L',rows:14,seats:[68,101],quad:[[57,69],[66,64],[82,79],[58,82]]},
  M:{name:'Stalls M',rows:14,seats:[88,145],quad:[[66,50],[80,48],[82,63],[65,64]]},
  O:{name:'Stalls O',rows:14,seats:[98,165],quad:[[60,36],[71,32],[80,46],[66,50]]},

  P:{name:'Circle P',rows:10,seats:[1,34], quad:[[11,29],[25,31],[18,43],[6,39]]},
  Q:{name:'Circle Q',rows:10,seats:[1,38], quad:[[6,39],[18,43],[17,54],[4,52]]},
  R:{name:'Circle R',rows:10,seats:[1,40], quad:[[4,52],[17,54],[20,67],[6,65]]},
  S:{name:'Circle S',rows:10,seats:[1,42], quad:[[6,65],[20,67],[27,79],[11,78]]},
  T:{name:'Circle T',rows:10,seats:[1,44], quad:[[27,79],[43,83],[42,94],[23,91]]},
  U:{name:'Circle U',rows:10,seats:[1,44], quad:[[43,83],[58,82],[77,91],[42,94]]},
  V:{name:'Circle V',rows:10,seats:[1,42], quad:[[58,82],[73,79],[89,78],[77,91]]},
  W:{name:'Circle W',rows:10,seats:[1,40], quad:[[73,67],[82,63],[94,65],[89,78]]},
  X:{name:'Circle X',rows:10,seats:[1,38], quad:[[82,54],[83,43],[96,52],[94,65]]},
  Y:{name:'Circle Y',rows:10,seats:[1,34], quad:[[83,43],[75,31],[94,39],[96,52]]},

  EC:{name:'East Choir',rows:8,seats:[1,30],quad:[[22,15],[42,20],[37,28],[18,23]]},
  WC:{name:'West Choir',rows:8,seats:[1,30],quad:[[58,20],[78,15],[82,23],[63,28]]}
};

function lerp(a,b,t){return a+(b-a)*t;}
function bilerp(q,u,v){
 const top=[lerp(q[0][0],q[1][0],u),lerp(q[0][1],q[1][1],u)];
 const bot=[lerp(q[3][0],q[2][0],u),lerp(q[3][1],q[2][1],u)];
 return {x:lerp(top[0],bot[0],v),y:lerp(top[1],bot[1],v)};
}
function key(section,row,seat){return section+'|'+row+'|'+seat;}
function cleanSection(v){
 const s=String(v||'').toUpperCase().replace(/SECTION|STALLS|ARENA|CIRCLE|RAUSING|GRAND TIER|SECOND TIER|LOGGIA|BOX/g,'').replace(/[^A-Z]/g,'').trim();
 if(/EASTCHOIR/.test(String(v||'').toUpperCase()))return'EC';
 if(/WESTCHOIR/.test(String(v||'').toUpperCase()))return'WC';
 return s;
}
function number(v){const m=String(v==null?'':v).match(/\d+/);return m?Number(m[0]):NaN;}

let CACHE=null;
function buildMap(){
 if(CACHE)return CACHE;
 const out=[];
 for(const [section,m] of Object.entries(MODELS)){
   const [minSeat,maxSeat]=m.seats;
   for(let row=1;row<=m.rows;row++){
     const v=m.rows===1?0:(row-1)/(m.rows-1);
     /* Curved sections generally contain a few more seats in outer rows. */
     const grow=Math.round(v*(section.match(/^[G-MO]$/)?8:section.match(/^[P-Y]$/)?6:2));
     const lo=minSeat,hi=maxSeat+grow;
     for(let seat=lo;seat<=hi;seat++){
       const u=hi===lo?.5:(seat-lo)/(hi-lo);
       const p=bilerp(m.quad,u,v),exact=EXACT[key(section,row,seat)];
       out.push({section,row,seat,x:exact?exact.x:p.x,y:exact?exact.y:p.y,kind:exact?'mapped':'interpolated',name:m.name});
     }
   }
 }
 CACHE=out;return out;
}
function nearest(x,y){let best=null,bd=Infinity;for(const p of buildMap()){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p;}}return best?{...best,distance:bd}:null;}
function locate(ticket){
 const section=cleanSection(ticket&&(ticket.section||ticket.area)),row=number(ticket&&ticket.row),seat=number(ticket&&ticket.seat);
 if(!section||!Number.isFinite(row)||!Number.isFinite(seat))return null;
 const exact=EXACT[key(section,row,seat)];if(exact)return {section,row,seat,...exact,kind:'mapped',name:(MODELS[section]||{}).name||section};
 const pts=buildMap().filter(p=>p.section===section&&p.row===row);if(!pts.length)return null;
 let best=pts[0],bd=Math.abs(best.seat-seat);for(const p of pts){const d=Math.abs(p.seat-seat);if(d<bd){bd=d;best=p;}}
 if(bd===0)return best;
 /* extrapolate modestly from nearest seats in that row */
 const ordered=pts.slice().sort((a,b)=>a.seat-b.seat),a=ordered[Math.max(0,Math.min(ordered.length-2,ordered.findIndex(p=>p.seat>=seat)-1))],b=ordered[Math.max(1,Math.min(ordered.length-1,ordered.findIndex(p=>p.seat>=seat)))];
 if(a&&b&&a.seat!==b.seat){const t=(seat-a.seat)/(b.seat-a.seat);return{section,row,seat,x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),kind:'interpolated',name:(MODELS[section]||{}).name||section};}
 return best;
}
function pct(ev,img){const r=img.getBoundingClientRect();return{x:(ev.clientX-r.left)*100/r.width,y:(ev.clientY-r.top)*100/r.height};}
function seatText(p){if(!p)return'No seat identified';return p.name+' · Row '+p.row+' · Seat '+p.seat+(p.kind==='mapped'?'':' · estimated');}

function install(){
 const modal=document.getElementById('rahPlanModal'),img=document.getElementById('rahImg');if(!modal||!img)return;
 img.style.cursor='crosshair';img.style.filter='brightness(1.28) contrast(1.08)';
 const host=document.getElementById('pi')||img.parentElement;if(!host)return;
 let read=document.getElementById('rahHoverReadout');if(!read){read=document.createElement('div');read.id='rahHoverReadout';read.style.cssText='position:fixed;display:none;z-index:100002;pointer-events:none;background:rgba(0,0,0,.92);color:white;padding:8px 11px;border-radius:7px;font:600 14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap;box-shadow:0 2px 8px #0008';document.body.appendChild(read);}
 let fixed=document.getElementById('rahHoverFixed');if(!fixed){fixed=document.createElement('div');fixed.id='rahHoverFixed';fixed.style.cssText='position:absolute;left:8px;top:8px;z-index:25;pointer-events:none;background:rgba(255,255,255,.96);color:#111;padding:7px 10px;border-radius:6px;font:600 13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 1px 5px #0004';fixed.textContent='Move over the plan for seat details';host.appendChild(fixed);}
 let cross=document.getElementById('rahHoverMark');if(!cross){cross=document.createElement('div');cross.id='rahHoverMark';cross.style.cssText='display:none;position:absolute;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #007aff;background:rgba(255,255,255,.85);pointer-events:none;z-index:20';host.appendChild(cross);}
 if(img.dataset.hoverSeats==='hallwide')return;img.dataset.hoverSeats='hallwide';
 const move=ev=>{
   const q=pct(ev,img),n=nearest(q.x,q.y),near=n&&n.distance<4.0,text=near?seatText(n):'No seat identified at this point';
   read.style.display='block';read.style.left=Math.min(window.innerWidth-300,ev.clientX+14)+'px';read.style.top=Math.min(window.innerHeight-45,ev.clientY+14)+'px';read.textContent=text;fixed.textContent=text;
   if(near){cross.style.display='block';cross.style.left=n.x+'%';cross.style.top=n.y+'%';}else cross.style.display='none';
 };
 img.addEventListener('pointermove',move);img.addEventListener('mousemove',move);img.addEventListener('mouseleave',()=>{read.style.display='none';cross.style.display='none';fixed.textContent='Move over the plan for seat details';});
}

function updateTicketMarker(){
 const modal=document.getElementById('rahPlanModal');if(!modal||modal.style.display==='none')return;
 let ticket={};try{if(typeof selected!=='undefined'&&selected&&typeof ticketFor==='function')ticket=ticketFor(selected)||{};}catch(e){}
 const p=locate(ticket),mark=document.getElementById('seatMark'),label=document.getElementById('seatLabel');
 if(!p){if(mark)mark.style.display='none';return;}
 if(mark){mark.style.display='block';mark.style.left=p.x+'%';mark.style.top=p.y+'%';}
 if(label){const details=[ticket.door&&'Door '+ticket.door,p.name,'Row '+p.row,'Seat '+p.seat].filter(Boolean).join(' · ');label.textContent=details+(p.kind==='mapped'?'':' — estimated from seating-plan geometry');}
}
function tick(){install();updateTicketMarker();}
const observer=new MutationObserver(tick);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();setInterval(tick,750);
window.RAHSeatMap={exact:EXACT,models:MODELS,seats:buildMap(),nearest,locate,install};
})();
