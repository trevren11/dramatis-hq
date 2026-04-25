"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Filter, Settings, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NOTIFICATION_TYPE_LABELS,
  IN_APP_NOTIFICATION_TYPE_VALUES,
} from "@/lib/db/schema/push-notifications";
import type { InAppNotification } from "@/lib/db/schema/push-notifications";

interface NotificationsResponse {
  notifications: InAppNotification[];
  unreadCount: number;
}

export default function NotificationsPage(): React.ReactElement {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchNotifications = useCallback(
    async (loadMore = false): Promise<void> => {
      const currentOffset = loadMore ? offset + limit : 0;

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(currentOffset),
          unreadOnly: String(filter === "unread"),
        });

        if (typeFilter !== "all") {
          params.set("types", typeFilter);
        }

        const response = await fetch(`/api/notifications?${params}`);

        if (response.ok) {
          const data = (await response.json()) as NotificationsResponse;

          if (loadMore) {
            setNotifications((prev) => [...prev, ...data.notifications]);
          } else {
            setNotifications(data.notifications);
          }

          setUnreadCount(data.unreadCount);
          setHasMore(data.notifications.length === limit);
          setOffset(currentOffset);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, typeFilter, offset]
  );

  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    void fetchNotifications(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We intentionally exclude fetchNotifications to avoid re-fetching on offset changes
  }, [filter, typeFilter]);

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

  const handleRefresh = (): void => {
    setIsLoading(true);
    setOffset(0);
    void fetchNotifications(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with your auditions, callbacks, and casting decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/notifications">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>
                {unreadCount > 0 ? `${String(unreadCount)} Unread` : "All Caught Up"}
              </CardTitle>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void handleMarkAllAsRead();
                }}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
          <CardDescription>
            {filter === "unread"
              ? "Showing unread notifications only"
              : "All your recent notifications"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Tabs
              value={filter}
              onValueChange={(v) => {
                setFilter(v as "all" | "unread");
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${String(unreadCount)})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {IN_APP_NOTIFICATION_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {NOTIFICATION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {isLoading && notifications.length === 0 ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg">No notifications yet</p>
                <p className="text-sm">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "Notifications will appear here when you receive them."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={`group hover:bg-accent flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                    !notification.readAt ? "bg-accent/30" : ""
                  }`}
                  onClick={() => {
                    void handleNotificationClick(notification);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <Bell className="text-primary h-5 w-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.readAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-xs">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {!notification.readAt && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && notifications.length > 0 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  void fetchNotifications(true);
                }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
