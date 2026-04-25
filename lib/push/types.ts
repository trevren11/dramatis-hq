import type { InAppNotificationType } from "@/lib/db/schema/push-notifications";

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  deviceName?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    entityType?: string;
    entityId?: string;
    [key: string]: unknown;
  };
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface SendPushOptions {
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  url?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

export interface SendPushResult {
  success: boolean;
  notificationId?: string;
  subscriptionsSent?: number;
  subscriptionsFailed?: number;
  error?: string;
}

export interface BulkPushResult {
  results: SendPushResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface PreferenceCheckResult {
  canSend: boolean;
  reason?: string;
  isDnd?: boolean;
}
