// Offline support: serve from the network when possible, fall back to the cache.
// Keep in step with SF.VERSION in js/util.js.
const CACHE = 'sprite-fighters-1.5.0';
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'js/util.js',
  'js/audio.js',
  'js/input.js',
  'js/net.js',
  'js/vendor/peerjs.min.js',
  'js/draw.js',
  'js/fighters.js',
  'js/fighters2.js',
  'js/fighters3.js',
  'js/fighters4.js',
  'js/stages.js',
  'js/effects.js',
  'js/fighter.js',
  'js/ai.js',
  'js/game.js',
  'js/ui.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
