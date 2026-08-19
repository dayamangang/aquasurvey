/**
 * AquaSurvey Pro - Service Worker
 * Caches application assets for offline field surveys.
 */

const CACHE_NAME = 'aquasurvey-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/index.css',
  './css/camera.css',
  './css/parameters.css',
  './css/map-records.css',
  './css/mobile.css',
  './js/geolocation.js',
  './js/camera.js',
  './js/watermark.js',
  './js/parameters.js',
  './js/storage.js',
  './js/map.js',
  './js/export.js',
  './js/app.js',
  './assets/icar_logo.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🌊 Caching offline field survey assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new requests dynamically if valid
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return offline fallback if network fails
        return caches.match('./index.html');
      });
    })
  );
});
