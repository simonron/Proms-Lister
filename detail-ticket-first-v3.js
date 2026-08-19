(()=>{'use strict';
function promoteOpenTicket(){
  const modal=document.getElementById('detailModal');
  if(!modal)return;
  const open=modal.querySelector('#openTicket');
  if(!open||open.disabled||open.hasAttribute('disabled'))return;
  const actions=open.closest('.actions');
  if(!actions)return;
  if(actions.firstElementChild!==open)actions.insertBefore(open,actions.firstElementChild);
  open.classList.add('primary');
}
const observer=new MutationObserver(promoteOpenTicket);
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',promoteOpenTicket,{once:true});else promoteOpenTicket();
})();