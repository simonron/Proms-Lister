(()=>{'use strict';
function keyOf(c){return String(c.id??`${c.date}|${c.time}|${c.title}`)}
document.addEventListener('proms-v3-open-detail',e=>{const id=e.detail&&e.detail.id;if(id!=null&&typeof window.PromsListerOpenDetail==='function'){window.PromsListerSelectedKey=String(id);window.PromsListerOpenDetail(id);setTimeout(()=>{const m=document.getElementById('detailModal');if(m)m.dataset.promKey=String(id)},0)}});
document.addEventListener('click',e=>{const card=e.target.closest('.card[data-id]');if(card)window.PromsListerSelectedKey=card.dataset.id},true);
})();