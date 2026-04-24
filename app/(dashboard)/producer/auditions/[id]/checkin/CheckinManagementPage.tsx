/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeDisplay } from "@/components/checkin/QRCodeDisplay";
import { CheckinQueue } from "@/components/checkin/CheckinQueue";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

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

interface QueueData {
  queue: QueueItem[];
  counts: {
    checked_in: number;
    in_room: number;
    completed: number;
  };
  total: number;
}

interface ApiResponse {
  error?: string;
  queue?: QueueItem[];
  counts?: {
    checked_in: number;
    in_room: number;
    completed: number;
  };
  total?: number;
}

interface CheckinManagementPageProps {
  auditionId: string;
  auditionTitle: string;
  checkinUrl: string;
}

export function CheckinManagementPage({
  auditionId,
  auditionTitle,
  checkinUrl,
}: CheckinManagementPageProps): React.ReactElement {
  const { toast } = useToast();
  const [queueData, setQueueData] = useState<QueueData>({
    queue: [],
    counts: { checked_in: 0, in_room: 0, completed: 0 },
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueue = useCallback(
    async (showRefreshing = false): Promise<void> => {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const res = await fetch(`/api/auditions/${auditionId}/checkin/queue`);
        const data: ApiResponse = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch queue");
        }

        setQueueData({
          queue: data.queue ?? [],
          counts: data.counts ?? { checked_in: 0, in_room: 0, completed: 0 },
          total: data.total ?? 0,
        });
      } catch (error) {
        console.error("Error fetching queue:", error);
        toast({
          title: "Error",
          description: "Failed to load check-in queue",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [auditionId, toast]
  );

  // Initial fetch
  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchQueue(false);
    }, 10000);

    return (): void => {
      clearInterval(interval);
    };
  }, [fetchQueue]);

  const handleStatusChange = async (id: string, status: CheckinStatus): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/checkin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update status");
      }

      // Refresh the queue
      await fetchQueue();

      toast({
        title: "Status updated",
        description: `Talent moved to ${status.replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/checkin/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove check-in");
      }

      // Refresh the queue
      await fetchQueue();

      toast({
        title: "Removed",
        description: "Check-in has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove check-in",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = (): void => {
    void fetchQueue(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/producer/auditions/${auditionId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Check-in Management</h1>
          </div>
          <p className="text-muted-foreground ml-10">{auditionTitle}</p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/producer/auditions/${auditionId}/form`}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Form
          </Link>
        </Button>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Code */}
        <div className="lg:col-span-1">
          <QRCodeDisplay checkinUrl={checkinUrl} auditionTitle={auditionTitle} />
        </div>

        {/* Queue */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
            </div>
          ) : (
            <CheckinQueue
              queue={queueData.queue}
              counts={queueData.counts}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
