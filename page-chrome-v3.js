(()=>{'use strict';
function currentVersion(){return window.PROMS_LISTER_VERSION||'3.0.17'}
function syncVersion(){const v='Version '+currentVersion();document.querySelectorAll('.hero .version,.version').forEach(el=>{if(el.textContent!==v)el.textContent=v});const t='Proms Lister — '+v;if(document.title!==t)document.title=t}
function closePage(){const modal=document.querySelector('#mapModal,#detailModal');if(modal){modal.remove();return}const home=document.querySelector('[data-home]');if(home){home.click();return}if(history.length>1){history.back();return}window.close()}
function isStartPage(){return !!document.querySelector('#app .menu [data-go]')&&!document.querySelector('#mapModal,#detailModal')}
function ensureClose(){let b=document.getElementById('pageClose');if(isStartPage()){if(b)b.remove();return}if(!b){b=document.createElement('button');b.id='pageClose';b.className='page-close';b.type='button';b.setAttribute('aria-label','Close current page');b.title='Close';b.textContent='×';b.addEventListener('click',closePage);document.body.appendChild(b)}}
function refresh(){syncVersion();ensureClose()}
const style=document.createElement('style');style.textContent='.page-close{position:fixed;right:max(12px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 12px);z-index:500;width:42px;height:42px;border:1px solid rgba(33,28,24,.25);border-radius:50%;background:rgba(255,255,255,.94);color:#4e141a;font-size:28px;font-weight:500;line-height:38px;text-align:center;box-shadow:0 4px 16px rgba(33,28,24,.2);padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}.page-close:active{transform:scale(.94)}@media(max-width:620px){.page-close{right:max(9px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 9px);width:40px;height:40px;line-height:36px}}';document.head.appendChild(style);
const start=()=>{refresh();const app=document.getElementById('app');if(app)new MutationObserver(()=>queueMicrotask(refresh)).observe(app,{childList:true,subtree:false});setTimeout(refresh,0);setTimeout(refresh,250);setTimeout(refresh,1000)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
