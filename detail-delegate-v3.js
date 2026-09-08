(()=>{'use strict';
/* Version 3.0.36: filtered/rebuilt Browse cards must use the core app's detail/ticket path. */
document.addEventListener('proms-v3-open-detail',e=>{
  const id=e.detail&&e.detail.id;
  if(id!=null&&typeof window.PromsListerOpenDetail==='function')window.PromsListerOpenDetail(id);
});
})();