/* Service worker de Domaine.
   - Fitxers de l'app: es guarden a la memoria cau per funcionar sense connexio.
   - index.html: primer xarxa (per rebre sempre l'ultima versio), i si no n'hi ha, la copia guardada.
   - APIs externes (temps, ubicacio, festius): sempre per xarxa, mai a la memoria cau. */
var VERSIO = 'domaine-v3';
var FITXERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSIO).then(function (c) { return c.addAll(FITXERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claus) {
      return Promise.all(claus.filter(function (k) { return k !== VERSIO; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* APIs externes: el navegador ho gestiona normalment */

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copia = resp.clone();
        caches.open(VERSIO).then(function (c) { c.put('./index.html', copia); });
        return resp;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
