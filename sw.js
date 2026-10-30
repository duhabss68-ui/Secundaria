/* Mi Bitácora Secundaria (tablet) — guarda el programa en la tablet para que abra sin internet.
   Solo guarda los archivos del programa; los datos del docente nunca pasan por aquí.
   Este archivo lo genera herramientas/hacer_tablet.py: no lo edites a mano. */
const VERSION = 'mb-sec-tablet-1.7';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-maskable-512.png'];
const fresco = u => fetch(new Request(u, {cache: 'reload'}));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(ARCHIVOS.map(u =>
    fresco(u).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('mb-sec-tablet-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const pagina = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (pagina) {
    /* Con internet: siempre la versión más nueva (sin caché). Sin internet o si tarda: la guardada. */
    e.respondWith(caches.open(VERSION).then(async c => {
      const guardada = () => c.match('./index.html');
      try {
        const r = await Promise.race([
          fetch(url.href, {cache: 'no-store', credentials: 'same-origin'}),
          new Promise((_, no) => setTimeout(() => no(new Error('lento')), 6000))]);
        if (r && r.ok) { c.put('./index.html', r.clone()); return r; }
        return (await guardada()) || r;
      } catch (err) {
        return (await guardada()) || new Response('Sin conexión', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
      }
    }));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async c =>
    (await c.match(req, {ignoreSearch: true})) || fetch(req).then(r => { if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; })));
});
