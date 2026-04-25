/// <reference lib="webworker" />

// Service Worker for Push Notifications and Offline Caching
const SW_VERSION = "1.1.0";
const CACHE_NAME = `dramatis-cache-v${SW_VERSION}`;

// Static assets to cache for offline use
const STATIC_ASSETS = ["/", "/manifest.json", "/icons/icon-192.svg", "/icons/icon-512.svg"];

// Install event - cache static assets and activate immediately
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v" + SW_VERSION);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v" + SW_VERSION);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("dramatis-cache-") && name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - serve from cache with network fallback (stale-while-revalidate for static assets)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and API calls
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // For navigation requests, use network-first strategy
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // For static assets (images, scripts, styles), use stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$/) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);

          return cached || fetchPromise;
        });
      })
    );
    return;
  }
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
