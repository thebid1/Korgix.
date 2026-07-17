// Migration shim — NOT the app's service worker.
//
// The Korgix PWA used to live at the site root with a root-scoped service
// worker at /sw.js. The app moved to /app/ (with its own /app/sw.js), and the
// root is now the static marketing page. Older installs still have the old
// root worker controlling every page under /, which would keep serving the
// stale cached app and block the landing page.
//
// This file replaces /sw.js so those clients pick it up on their next update
// check. It clears all caches and unregisters itself, handing control back to
// the network. New visitors never register it (the landing page registers no
// service worker).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    await self.registration.unregister();

    // Reload any open pages so they come back without service-worker control.
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate(client.url)));
  })());
});
