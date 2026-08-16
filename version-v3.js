(()=>{'use strict';
const VERSION='3.0.18';
window.PROMS_LISTER_VERSION=VERSION;
function showVersion(){
  const text='Version '+VERSION;
  document.querySelectorAll('.hero .version,.version').forEach(el=>{el.textContent=text});
  document.title='Proms Lister — '+text;
}
function start(){
  showVersion();
  const app=document.getElementById('app');
  if(app)new MutationObserver(showVersion).observe(app,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
