const CACHE='proms-lister-version-3.0.21';
const LOCAL=['./','./index.html','./styles-v3.css','./app-v3.js','./ticket-reader-v3.js','./seat-map-header-v3.js','./browse-controls-v3.js','./browse-fixes-v3.js','./detail-delegate-v3.js','./heif-input-v3.js','./version-v3.js','./page-chrome-v3.js','./ticket-popup-v3.js','./ticket-remove-v3.js','./manifest.json','./icon.png','./data.json','./rah-seating-plan2.jpeg'];
const CDN=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js','https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','https://unpkg.com/tesseract.js@5/dist/tesseract.min.js','https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'];
const CDN_HOSTS=new Set(['cdnjs.cloudflare.com','unpkg.com','cdn.jsdelivr.net']);
const NETWORK_TIMEOUT=2500;

async function fetchWithTimeout(request,ms=NETWORK_TIMEOUT){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{return await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}
}
function cacheable(response){return response&&(response.ok||response.type==='opaque')}
async function put(cache,request,response){if(cacheable(response)){try{await cache.put(request,response.clone())}catch{}}return response}
async function cached(cache,request,allowIgnoreSearch=false){return (await cache.match(request))||(allowIgnoreSearch?await cache.match(request,{ignoreSearch:true}):null)}
async function refresh(cache,request){try{const response=await fetch(new Request(request,{cache:'no-cache'}));await put(cache,request,response)}catch{}}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of LOCAL){
      try{const request=new Request(url,{cache:'reload'});const response=await fetch(request);await put(cache,request,response)}catch(err){console.warn('Offline local cache skipped',url,err)}
    }
    for(const url of CDN){
      try{const request=new Request(url,{mode:'no-cors',cache:'reload'});const response=await fetch(request);await put(cache,request,response)}catch(err){console.warn('Offline CDN cache skipped',url,err)}
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('proms-lister-version-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const local=url.origin===self.location.origin;
  const cdn=CDN_HOSTS.has(url.hostname);
  if(!local&&!cdn)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);

    if(cdn){
      const hit=await cached(cache,event.request,true);
      if(hit){event.waitUntil(refresh(cache,event.request));return hit}
      try{return await put(cache,event.request,await fetchWithTimeout(event.request,4000))}catch{return Response.error()}
    }

    if(event.request.mode==='navigate'){
      try{
        const response=await fetchWithTimeout(new Request(event.request,{cache:'no-cache'}));
        return await put(cache,event.request,response);
      }catch{
        return (await cached(cache,event.request,true))||(await cache.match('./index.html',{ignoreSearch:true}))||Response.error();
      }
    }

    const exact=await cached(cache,event.request,false);
    if(exact){event.waitUntil(refresh(cache,event.request));return exact}

    try{return await put(cache,event.request,await fetchWithTimeout(new Request(event.request,{cache:'no-cache'})))}catch{
      return (await cached(cache,event.request,true))||Response.error();
    }
  })());
});
