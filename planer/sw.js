// Mój Planer – offline cache of the app shell (data offline is handled by Firestore)
const CACHE="planer-v1";
const SHELL=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png",
 "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
 "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
 "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.pathname.startsWith("/__/")||u.hostname.includes("googleapis.com")&&!u.hostname.startsWith("fonts"))return; // auth & Firestore go to network
  if(e.request.mode==="navigate"){ // network first for the page, so updates arrive quickly
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("index.html",c));return r}).catch(()=>caches.match("index.html")));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok&&(u.origin===location.origin||u.hostname.endsWith("gstatic.com")||u.hostname.startsWith("fonts"))){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})));
});
