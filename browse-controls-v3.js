(()=>{'use strict';
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function shiftValue(v,days){if(!v)return'';const d=new Date(v+'T12:00:00');d.setDate(d.getDate()+days);return iso(d)}
function fmtDate(v){if(!v)return'';return new Date(v+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function showEmptyDay(){const f=document.getElementById('from'),t=document.getElementById('to'),results=document.getElementById('results'),count=document.getElementById('count');if(!f||!t||!results||f.value!==t.value)return;requestAnimationFrame(()=>{if(results.querySelector('.card'))return;if(count)count.textContent='No booked Prom';results.innerHTML='<div class="empty-booked-day" style="min-height:55vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;font-size:clamp(2.5rem,9vw,6rem);font-weight:700;line-height:1.05">'+fmtDate(f.value)+'</div>'})}
function refresh(){const f=document.getElementById('from'),t=document.getElementById('to');if(f)f.dispatchEvent(new Event('input',{bubbles:true}));if(t)t.dispatchEvent(new Event('input',{bubbles:true}));showEmptyDay()}
function install(){const row=document.querySelector('.toolbar .row'),f=document.getElementById('from'),t=document.getElementById('to');if(!row||!f||!t||document.getElementById('browseToday'))return;
 const today=document.createElement('button');today.id='browseToday';today.type='button';today.className='chip';today.textContent='Today';today.onclick=()=>{const d=iso(new Date());f.value=d;t.value=d;refresh()};
 const down=document.createElement('button');down.id='browseDayDown';down.type='button';down.className='chip';down.textContent='Day −';down.onclick=()=>{f.value=shiftValue(f.value,-1);t.value=shiftValue(t.value,-1);refresh()};
 const up=document.createElement('button');up.id='browseDayUp';up.type='button';up.className='chip';up.textContent='Day +';up.onclick=()=>{f.value=shiftValue(f.value,1);t.value=shiftValue(t.value,1);refresh()};
 const mine=document.getElementById('mineToggle');row.insertBefore(today,mine||null);row.insertBefore(down,mine||null);row.insertBefore(up,mine||null);showEmptyDay();
}
const mo=new MutationObserver(()=>install());mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();