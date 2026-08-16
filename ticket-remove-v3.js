(()=>{'use strict';
const STORAGE='promsTicketsV2',DB='PromsListerPDFs',DBV=2,PDFS='pdfs';
function records(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}}
function recordKeyForCard(card){if(!card)return'';const id=String(card.dataset.id||'');const a=records();if(a[id])return id;return Object.keys(a).find(k=>k===id)||id}
function deleteStoredTicket(key){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,DBV);q.onerror=()=>reject(q.error);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains(PDFS))d.createObjectStore(PDFS)};q.onsuccess=()=>{const d=q.result,tx=d.transaction(PDFS,'readwrite');tx.objectStore(PDFS).delete(key);tx.oncomplete=()=>{d.close();resolve()};tx.onerror=()=>reject(tx.error)}})}
async function removeTicket(key){const a=records(),r=a[key];if(!key||!r?.hasTicket)return;if(!confirm('Remove the attached ticket from this Prom?\n\nSeat details and the Prom itself will be kept.'))return;try{await deleteStoredTicket(key);r.hasTicket=false;delete r.ticketName;a[key]=r;localStorage.setItem(STORAGE,JSON.stringify(a));document.getElementById('detailModal')?.remove();document.querySelector(`.card[data-id="${CSS.escape(key)}"]`)?.click()}catch(e){alert('Ticket removal failed: '+e.message)}}
let pendingKey='';
document.addEventListener('click',e=>{const card=e.target.closest?.('.card');if(card)pendingKey=recordKeyForCard(card)},true);
function addButton(){const modal=document.getElementById('detailModal');if(!modal||modal.querySelector('#removeTicket'))return;const a=records(),key=pendingKey,r=a[key];if(!r?.hasTicket)return;const actions=modal.querySelector('.actions'),open=modal.querySelector('#openTicket');if(!actions)return;const b=document.createElement('button');b.id='removeTicket';b.className='btn';b.type='button';b.textContent='Remove Ticket';b.onclick=()=>removeTicket(key);open?open.insertAdjacentElement('afterend',b):actions.appendChild(b)}
new MutationObserver(addButton).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(addButton,0),true);
})();
