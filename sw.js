const CACHE='proms-lister-version-3.0.31';
// Only files required to start and browse the app are pre-cached.
// OCR, ZIP and HEIC libraries are deliberately excluded and must only be fetched by features that explicitly need them.
const LOCAL=[
  './','./index.html','./styles-v3.css','./app-v3.js','./performance-v3.js',
  './ticket-reader-v3.js','./seat-map-header-v3.js','./browse-controls-v3.js','./browse-fixes-v3.js',
  './detail-delegate-v3.js','./detail-ticket-first-v3.js','./version-v3.js','./page-chrome-v3.js','./ticket-popup-v3.js','./ticket-remove-v3.js',
  './manifest.json','./icon.png','./data.json','./rah-seating-plan2.jpeg',
  './vendor/pdf.min.js','./vendor/pdf.worker.min.js'
];
const NETWORK_TIMEOUT=1800;
async function fetchWithTimeout(request,ms=NETWORK_TIMEOUT){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);try{return await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}}
function cacheable(response){return response&&response.ok}
async function put(cache,request,response){if(cacheable(response)){try{await cache.put(request,response.clone())}catch{}}return response}
async function match(cache,request){return(await cache.match(request))||(await cache.match(request,{ignoreSearch:true}))}
function refresh(cache,request){fetch(new Request(request,{cache:'no-cache'})).then(response=>put(cache,request,response)).catch(()=>{})}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(LOCAL.map(async url=>{const request=new Request(url,{cache:'reload'});const response=await fetch(request);await put(cache,request,response)}))})());self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('proms-lister-version-')&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await match(cache,event.request);if(hit){refresh(cache,event.request);return hit}try{return await put(cache,event.request,await fetchWithTimeout(new Request(event.request,{cache:'no-cache'})))}catch{if(event.request.mode==='navigate')return(await cache.match('./index.html',{ignoreSearch:true}))||Response.error();return Response.error()}})())});