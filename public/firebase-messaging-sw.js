// Firebase Cloud Messaging service worker
// This file handles background push notifications

self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  const data = event.data?.json() || {};
  const title = data.notification?.title || data.title || 'Korgix';
  const options = {
    body: data.notification?.body || data.body || 'You have a new notification',
    icon: data.notification?.icon || data.icon || '/icons/Korgix.png',
    badge: data.notification?.badge || data.badge || '/icons/Korgix.png',
    tag: data.notification?.tag || data.tag || 'fcm-default',
    requireInteraction: true,
    data: data.data || data,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
