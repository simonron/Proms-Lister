/* TEMPORARY DIAGNOSTIC BUILD
   The standalone RAH enhancement module is intentionally disabled.
   The main Proms Lister contains its own seating-plan viewer.
   This isolates the remaining hang to the main viewer without any background loops,
   observers, requestAnimationFrame polling, hover mapping or correction processing. */
(function(){
'use strict';
window.RAHSeatMap={disabled:true};
})();
