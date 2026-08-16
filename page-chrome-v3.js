(()=>{'use strict';
function currentVersion(){return window.PROMS_LISTER_VERSION||'3.0.9'}
function syncVersion(){document.querySelectorAll('.version').forEach(el=>{el.textContent='Version '+currentVersion()});document.title='Proms Lister — Version '+currentVersion()}
function closePage(){const modal=document.querySelector('#mapModal,#detailModal');if(modal){modal.remove();return}const home=document.querySelector('[data-home]');if(home){home.click();return}if(history.length>1){history.back();return}window.close()}
function ensureClose(){let b=document.getElementById('pageClose');if(!b){b=document.createElement('button');b.id='pageClose';b.className='page-close';b.type='button';b.setAttribute('aria-label','Close current page');b.title='Close';b.textContent='×';b.addEventListener('click',closePage);document.body.appendChild(b)}syncVersion()}
const style=document.createElement('style');style.textContent='.page-close{position:fixed;right:max(12px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 12px);z-index:500;width:42px;height:42px;border:1px solid rgba(33,28,24,.25);border-radius:50%;background:rgba(255,255,255,.94);color:#4e141a;font-size:28px;font-weight:500;line-height:38px;text-align:center;box-shadow:0 4px 16px rgba(33,28,24,.2);padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}.page-close:active{transform:scale(.94)}@media(max-width:620px){.page-close{right:max(9px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 9px);width:40px;height:40px;line-height:36px}}';document.head.appendChild(style);
new MutationObserver(ensureClose).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureClose);else ensureClose();
})();
