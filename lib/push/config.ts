import webPush from "web-push";

// VAPID keys for push notifications
// Generate with: web-push generate-vapid-keys
export const vapidConfig = {
  publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  subject: process.env.VAPID_SUBJECT ?? "mailto:admin@dramatis-hq.com",
};

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(vapidConfig.publicKey && vapidConfig.privateKey);
}

/**
 * Initialize web-push with VAPID details
 */
export function initializeWebPush(): void {
  if (!isPushConfigured()) {
    console.warn("[PUSH] VAPID keys not configured, push notifications disabled");
    return;
  }

  webPush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);
}

// Initialize on module load
if (isPushConfigured()) {
  initializeWebPush();
}

export { webPush };
