import { eq, and, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  pushSubscriptions,
  inAppNotifications,
  notificationPreferences,
  NOTIFICATION_TYPE_TO_FIELD,
  type InAppNotificationType,
  type NotificationPreference,
} from "@/lib/db/schema/push-notifications";
import { webPush, isPushConfigured } from "./config";
import type {
  PushSubscriptionData,
  PushPayload,
  SendPushOptions,
  SendPushResult,
  BulkPushResult,
  PreferenceCheckResult,
} from "./types";

export class PushNotificationService {
  /**
   * Register a push subscription for a user
   */
  async registerSubscription(
    userId: string,
    subscription: PushSubscriptionData
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      ),
    });

    if (existing) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          keys: subscription.keys,
          userAgent: subscription.userAgent,
          deviceName: subscription.deviceName,
          isActive: true,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing.id));

      return { success: true, subscriptionId: existing.id };
    }

    // Create new subscription
    const [result] = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: subscription.userAgent,
        deviceName: subscription.deviceName,
      })
      .returning();

    return { success: true, subscriptionId: result?.id };
  }

  /**
   * Remove a push subscription
   */
  async removeSubscription(
    userId: string,
    endpoint: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
      .returning({ id: pushSubscriptions.id });

    return { success: result.length > 0 };
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<(typeof pushSubscriptions.$inferSelect)[]> {
    return db.query.pushSubscriptions.findMany({
      where: and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)),
    });
  }

  /**
   * Send a push notification to a user
   * Creates an in-app notification and sends web push to all subscribed devices
   */
  async send(options: SendPushOptions): Promise<SendPushResult> {
    // Check user preferences
    const preferenceCheck = await this.checkPreferences(options.userId, options.type);

    if (!preferenceCheck.canSend) {
      // Still create in-app notification, just don't send push
      const notification = await this.createInAppNotification(options);
      return {
        success: true,
        notificationId: notification?.id,
        subscriptionsSent: 0,
        subscriptionsFailed: 0,
      };
    }

    // Create in-app notification
    const notification = await this.createInAppNotification(options);

    if (!notification) {
      return {
        success: false,
        error: "Failed to create notification",
      };
    }

    // Send push notifications if configured
    if (!isPushConfigured()) {
      console.log(`[PUSH] Mock send to user ${options.userId}:`, {
        title: options.title,
        type: options.type,
      });

      return {
        success: true,
        notificationId: notification.id,
        subscriptionsSent: 0,
        subscriptionsFailed: 0,
      };
    }

    // Get user's subscriptions and send push
    const subscriptions = await this.getUserSubscriptions(options.userId);
    let sent = 0;
    let failed = 0;

    const payload: PushPayload = {
      title: options.title,
      body: options.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: `${options.type}-${notification.id}`,
      data: {
        url: options.url,
        entityType: options.entityType,
        entityId: options.entityId,
        notificationId: notification.id,
        ...options.data,
      },
    };

    for (const subscription of subscriptions) {
      const result = await this.sendToSubscription(subscription, payload);

      if (result.success) {
        sent++;

        // Update last used timestamp
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.id, subscription.id));
      } else {
        failed++;

        // If subscription is no longer valid, deactivate it
        if (result.expired) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    }

    // Update notification with push status
    await db
      .update(inAppNotifications)
      .set({
        pushSentAt: sent > 0 ? new Date() : null,
        pushError: failed > 0 && sent === 0 ? "All push deliveries failed" : null,
      })
      .where(eq(inAppNotifications.id, notification.id));

    return {
      success: true,
      notificationId: notification.id,
      subscriptionsSent: sent,
      subscriptionsFailed: failed,
    };
  }

  /**
   * Send push notifications to multiple users
   */
  async sendBulk(notifications: SendPushOptions[]): Promise<BulkPushResult> {
    const results: SendPushResult[] = [];

    for (const notification of notifications) {
      const result = await this.send(notification);
      results.push(result);

      // Small delay to avoid rate limiting
      await this.delay(50);
    }

    return {
      results,
      summary: {
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  }

  /**
   * Create an in-app notification record
   */
  private async createInAppNotification(
    options: SendPushOptions
  ): Promise<typeof inAppNotifications.$inferSelect | undefined> {
    const [notification] = await db
      .insert(inAppNotifications)
      .values({
        userId: options.userId,
        type: options.type,
        title: options.title,
        body: options.body,
        data: {
          url: options.url,
          entityType: options.entityType,
          entityId: options.entityId,
          ...options.data,
        },
      })
      .returning();

    return notification;
  }

  /**
   * Send push to a single subscription
   */
  private async sendToSubscription(
    subscription: typeof pushSubscriptions.$inferSelect,
    payload: PushPayload
  ): Promise<{ success: boolean; expired?: boolean; error?: string }> {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60, // 1 hour
        }
      );

      return { success: true };
    } catch (error) {
      const webPushError = error as { statusCode?: number; message?: string };

      // 404 or 410 means the subscription is no longer valid
      if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
        return { success: false, expired: true, error: "Subscription expired" };
      }

      console.error("[PUSH] Failed to send notification:", webPushError.message);
      return { success: false, error: webPushError.message };
    }
  }

  /**
   * Check if a user allows this notification type
   */
  async checkPreferences(
    userId: string,
    type: InAppNotificationType
  ): Promise<PreferenceCheckResult> {
    const preferences = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // If no preferences exist, default to allowing
    if (!preferences) {
      return { canSend: true };
    }

    // Check master toggle
    if (!preferences.pushEnabled) {
      return { canSend: false, reason: "Push notifications disabled" };
    }

    // Check DND settings
    if (preferences.dndEnabled && preferences.dndStart && preferences.dndEnd) {
      const isDnd = this.isInDndWindow(
        preferences.dndStart,
        preferences.dndEnd,
        preferences.timezone ?? "UTC"
      );

      if (isDnd) {
        return { canSend: false, reason: "Do not disturb active", isDnd: true };
      }
    }

    // Check per-type preference
    const fieldName = NOTIFICATION_TYPE_TO_FIELD[type];
    const typeEnabled = preferences[fieldName] as boolean;

    if (!typeEnabled) {
      return { canSend: false, reason: `${type} notifications disabled` };
    }

    return { canSend: true };
  }

  /**
   * Check if current time is in DND window
   */
  private isInDndWindow(start: string, end: string, timezone: string): boolean {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const currentTime = formatter.format(now);
      const currentParts = currentTime.split(":").map(Number);
      const currentHour = currentParts[0] ?? 0;
      const currentMinute = currentParts[1] ?? 0;
      const currentMinutes = currentHour * 60 + currentMinute;

      const startParts = start.split(":").map(Number);
      const startHour = startParts[0] ?? 0;
      const startMinute = startParts[1] ?? 0;
      const startMinutes = startHour * 60 + startMinute;

      const endParts = end.split(":").map(Number);
      const endHour = endParts[0] ?? 0;
      const endMinute = endParts[1] ?? 0;
      const endMinutes = endHour * 60 + endMinute;

      // Handle overnight DND (e.g., 22:00 to 08:00)
      if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch {
      // If timezone parsing fails, don't block notifications
      return false;
    }
  }

  /**
   * Get or create notification preferences for a user
   */
  async getOrCreatePreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!preferences) {
      const [created] = await db.insert(notificationPreferences).values({ userId }).returning();
      if (!created) {
        throw new Error("Failed to create notification preferences");
      }
      preferences = created;
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreference, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<NotificationPreference> {
    await this.getOrCreatePreferences(userId);

    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update notification preferences");
    }

    return updated;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(inAppNotifications.id, notificationId), eq(inAppNotifications.userId, userId)))
      .returning({ id: inAppNotifications.id });

    return result.length > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(inAppNotifications.userId, userId), isNull(inAppNotifications.readAt)))
      .returning({ id: inAppNotifications.id });

    return result.length;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await db.query.inAppNotifications.findMany({
      where: and(eq(inAppNotifications.userId, userId), isNull(inAppNotifications.readAt)),
      columns: { id: true },
    });

    return notifications.length;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: InAppNotificationType[];
    }
  ): Promise<(typeof inAppNotifications.$inferSelect)[]> {
    const conditions = [eq(inAppNotifications.userId, userId)];

    if (options?.unreadOnly) {
      conditions.push(isNull(inAppNotifications.readAt));
    }

    // Note: type filtering would need to be handled differently with drizzle
    // For now, we filter in memory after fetching

    let notifications = await db.query.inAppNotifications.findMany({
      where: and(...conditions),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    });

    const typesFilter = options?.types;
    if (typesFilter?.length) {
      notifications = notifications.filter((n) => typesFilter.includes(n.type));
    }

    return notifications;
  }

  /**
   * Record a notification click
   */
  async recordClick(notificationId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(inAppNotifications)
      .set({
        clickedAt: new Date(),
        readAt: new Date(), // Also mark as read on click
      })
      .where(and(eq(inAppNotifications.id, notificationId), eq(inAppNotifications.userId, userId)))
      .returning({ id: inAppNotifications.id });

    return result.length > 0;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
