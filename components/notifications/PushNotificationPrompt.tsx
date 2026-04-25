"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  getServiceWorkerRegistration,
  isSubscribedToPush,
} from "@/lib/push/client";

interface PushNotificationPromptProps {
  className?: string;
  onClose?: () => void;
  showDismiss?: boolean;
}

type PromptState = "loading" | "unsupported" | "denied" | "prompt" | "subscribed" | "error";

export function PushNotificationPrompt({
  className,
  onClose,
  showDismiss = true,
}: PushNotificationPromptProps): React.ReactElement | null {
  const [state, setState] = useState<PromptState>("loading");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const checkStatus = useCallback(async (): Promise<void> => {
    // Check browser support
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }

    // Check permission
    const permission = getNotificationPermission();

    if (permission === "denied") {
      setState("denied");
      return;
    }

    // Check if already subscribed
    if (permission === "granted") {
      const registration = await getServiceWorkerRegistration();
      if (registration) {
        const isSubscribed = await isSubscribedToPush(registration);
        if (isSubscribed) {
          setState("subscribed");
          return;
        }
      }
    }

    setState("prompt");
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleEnable = async (): Promise<void> => {
    setIsSubscribing(true);

    try {
      // Request permission if needed
      const permission = await requestNotificationPermission();

      if (permission !== "granted") {
        setState("denied");
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      if (!registration) {
        setState("error");
        return;
      }

      // Subscribe to push
      const subscription = await subscribeToPush(registration);

      if (subscription) {
        setState("subscribed");
        onClose?.();
      } else {
        setState("error");
      }
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      setState("error");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Don't render anything for certain states
  if (state === "loading" || state === "subscribed") {
    return null;
  }

  if (state === "unsupported") {
    return null; // Silently fail for unsupported browsers
  }

  return (
    <Card className={className}>
      <CardHeader className="relative pb-2">
        {showDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Bell className="text-primary h-5 w-5" />
          <CardTitle className="text-lg">Enable Notifications</CardTitle>
        </div>
        <CardDescription>
          {state === "denied"
            ? "Notifications are blocked. Please enable them in your browser settings."
            : state === "error"
              ? "Something went wrong. Please try again."
              : "Get instant updates about auditions, callbacks, and casting decisions."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {state === "prompt" && (
          <Button
            onClick={() => {
              void handleEnable();
            }}
            disabled={isSubscribing}
            className="w-full"
          >
            {isSubscribing ? "Enabling..." : "Enable Push Notifications"}
          </Button>
        )}

        {state === "denied" && (
          <p className="text-muted-foreground text-sm">
            To enable notifications, click the lock icon in your browser&apos;s address bar and
            allow notifications for this site.
          </p>
        )}

        {state === "error" && (
          <Button
            onClick={() => {
              void handleEnable();
            }}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
