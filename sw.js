// Kennedy Executive Travel — Service Worker v4
const CACHE_NAME = 'ket-dispatch-v4';
const STATIC = ['/logo.png','/app-icon.png','/manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(c){return c.addAll(STATIC);}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var url = e.request.url;
  // Never cache the main HTML - always get fresh
  if(url.endsWith('/')||url.endsWith('/index.html')||url.endsWith('.html')){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }
  // Never cache Supabase
  if(url.includes('supabase.co')){
    e.respondWith(fetch(e.request));
    return;
  }
  // Cache static assets
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached||fetch(e.request).then(function(r){
        var c=r.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,c);});
        return r;
      });
    })
  );
});
