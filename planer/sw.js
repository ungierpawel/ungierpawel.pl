// Mój Planer – offline copy of the app. The page itself is always fetched fresh from the network
// (bypassing the browser cache) and the stored copy is used only when there is no internet.
const CACHE="planer-v13";
const LIBS=["https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
 "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
 "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"];
const LOCAL=["./","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all([
  ...LOCAL.map(u=>fetch(u,{cache:"no-store"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})),
  ...LIBS.map(u=>c.add(u).catch(()=>{}))])).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.pathname.startsWith("/__/")||u.hostname.includes("googleapis.com")&&!u.hostname.startsWith("fonts")||u.hostname==="accounts.google.com")return;
  if(e.request.mode==="navigate"||(u.origin===location.origin&&/\/(index\.html)?$/.test(u.pathname))){ // the app page: always fresh
    e.respondWith(fetch(u.origin+u.pathname+u.search,{cache:"no-store",credentials:"same-origin"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put("./",c))}return r})
      .catch(()=>caches.match("./")));return}
  if(u.origin===location.origin){ // other own files: network first, offline copy as fallback
    e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request)));return}
  if(u.hostname.endsWith("gstatic.com")||u.hostname.startsWith("fonts")) // versioned libraries: cache first
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})));
});
// tapping a reminder opens (or focuses) the planner on the calendar
self.addEventListener("notificationclick",e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||"./#cal";
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.includes("/planer/")){c.focus();return}}return self.clients.openWindow(url)}))});
