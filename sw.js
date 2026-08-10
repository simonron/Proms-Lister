const CACHE = 'proms-finder-v14-direct-menu-ui';
const ASSETS = ['./', './index.html', './manifest.json', './rah-seating-plan.js', './rah-seating-plan2.jpeg', './data.json'];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  if (evt.request.mode === 'navigate') {
    evt.respondWith(fetch(evt.request, {cache:'no-store'}).catch(()=>caches.match('./index.html')));
    return;
  }
  evt.respondWith(caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
    const copy=res.clone();
    caches.open(CACHE).then(c => c.put(evt.request,copy));
    return res;
  }).catch(()=>cached)));
});
