/* Daily Cue — service worker (el "ayudante" que deja abrir la app sin conexión).
   Siempre intenta la red primero (para no servir versiones viejas) y usa la copia guardada solo si no hay internet. */
const CACHE = "dailycue-v1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copia = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./")))
  );
});
