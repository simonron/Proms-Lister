(()=>{'use strict';
const ACTIVE='touch-active',MIN_MS=140;
let active=null,started=0,releaseTimer=0;
function buttonFrom(e){const t=e.target;return t&&t.closest?t.closest('button'):null}
function press(e){const b=buttonFrom(e);if(!b||b.disabled)return;clearTimeout(releaseTimer);if(active&&active!==b)active.classList.remove(ACTIVE);active=b;started=performance.now();b.classList.add(ACTIVE)}
function release(){if(!active)return;const b=active,wait=Math.max(0,MIN_MS-(performance.now()-started));clearTimeout(releaseTimer);releaseTimer=setTimeout(()=>{b.classList.remove(ACTIVE);if(active===b)active=null},wait)}
// touchstart is the earliest reliable event on iOS Safari; pointerdown covers mouse/stylus and other browsers.
document.addEventListener('touchstart',press,{capture:true,passive:true});
document.addEventListener('pointerdown',press,true);
document.addEventListener('touchend',release,true);
document.addEventListener('touchcancel',release,true);
document.addEventListener('pointerup',release,true);
document.addEventListener('pointercancel',release,true);
})();