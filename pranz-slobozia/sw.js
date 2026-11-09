// Always fetch current menus. Installation does not require offline ordering.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Revalidate the public HTML while allowing the browser to cache static assets.
const home = new URL(self.registration.scope);
const publicPages = new Set(
  ['./', './index.html', './meniul-zilei/', './meniul-zilei/index.html']
    .map(path => new URL(path, home).pathname)
);

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin === home.origin && publicPages.has(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-cache' }));
  }
});
