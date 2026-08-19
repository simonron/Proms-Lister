(()=>{'use strict';
function buttonFrom(e){const t=e.target;return t&&t.closest?t.closest('button'):null}
function down(e){const b=buttonFrom(e);if(!b||b.disabled)return;b.classList.add('touch-active')}
function clear(e){const b=buttonFrom(e);if(b)b.classList.remove('touch-active');document.querySelectorAll('button.touch-active').forEach(x=>x.classList.remove('touch-active'))}
// Capture pointerdown so visual feedback is applied before click handlers/navigation run.
document.addEventListener('pointerdown',down,true);
document.addEventListener('pointerup',clear,true);
document.addEventListener('pointercancel',clear,true);
})();