(()=>{'use strict';
const VERSION='3.0.37';
window.PROMS_LISTER_VERSION=VERSION;
function showVersion(){const text='Version '+VERSION;document.querySelectorAll('.hero .version,.version').forEach(el=>{if(el.textContent!==text)el.textContent=text});const title='Proms Lister — '+text;if(document.title!==title)document.title=title}
function start(){showVersion();const app=document.getElementById('app');if(app)new MutationObserver(showVersion).observe(app,{childList:true,subtree:false})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();