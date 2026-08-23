/* Bitácora — funcionamiento sin conexión.
   Sube la versión cada vez que cambies index.html para forzar la actualización. */
const VERSION = 'bitacora-v15';
const ESENCIALES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './favicon.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ESENCIALES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // si falla algún archivo, seguimos igual
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  // Lo que viene de fuera (tipografías, el lector de imágenes) no lo tocamos
  if(url.origin !== self.location.origin) return;

  // La página siempre desde la red si se puede, para que las mejoras lleguen solas
  if(req.mode === 'navigate'){
    ev.respondWith(
      fetch(req)
        .then(r => {
          const copia = r.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copia));
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // El resto: primero lo guardado, y si no está, a la red
  ev.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if(r && r.status === 200){
        const copia = r.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
      }
      return r;
    }).catch(() => hit))
  );
});
