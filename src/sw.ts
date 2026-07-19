/// <reference lib="webworker" />

import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Precache all assets built by Vite.
precacheAndRoute(self.__WB_MANIFEST);

// Remove caches that are no longer in the precache manifest.
cleanupOutdatedCaches();

// Claim clients as soon as the service worker activates.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Allow the app to tell the service worker to skip waiting and activate immediately.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// SPA fallback: return the app shell for navigation requests.
// The worker is served from /app/, so its scope is limited to the app and it
// never intercepts the marketing landing page at the site root.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/app/index.html'))
);

// Cache Google Fonts at runtime.
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
  })
);

// FCM push handler — used by Firebase Cloud Messaging for background notifications.
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.notification?.title || data.title || 'Korgix';
  const options = {
    body: data.notification?.body || data.body || 'You have a new notification',
    icon: data.notification?.icon || data.icon || '/app/icons/Korgix.png',
    badge: data.notification?.badge || data.badge || '/app/icons/Korgix.png',
    tag: data.notification?.tag || data.data?.tag || data.tag || 'fcm-default',
    requireInteraction: true,
    data: data.data || data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        if (windowClients.length > 0) {
          windowClients[0].focus();
        } else {
          self.clients.openWindow('/app/');
        }
      })
  );
});
