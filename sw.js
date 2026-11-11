/* ProjectTrack as an app: the page and its icons open from the phone's own copy at once,
   and the copy is refreshed from the network behind it (the new version shows on the next open).
   Data never goes through here - it comes from GitHub's API on another address. */
const SHELL="pt-shell-v1";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  const req=e.request,u=new URL(req.url);
  if(req.method!=="GET"||u.origin!==location.origin||!u.pathname.startsWith(new URL("./",self.registration.scope).pathname))return;
  const page=req.mode==="navigate", asset=/\.(png|webmanifest)$/.test(u.pathname);
  if(!page&&!asset)return;
  const key=page?new URL("./",self.registration.scope).href:req.url;
  e.respondWith(caches.open(SHELL).then(async c=>{
    const hit=await c.match(key);
    const net=fetch(req,{cache:"no-cache"}).then(r=>{if(r.ok)c.put(key,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
