/**
 * Albunmanía Service Worker — Web Push handler (Epic 9).
 *
 * The push event arrives with a JSON payload of shape:
 *   { title, body, icon, badge, data: { url } }
 *
 * The notificationclick handler routes the user to the deep link
 * carried in `data.url` — typically the match detail page.
 *
 * On production builds next-pwa may inject Workbox routes on top of
 * this file. The push + notificationclick listeners stay in place
 * because they don't conflict with caching strategies.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: 'Albunmanía', body: event.data?.text() || '' };
  }

  const title = payload.title || 'Albunmanía';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    data: payload.data || {},
    tag: payload.tag || 'albunmania-default',
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsList) => {
        for (const client of clientsList) {
          if (client.url.endsWith(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      }),
  );
});
