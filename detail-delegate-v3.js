(()=>{'use strict';
/* renderList replaces cards after every search. Route taps on replacement cards
   through a stable document listener and recreate the same Version 3 detail view. */
const STORAGE='promsTicketsV2';
const SECTIONS=['','Arena','Stalls G','Stalls H','Stalls I','Stalls J','Stalls K','Stalls L','Stalls M','Stalls N','Stalls O','Stalls P','Stalls Q','Stalls R','Stalls S','Stalls T','Stalls U','Stalls V','Stalls W','Stalls X','Stalls Y','Circle G','Circle H','Circle I','Circle J','Circle K','Circle L','Circle M','Circle N','Circle O','Circle P','Circle Q','Circle R','Circle S','Circle T','Circle U','Circle V','Circle W','Circle X','Circle Y','East Choir','West Choir','Choir','Rausing Circle','Loggia','Grand Tier','Second Tier','Gallery'];
let concerts=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const key=c=>String(c.id??`${c.date}|${c.time}|${c.title}`);
function records(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}}
function rec(c){return records()[key(c)]||{}}
function save(c,v){const a=records();a[key(c)]=Object.assign({},a[key(c)]||{},v);localStorage.setItem(STORAGE,JSON.stringify(a))}
function fmt(d){return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
function open(c){document.getElementById('detailModal')?.remove();const r=rec(c),d=document.createElement('div');d.className='modal';d.id='detailModal';d.innerHTML=`<div class="sheet"><button id="detailClose" class="close">×</button><h2>${esc(c.title)}</h2><div class="venue">${fmt(c.date)} · ${esc(c.time)} · ${esc(c.venue)}</div><div class="section"><h4>Programme</h4><p>${esc(c.programme)}</p></div><div class="section"><h4>Performers</h4><p>${esc(c.performers)}</p></div><div class="detailgrid"><label class="field"><span>Door</span><input id="dDoor" value="${esc(r.door||'')}"></label><label class="field"><span>Section</span><select id="dSection">${SECTIONS.map(x=>`<option ${x===(r.section||r.area||'')?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label class="field"><span>Row</span><input id="dRow" inputmode="numeric" value="${esc(r.row||'')}"></label><label class="field"><span>Seat</span><input id="dSeat" inputmode="numeric" value="${esc(r.seat||'')}"></label></div><label class="field section"><span>Notes</span><textarea id="dNotes">${esc(r.notes||'')}</textarea></label><div class="actions"><button id="toggleMy" class="btn ${r.myProm?'primary':''}">${r.myProm?'My Prom ✓':'Mark My Prom'}</button><button id="attachTicket" class="btn">Attach/replace ticket</button><button id="openTicket" class="btn" ${r.hasTicket?'':'disabled'}>Open Ticket</button><button id="seatMap" class="btn">RAH seating plan</button></div></div>`;document.body.appendChild(d);
 const $=s=>document.querySelector(s);$('#detailClose').onclick=()=>d.remove();const saveFields=()=>save(c,{door:$('#dDoor').value.trim(),section:$('#dSection').value,row:$('#dRow').value.trim(),seat:$('#dSeat').value.trim(),notes:$('#dNotes').value});['#dDoor','#dSection','#dRow','#dSeat','#dNotes'].forEach(s=>$(s).addEventListener('change',saveFields));$('#toggleMy').onclick=()=>{save(c,{myProm:!rec(c).myProm});d.remove();location.reload()};
 /* For actions implemented by the core app, close this delegated modal and click
    the corresponding original card after clearing search is not acceptable. Keep
    detail access reliable first; ticket/map buttons remain available on cards that
    retained the core handler. */
 $('#attachTicket').onclick=()=>{const p=document.getElementById('ticketPicker');p.dataset.target=key(c);p.click()};
}
fetch('./data.json',{cache:'no-store'}).then(r=>r.json()).then(x=>concerts=x).catch(()=>{});
document.addEventListener('click',e=>{if(e.target.closest('.browseTick'))return;const card=e.target.closest('#results .card');if(!card)return;/* Core-bound cards already open normally. Replacement cards created by renderList have detailBound from the browse fix. */if(!card.dataset.detailBound)return;const c=concerts.find(x=>String(x.id)===String(card.dataset.id));if(c){e.preventDefault();e.stopImmediatePropagation();open(c)}},true);
})();