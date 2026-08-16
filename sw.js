const CACHE='proms-lister-version-3.0.11';
const CORE=['./styles-v3.css','./app-v3.js','./ticket-reader-v3.js','./seat-map-header-v3.js','./browse-controls-v3.js','./browse-fixes-v3.js','./detail-delegate-v3.js','./heif-input-v3.js','./version-v3.js','./page-chrome-v3.js','./ticket-popup-v3.js','./ticket-remove-v3.js','./manifest.json','./icon.png','./data.json','./rah-seating-plan2.jpeg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(x=>new Request(x,{cache:'reload'})))).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 const req=new Request(e.request,{cache:'no-store'});
 e.respondWith(fetch(req).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(u.pathname.endsWith('/')?'./index.html':e.request))));
});