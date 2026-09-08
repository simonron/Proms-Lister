(()=>{'use strict';
const VERSION='3.0.35';
window.PROMS_LISTER_VERSION=VERSION;
function showVersion(){
  const text='Version '+VERSION;
  document.querySelectorAll('.hero .version,.version').forEach(el=>{if(el.textContent!==text)el.textContent=text});
  const title='Proms Lister — '+text;
  if(document.title!==title)document.title=title;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showVersion,{once:true});else showVersion();
})();
