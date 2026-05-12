/**
 * Albunmanía Service Worker — Web Push handlers (Epic 9).
 *
 * This file is NOT the Service Worker itself. next-pwa generates the
 * real `public/sw.js` (Workbox: precache + runtime caching) on build,
 * and `importScripts('/sw-push.js')` (configured in next.config.ts)
 * pulls these listeners into that generated worker.
 *
 * Keeping the push logic here means `npm run build` never clobbers it
 * — the generated sw.js owns caching, this file owns notifications.
 *
 * Push payload shape (from backend services/push_notify.py):
 *   { title, body, icon, badge, data: { url } }
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: 'Albunmanía', body: event.data ? event.data.text() : '' };
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
