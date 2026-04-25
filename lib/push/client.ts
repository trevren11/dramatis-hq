/**
 * Client-side push notification utilities
 * This file should only be imported in client components
 */

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[Push] Service worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[Push] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Get existing service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // Get VAPID public key from server
    const response = await fetch("/api/push/vapid-public-key");
    if (!response.ok) {
      console.error("[Push] Failed to get VAPID public key");
      return null;
    }

    const { publicKey } = (await response.json()) as { publicKey: string };

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    // Get keys from subscription
    const p256dhKey = subscription.getKey("p256dh");
    const authKey = subscription.getKey("auth");

    if (!p256dhKey || !authKey) {
      console.error("[Push] Missing subscription keys");
      await subscription.unsubscribe();
      return null;
    }

    // Send subscription to server
    const subscribeResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
        },
        userAgent: navigator.userAgent,
        deviceName: getDeviceName(),
      }),
    });

    if (!subscribeResponse.ok) {
      console.error("[Push] Failed to save subscription to server");
      // Unsubscribe since server save failed
      await subscription.unsubscribe();
      return null;
    }

    console.log("[Push] Successfully subscribed to push notifications");
    return subscription;
  } catch (error) {
    console.error("[Push] Failed to subscribe:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    // Unsubscribe locally
    const success = await subscription.unsubscribe();

    if (success) {
      // Remove from server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    }

    return success;
  } catch (error) {
    console.error("[Push] Failed to unsubscribe:", error);
    return false;
  }
}

/**
 * Check if user is subscribed to push
 */
export async function isSubscribedToPush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return window.btoa(binary);
}

/**
 * Get a friendly device name from user agent
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;

  // Try to extract device/browser info
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Device";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Linux")) return "Linux";

  // Extract browser
  if (ua.includes("Chrome")) return "Chrome Browser";
  if (ua.includes("Firefox")) return "Firefox Browser";
  if (ua.includes("Safari")) return "Safari Browser";

  return "Unknown Device";
}
