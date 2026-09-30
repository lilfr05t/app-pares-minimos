const CACHE_NAME = 'fonemasens-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './audio/word_carro.mp3',
  './audio/word_perro.mp3',
  './audio/word_bano.mp3',
  './audio/word_pelota.mp3',
  './audio/word_manzana.mp3',
  './audio/word_cuchara.mp3',
  './audio/syl_ca_stressed.mp3',
  './audio/syl_rro.mp3',
  './audio/syl_pe_stressed.mp3',
  './audio/syl_ba_stressed.mp3',
  './audio/syl_no.mp3',
  './audio/syl_pe.mp3',
  './audio/syl_lo_stressed.mp3',
  './audio/syl_ta.mp3',
  './audio/syl_man.mp3',
  './audio/syl_za_stressed.mp3',
  './audio/syl_na.mp3',
  './audio/syl_cu.mp3',
  './audio/syl_cha_sustained.mp3',
  './audio/syl_ra.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        return cachedResponse || fetch(e.request);
      })
    );
  }
});
