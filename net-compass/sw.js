/* NET Compass service worker — full offline after first load. */
const VERSION = 'net-compass-v1.0.0';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/runtime.js',
  './js/store.js',
  './js/engine.js',
  './js/data/syllabus.js',
  './js/data/quotes.js',
  './js/ui/dom.js',
  './js/ui/icons.js',
  './js/ui/charts.js',
  './js/ui/actions.js',
  './js/ui/windows.js',
  './js/ui/links.js',
  './js/ui/onboarding.js',
  './js/ui/today.js',
  './js/ui/session.js',
  './js/ui/calendar.js',
  './js/ui/syllabus.js',
  './js/ui/tests.js',
  './js/ui/errors.js',
  './js/ui/cards.js',
  './js/ui/resources.js',
  './js/ui/analytics.js',
  './js/ui/backlog.js',
  './js/ui/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigations: network first so updates land, fall back to cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Same-origin assets: cache first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
    return;
  }

  // Google Fonts and anything else: stale-while-revalidate, ignore failures offline.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const network = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    );
  }
});
