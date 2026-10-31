const CACHE = 'mi-trakt-v25';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Carátulas de TMDB: caché primero, se guardan al verlas
  if (url.hostname === 'image.tmdb.org') {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))
      ).catch(() => fetch(req))
    );
    return;
  }

  // Datos de Trakt y TMDB: siempre de la red, sin cachear
  if (url.origin !== location.origin) return;

  // Archivos de la app: red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(
    fetch(req).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
