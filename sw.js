const CACHE = 'proms-finder-v12-live-slide-menu';
const ASSETS = ['./', './index.html', './manifest.json', './rah-seating-plan.js', './rah-seating-plan2.jpeg', './data.json', './slide-menu-live.js'];

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
    evt.respondWith(fetch(evt.request).then(async res => {
      const type=res.headers.get('content-type')||'';
      if(!type.includes('text/html')) return res;
      let html=await res.text();
      if(!html.includes('slide-menu-live.js')) html=html.replace('</body>','<script src="slide-menu-live.js?v=eadb4400"></script></body>');
      return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  evt.respondWith(caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(evt.request,copy)); return res;
  }).catch(()=>cached)));
});
