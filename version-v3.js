(()=>{'use strict';
const script=document.currentScript;
let VERSION='';
try{VERSION=new URL(script?.src||'',location.href).searchParams.get('v')||''}catch{}
if(!VERSION){
  const m=document.title.match(/Version\s+([0-9]+(?:\.[0-9]+)*)/i);
  VERSION=m?.[1]||'unknown';
}
window.PROMS_LISTER_VERSION=VERSION;
function showVersion(){
  const text='Version '+VERSION;
  document.querySelectorAll('.hero .version,.version').forEach(el=>{if(el.textContent!==text)el.textContent=text});
  const title='Proms Lister — '+text;
  if(document.title!==title)document.title=title;
}
function start(){
  showVersion();
  const root=document.getElementById('app')||document.body;
  if(root&&window.MutationObserver){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;showVersion()});
    });
    observer.observe(root,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
