(()=>{'use strict';
const STORAGE='promsTicketsV2';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}};
function currentRecord(){const modal=document.querySelector('#detailModal');if(!modal)return null;const vals={door:modal.querySelector('#dDoor')?.value||'',section:modal.querySelector('#dSection')?.value||'',row:modal.querySelector('#dRow')?.value||'',seat:modal.querySelector('#dSeat')?.value||''};return vals}
function text(v){return v==null?'':String(v).trim()}
function label(v,name){v=text(v);return `<span class="map-seat-item"><b>${name}</b> ${v||'—'}</span>`}
function update(){const map=document.querySelector('#mapModal');if(!map)return;let bar=map.querySelector('#mapSeatSummary');if(!bar){bar=document.createElement('div');bar.id='mapSeatSummary';bar.className='map-seat-summary';const head=map.querySelector('.maphead');head?.insertAdjacentElement('afterend',bar)}if(!bar)return;let v=currentRecord()||{};const eDoor=map.querySelector('#eDoor'),eSection=map.querySelector('#eSection'),eRow=map.querySelector('#eRow'),eSeat=map.querySelector('#eSeat');if(eDoor||eSection||eRow||eSeat)v={door:eDoor?.value??v.door,section:eSection?.value??v.section,row:eRow?.value??v.row,seat:eSeat?.value??v.seat};bar.innerHTML=label(v.door,'Door')+label(v.section,'Section')+label(v.row,'Row')+label(v.seat,'Seat')}
document.addEventListener('click',e=>{if(e.target?.id==='seatMap')setTimeout(update,0);if(e.target?.id==='setSeat')setTimeout(update,0)},true);
document.addEventListener('input',e=>{if(['eDoor','eRow','eSeat','dDoor','dRow','dSeat'].includes(e.target?.id))update()},true);
document.addEventListener('change',e=>{if(['eSection','dSection'].includes(e.target?.id))update()},true);
})();