/* Mi Bitácora Secundaria (tablet) — guarda la app en la tablet para que abra sin internet.
   Solo guarda los archivos del programa; los datos del docente nunca pasan por aquí.
   Al publicar una versión nueva, cambia VERSION para que la tablet la descargue. */
const VERSION = 'mb-sec-tablet-v0.13.0-7';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('mb-sec-tablet-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Primero lo guardado (abre al instante y sin internet); si hay internet, se actualiza en segundo plano. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const clave = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(VERSION).then(async c => {
    const guardado = await c.match(clave, {ignoreSearch: true});
    const red = fetch(req).then(r => { if (r && r.ok && r.type === 'basic') c.put(clave, r.clone()); return r; }).catch(() => null);
    if (guardado) { e.waitUntil(red); return guardado; }
    return (await red) || new Response('Sin conexión', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
