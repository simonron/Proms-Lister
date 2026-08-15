const CACHE = 'proms-finder-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(evt.request, resClone));
      return res;
    }).catch(() => cached))
  );
});
