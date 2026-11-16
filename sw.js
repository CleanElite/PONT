// PONT offline safety: never serve a cached daily menu or permit offline checkout.
const OFFLINE_CACHE='pont-offline-v1';
const OFFLINE_PATH=new URL('./offline.html',self.registration.scope).pathname;
self.addEventListener('install',event=>event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.add(OFFLINE_PATH)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
 self.clients.claim(),
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pont-offline-')&&key!==OFFLINE_CACHE).map(key=>caches.delete(key))))
])));
const publicPages=new Set(['./','./index.html','./meniul-zilei/','./meniul-zilei/index.html','./iesire-in-oras/','./iesire-in-oras/index.html','./promovare/','./promovare/index.html']
 .map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'||request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!publicPages.has(url.pathname))return;
 event.respondWith(fetch(request,{cache:'no-cache'}).catch(async()=>{
  const cache=await caches.open(OFFLINE_CACHE);
  return await cache.match(OFFLINE_PATH)||Response.error();
 }));
});
