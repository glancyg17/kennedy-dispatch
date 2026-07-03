// Kennedy Executive Travel — Service Worker
const CACHE_NAME = 'ket-dispatch-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/app-icon.jpg',
  '/manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);})
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Always network-first for the main HTML file so updates are picked up
  if(e.request.url.endsWith('/') || e.request.url.endsWith('/index.html')){
    e.respondWith(
      fetch(e.request).then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,clone);});
        return response;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
  // Network first for Supabase
  if(e.request.url.includes('supabase.co')){
    e.respondWith(fetch(e.request).catch(function(){
      return new Response('[]',{headers:{'Content-Type':'application/json'}});
    }));
    return;
  }
  // Cache first for other assets
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,clone);});
        return response;
      });
    })
  );
});
