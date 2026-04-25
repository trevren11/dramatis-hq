/// <reference lib="webworker" />

// Service Worker for Push Notifications
const SW_VERSION = "1.0.0";

// Install event - activate immediately
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v" + SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

// Activate event - claim clients immediately
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v" + SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Push event - display notification
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  if (!event.data) {
    console.warn("[SW] Push event without data");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
    return;
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    tag: data.tag,
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    actions: data.actions || [],
  };

  // Vibration pattern for mobile
  if (!data.silent) {
    options.vibrate = [200, 100, 200];
  }

  event.waitUntil(self.registration.showNotification(data.title || "Dramatis HQ", options));
});

// Notification click - open the app or navigate
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification.tag);

  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || "/";
  const notificationId = notificationData?.notificationId;

  event.waitUntil(
    (async () => {
      // Record click if we have a notification ID
      if (notificationId) {
        try {
          await fetch(`/api/notifications/${notificationId}/click`, {
            method: "POST",
            credentials: "same-origin",
          });
        } catch (e) {
          console.error("[SW] Failed to record click:", e);
        }
      }

      // Try to focus an existing window/tab
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Look for an existing app window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          await client.focus();
          // Navigate if needed
          if (urlToOpen !== "/" && !client.url.endsWith(urlToOpen)) {
            await client.navigate(urlToOpen);
          }
          return;
        }
      }

      // No existing window, open a new one
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Notification close - could track dismissals
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);
});

// Handle push subscription change (key rotation)
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[SW] Push subscription changed");

  event.waitUntil(
    (async () => {
      try {
        // Resubscribe with the new subscription
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          // applicationServerKey would need to be fetched from the server
        });

        // Send the new subscription to the server
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))),
            },
          }),
        });

        console.log("[SW] Resubscribed successfully");
      } catch (e) {
        console.error("[SW] Failed to resubscribe:", e);
      }
    })()
  );
});
