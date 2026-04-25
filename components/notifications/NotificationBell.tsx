"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Settings, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/db/schema/push-notifications";
import type { InAppNotification, InAppNotificationType } from "@/lib/db/schema/push-notifications";

interface NotificationBellProps {
  className?: string;
  pollInterval?: number;
}

interface NotificationsResponse {
  notifications: InAppNotification[];
  unreadCount: number;
}

interface CountResponse {
  count: number;
}

export function NotificationBell({
  className,
  pollInterval = 30000,
}: NotificationBellProps): React.ReactElement {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = (await response.json()) as NotificationsResponse;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/notifications/count");
      if (response.ok) {
        const data = (await response.json()) as CountResponse;
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, pollInterval);
    return (): void => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount, pollInterval]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      void fetchNotifications().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string): Promise<void> => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: InAppNotification): Promise<void> => {
    // Record click
    try {
      await fetch(`/api/notifications/${notification.id}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }

    // Navigate if URL provided
    const url = notification.data?.url;
    if (url && typeof url === "string") {
      window.location.href = url;
    }
  };

  const getNotificationIcon = (_type: InAppNotificationType): React.ReactElement => {
    // Could expand with different icons per type
    return <Bell className="h-4 w-4" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className ?? ""}`}
          aria-label={`Notifications${unreadCount > 0 ? ` (${String(unreadCount)} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs"
            >
              {unreadCount > 99 ? "99+" : String(unreadCount)}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                void handleMarkAllAsRead();
              }}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="text-muted-foreground p-4 text-center text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex cursor-pointer flex-col items-start gap-1 p-3 ${
                  !notification.readAt ? "bg-accent/50" : ""
                }`}
                onClick={() => {
                  void handleNotificationClick(notification);
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="font-medium">{notification.title}</span>
                  </div>
                  {!notification.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkAsRead(notification.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">{notification.body}</p>
                <div className="flex w-full items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {NOTIFICATION_TYPE_LABELS[notification.type]}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between p-2">
          <Link href="/notifications" className="text-primary text-sm hover:underline">
            <span className="flex items-center gap-1">
              View all
              <ExternalLink className="h-3 w-3" />
            </span>
          </Link>
          <Link
            href="/settings/notifications"
            className="text-muted-foreground text-sm hover:underline"
          >
            <span className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Settings
            </span>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
