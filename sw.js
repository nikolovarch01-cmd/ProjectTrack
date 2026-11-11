/* ProjectTrack as an app: the page and its icons open from the phone's own copy at once,
   and the copy is refreshed from the network behind it. The page itself checks for a newer
   build right after opening and takes it (index.html, checkNewer).
   Data never goes through here - it comes from GitHub's API on another address.
   SHELL must match SHELL_CACHE in index.html. */
const SHELL="pt-shell-v4";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const req=e.request,u=new URL(req.url),base=new URL("./",self.registration.scope);
  if(req.method!=="GET"||u.origin!==location.origin||!u.pathname.startsWith(base.pathname))return;
  const page=req.mode==="navigate", asset=/\.(png|webmanifest)$/.test(u.pathname);
  if(!page&&!asset)return;
  const key=page?base.href:req.url;
  /* GitHub's servers keep the page up to 10 minutes; a fresh address each time gets past them */
  const net=caches.open(SHELL).then(c=>fetch(page?base.href+"?fresh="+Date.now():req.url,{cache:"no-store",credentials:"same-origin"})
    .then(async r=>{if(r.ok)await c.put(key,r.clone());return r}));
  e.waitUntil(net.catch(()=>{}));
  e.respondWith(caches.open(SHELL).then(c=>c.match(key)).then(hit=>hit||net));
});
