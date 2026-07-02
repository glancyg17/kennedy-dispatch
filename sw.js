// Kennedy Executive Travel — Service Worker
const CACHE_NAME = 'ket-dispatch-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
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
  // Network first for API calls, cache first for assets
  if(e.request.url.includes('supabase.co')){
    e.respondWith(fetch(e.request).catch(function(){
      return new Response('{}',{headers:{'Content-Type':'application/json'}});
    }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(response){
        return response;
      });
    })
  );
});
