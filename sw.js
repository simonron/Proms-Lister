const CACHE = 'proms-finder-v13-banner-menu-overlay';
const ASSETS = ['./', './index.html', './manifest.json', './rah-seating-plan.js', './rah-seating-plan2.jpeg', './data.json', './slide-menu-live.js?v=ef2a790c'];

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
    evt.respondWith(fetch(evt.request, {cache:'no-store'}).then(async res => {
      const type=res.headers.get('content-type')||'';
      if(!type.includes('text/html')) return res;
      let html=await res.text();
      html=html.replace(/<script[^>]+src=["'][^"']*(?:slide-menu-live|live-menu-ui)\.js[^"']*["'][^>]*><\/script>/gi,'');
      html=html.replace('</body>','<script src="slide-menu-live.js?v=ef2a790c"></script></body>');
      return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  const u=new URL(evt.request.url);
  if(u.pathname.endsWith('/slide-menu-live.js')) {
    evt.respondWith(fetch(evt.request,{cache:'no-store'}));
    return;
  }
  evt.respondWith(caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(evt.request,copy)); return res;
  }).catch(()=>cached)));
});
