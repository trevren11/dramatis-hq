"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  MessageSquare,
  Upload,
  Trash2,
  FolderPlus,
  AtSign,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityType } from "@/lib/db/schema/production-notes";

interface ActivityRecord {
  id: string;
  showId: string;
  departmentId: string | null;
  activityType: ActivityType;
  entityId: string | null;
  entityType: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  userId: string;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

interface ActivityFeedProps {
  showId: string;
  departmentId?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  note_created: FileText,
  note_updated: FileText,
  note_deleted: Trash2,
  file_uploaded: Upload,
  file_deleted: Trash2,
  comment_added: MessageSquare,
  comment_deleted: Trash2,
  folder_created: FolderPlus,
  folder_deleted: Trash2,
  mention: AtSign,
};

export function ActivityFeed({ showId, departmentId }: ActivityFeedProps): React.ReactElement {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchActivities = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const newOffset = reset ? 0 : offset;
        const params = new URLSearchParams({
          limit: "50",
          offset: String(newOffset),
        });
        if (departmentId) {
          params.set("departmentId", departmentId);
        }

        const response = await fetch(
          `/api/shows/${showId}/production-notes/activity?${params.toString()}`
        );
        if (response.ok) {
          const data = (await response.json()) as { activities: ActivityRecord[] };
          if (reset) {
            setActivities(data.activities);
            setOffset(50);
          } else {
            setActivities((prev) => [...prev, ...data.activities]);
            setOffset((prev) => prev + 50);
          }
          setHasMore(data.activities.length === 50);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load activity feed",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [showId, departmentId, offset, toast]
  );

  useEffect(() => {
    void fetchActivities(true);
  }, [showId, departmentId, fetchActivities]);

  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void fetchActivities(true);
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {activities.length === 0 && !isLoading ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-center">
            <div>
              <FileText className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No activity yet</p>
              <p className="text-sm">Activity will appear here as team members work</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.activityType];
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.userName, activity.userEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full shadow">
                      <Icon className="text-muted-foreground h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.userName ?? activity.userEmail ?? "Unknown user"}
                      </span>{" "}
                      {activity.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void fetchActivities(false);
                }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
