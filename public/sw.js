/* KodeCupid service worker — prototype offline shell.
 * Strategy:
 *  - Pre-cache the app shell on install.
 *  - Navigations: network-first, fall back to cached shell (offline support).
 *  - Same-origin GET assets: stale-while-revalidate.
 * Production note: replace with Workbox / vite-plugin-pwa for versioned precache manifests,
 * and add a real Web Push handler here (`self.addEventListener('push', ...)`).
 */
const CACHE = 'kodecupid-shell-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(CORE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

// Mock hook for future push support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'You have a new KodeCupid update';
  event.waitUntil(self.registration.showNotification('KodeCupid', { body: data, icon: './icons/icon-192.png' }));
});
