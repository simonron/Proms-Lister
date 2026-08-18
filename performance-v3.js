(()=>{'use strict';
const originalParse=JSON.parse.bind(JSON);
let lastJSONText=null,lastJSONValue=null;
JSON.parse=function(text,reviver){
  if(reviver)return originalParse(text,reviver);
  if(typeof text==='string'&&text===lastJSONText)return lastJSONValue;
  const value=originalParse(text);
  if(typeof text==='string'&&text.length<1000000){lastJSONText=text;lastJSONValue=value}
  return value;
};
function showBusy(label='Loading…'){
  let el=document.getElementById('routeLoading');
  if(!el){
    el=document.createElement('div');el.id='routeLoading';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="bootSpinner" aria-hidden="true"></div><div class="routeLoadingText"></div>';
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'99999',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px',background:'rgba(78,20,26,.96)',color:'#fff',font:'600 18px system-ui,-apple-system,sans-serif'});
    document.body.appendChild(el);
  }
  el.querySelector('.routeLoadingText').textContent=label;
}
function hideBusy(){document.getElementById('routeLoading')?.remove()}
const replaying=new WeakSet();
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-go]');
  if(!button||replaying.has(button))return;
  const route=button.dataset.go;
  if(!['browse','mine','tonight'].includes(route))return;
  event.preventDefault();event.stopImmediatePropagation();
  showBusy(route==='browse'?'Loading Proms…':route==='mine'?'Loading My Proms…':'Loading Tonight’s Prom…');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    replaying.add(button);button.click();replaying.delete(button);setTimeout(hideBusy,0);
  }));
},true);
})();