(()=>{'use strict';
// Keep startup intentionally light. OCR is loaded by the page, but the expensive
// recognition worker only starts when an image ticket is actually processed.
// Stored tickets are not rescanned automatically on every page load.
})();
