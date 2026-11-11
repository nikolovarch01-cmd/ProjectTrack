/* ProjectTrack as an app: the page and its icons open from the phone's own copy at once,
   and the copy is refreshed from the network behind it. When the page itself changed,
   the open window is told, so it can reload itself once (no second opening needed).
   Data never goes through here - it comes from GitHub's API on another address. */
const SHELL="pt-shell-v3";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const req=e.request,u=new URL(req.url),base=new URL("./",self.registration.scope);
  if(req.method!=="GET"||u.origin!==location.origin||!u.pathname.startsWith(base.pathname))return;
  const page=req.mode==="navigate", asset=/\.(png|webmanifest)$/.test(u.pathname);
  if(!page&&!asset)return;
  const key=page?base.href:req.url;
  e.respondWith(caches.open(SHELL).then(async c=>{
    const hit=await c.match(key);
    /* GitHub's servers keep the page up to 10 minutes; a fresh address each time gets past them */
    const net=fetch(page?base.href+"?fresh="+Date.now():req.url,{cache:"no-store",credentials:"same-origin"}).then(async r=>{
      if(r.ok){
        if(page&&hit){const [a,b]=await Promise.all([hit.clone().text(),r.clone().text()]);
          if(a!==b){await c.put(key,r.clone());const cl=await self.clients.get(e.resultingClientId||e.clientId);
            const all=cl?[cl]:await self.clients.matchAll({type:"window"});all.forEach(x=>x.postMessage({type:"pt-updated"}));return r}}
        await c.put(key,r.clone());
      }
      return r}).catch(()=>hit);
    if(hit)e.waitUntil(net.catch(()=>{}));
    return hit||net;
  }));
});
