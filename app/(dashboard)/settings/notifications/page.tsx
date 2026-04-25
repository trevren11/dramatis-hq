"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, ArrowLeft, Moon, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
  IN_APP_NOTIFICATION_TYPE_VALUES,
} from "@/lib/db/schema/push-notifications";
import type {
  NotificationPreference,
  InAppNotificationType,
} from "@/lib/db/schema/push-notifications";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getServiceWorkerRegistration,
  isSubscribedToPush,
} from "@/lib/push/client";

// Common timezones
const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

interface DeviceSubscription {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface PreferencesResponse {
  preferences: NotificationPreference;
}

interface SubscriptionsResponse {
  subscriptions: DeviceSubscription[];
}

export default function NotificationPreferencesPage(): React.ReactElement {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [devices, setDevices] = useState<DeviceSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const fetchPreferences = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = (await response.json()) as PreferencesResponse;
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchDevices = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/push/subscriptions");
      if (response.ok) {
        const data = (await response.json()) as SubscriptionsResponse;
        setDevices(data.subscriptions);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  }, []);

  const checkPushStatus = useCallback(async (): Promise<void> => {
    const supported = isPushSupported();
    setPushSupported(supported);

    if (supported) {
      const permission = getNotificationPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        const registration = await getServiceWorkerRegistration();
        if (registration) {
          const subscribed = await isSubscribedToPush(registration);
          setIsSubscribed(subscribed);
        }
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setIsLoading(true);
      await Promise.all([fetchPreferences(), fetchDevices(), checkPushStatus()]);
      setIsLoading(false);
    };
    void loadData();
  }, [fetchPreferences, fetchDevices, checkPushStatus]);

  const updatePreference = async (
    key: keyof NotificationPreference,
    value: boolean | string | null
  ): Promise<void> => {
    if (!preferences) return;

    // Optimistic update
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));

    setIsSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preference");
      }

      const data = (await response.json()) as PreferencesResponse;
      setPreferences(data.preferences);
    } catch (error) {
      console.error("Failed to update preference:", error);
      // Revert on error
      void fetchPreferences();
      toast({
        title: "Error",
        description: "Failed to save preference",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async (): Promise<void> => {
    try {
      const permission = await requestNotificationPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        const registration = await registerServiceWorker();
        if (registration) {
          const subscription = await subscribeToPush(registration);
          if (subscription) {
            setIsSubscribed(true);
            void fetchDevices();
            toast({
              title: "Push notifications enabled",
              description: "You will now receive push notifications on this device.",
            });
          }
        }
      } else if (permission === "denied") {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to enable push:", error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
    }
  };

  const handleDisablePush = async (): Promise<void> => {
    try {
      const registration = await getServiceWorkerRegistration();
      if (registration) {
        await unsubscribeFromPush(registration);
        setIsSubscribed(false);
        void fetchDevices();
        toast({
          title: "Push notifications disabled",
          description: "You will no longer receive push notifications on this device.",
        });
      }
    } catch (error) {
      console.error("Failed to disable push:", error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive",
      });
    }
  };

  const notificationTypeToField = (type: InAppNotificationType): keyof NotificationPreference => {
    const mapping: Record<InAppNotificationType, keyof NotificationPreference> = {
      new_message: "newMessage",
      schedule_change: "scheduleChange",
      rehearsal_reminder: "rehearsalReminder",
      callback_notification: "callbackNotification",
      cast_decision: "castDecision",
      document_shared: "documentShared",
      comment_mention: "commentMention",
      audition_submission: "auditionSubmission",
      system_announcement: "systemAnnouncement",
    };
    return mapping[type];
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/notifications"
          className="text-muted-foreground mb-4 flex items-center text-sm hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Notifications
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">Manage how and when you receive notifications.</p>
      </div>

      <div className="space-y-6">
        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Push Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive instant alerts on your devices when something important happens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!pushSupported ? (
              <p className="text-muted-foreground text-sm">
                Push notifications are not supported in this browser.
              </p>
            ) : pushPermission === "denied" ? (
              <div className="bg-destructive/10 rounded-lg p-4">
                <p className="text-sm">
                  Push notifications are blocked. To enable them, click the lock icon in your
                  browser&apos;s address bar and allow notifications for this site.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable push notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      {isSubscribed
                        ? "Push notifications are enabled on this device"
                        : "Get notifications even when you're not on the site"}
                    </p>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={() => {
                      void (isSubscribed ? handleDisablePush() : handleEnablePush());
                    }}
                  />
                </div>

                {isSubscribed && preferences && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Master push toggle</Label>
                      <p className="text-muted-foreground text-sm">
                        Temporarily disable all push notifications
                      </p>
                    </div>
                    <Switch
                      checked={preferences.pushEnabled}
                      onCheckedChange={(checked) => {
                        void updatePreference("pushEnabled", checked);
                      }}
                      disabled={isSaving}
                    />
                  </div>
                )}
              </>
            )}

            {/* Registered Devices */}
            {devices.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-base">Registered Devices</Label>
                <div className="mt-3 space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">
                            {device.deviceName ?? "Unknown Device"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {device.lastUsedAt
                              ? `Last used: ${new Date(device.lastUsedAt).toLocaleDateString()}`
                              : `Registered: ${new Date(device.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        {preferences && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {IN_APP_NOTIFICATION_TYPE_VALUES.map((type) => {
                const field = notificationTypeToField(type);
                const isEnabled = preferences[field] as boolean;

                return (
                  <div key={type} className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">{NOTIFICATION_TYPE_LABELS[type]}</Label>
                      <p className="text-muted-foreground text-sm">
                        {NOTIFICATION_TYPE_DESCRIPTIONS[type]}
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        void updatePreference(field, checked);
                      }}
                      disabled={isSaving}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Do Not Disturb */}
        {preferences && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                <CardTitle>Do Not Disturb</CardTitle>
              </div>
              <CardDescription>
                Set quiet hours when you don&apos;t want to receive push notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable quiet hours</Label>
                  <p className="text-muted-foreground text-sm">
                    Push notifications will be silenced during these hours
                  </p>
                </div>
                <Switch
                  checked={preferences.dndEnabled}
                  onCheckedChange={(checked) => {
                    void updatePreference("dndEnabled", checked);
                  }}
                  disabled={isSaving}
                />
              </div>

              {preferences.dndEnabled && (
                <>
                  <div className="grid gap-4 pt-2 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="dndStart">Start time</Label>
                      <Input
                        id="dndStart"
                        type="time"
                        value={preferences.dndStart ?? "22:00"}
                        onChange={(e) => {
                          void updatePreference("dndStart", e.target.value);
                        }}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dndEnd">End time</Label>
                      <Input
                        id="dndEnd"
                        type="time"
                        value={preferences.dndEnd ?? "08:00"}
                        onChange={(e) => {
                          void updatePreference("dndEnd", e.target.value);
                        }}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.timezone ?? "UTC"}
                        onValueChange={(value) => {
                          void updatePreference("timezone", value);
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    In-app notifications will still be visible, but push notifications will be
                    delayed until quiet hours end.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
