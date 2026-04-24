"use client";

import React, { useState } from "react";
import { CheckinCard } from "./CheckinCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RefreshCw, Users, Clock, CheckCircle, UserCheck } from "lucide-react";

type CheckinStatus = "checked_in" | "in_room" | "completed";

interface QueueItem {
  id: string;
  queueNumber: number;
  status: CheckinStatus;
  checkedInAt: string | Date | null;
  talent: {
    id: string;
    name: string;
    email: string;
    headshotUrl?: string | null;
  };
}

interface CheckinQueueProps {
  queue: QueueItem[];
  counts: {
    checked_in: number;
    in_room: number;
    completed: number;
  };
  onStatusChange: (id: string, status: CheckinStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Real-time check-in queue management for producers
 */
export function CheckinQueue({
  queue,
  counts,
  onStatusChange,
  onDelete,
  onRefresh,
  isRefreshing = false,
  className,
}: CheckinQueueProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"all" | CheckinStatus>("all");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const handleStatusChange = async (id: string, status: CheckinStatus): Promise<void> => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await onStatusChange(id, status);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await onDelete(id);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredQueue =
    activeTab === "all" ? queue : queue.filter((item) => item.status === activeTab);

  const total = counts.checked_in + counts.in_room + counts.completed;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Check-in Queue
            <Badge variant="secondary">{total} total</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as typeof activeTab);
          }}
        >
          <TabsList className="mb-4 grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="h-5 px-1.5">
                {total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="checked_in" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Waiting
              <Badge variant="secondary" className="h-5 px-1.5">
                {counts.checked_in}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in_room" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              In Room
              <Badge variant="secondary" className="h-5 px-1.5">
                {counts.in_room}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Done
              <Badge variant="secondary" className="h-5 px-1.5">
                {counts.completed}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredQueue.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                {activeTab === "all" ? (
                  <>
                    <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="font-medium">No check-ins yet</p>
                    <p className="mt-1 text-sm">
                      Talent will appear here when they scan the QR code
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">No talent in this status</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredQueue.map((item) => (
                  <CheckinCard
                    key={item.id}
                    {...item}
                    onStatusChange={(status): void => {
                      void handleStatusChange(item.id, status);
                    }}
                    onDelete={(): void => {
                      void handleDelete(item.id);
                    }}
                    className={cn(updatingIds.has(item.id) && "pointer-events-none opacity-50")}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
