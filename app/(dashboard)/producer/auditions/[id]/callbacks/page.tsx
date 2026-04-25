"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CallbackSessionList, CreateCallbackDialog } from "@/components/callbacks";

interface CallbackSession {
  id: string;
  name: string;
  round: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduleDates: { date: string; slots: unknown[] }[];
  invitationCount: number;
  checkedInCount: number;
  createdAt: Date;
}

interface AuditionData {
  id: string;
  title: string;
}

export default function CallbacksPage(): React.ReactElement {
  const params = useParams();
  const auditionId = params.id as string;
  const { toast } = useToast();

  const [audition, setAudition] = useState<AuditionData | null>(null);
  const [sessions, setSessions] = useState<CallbackSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [auditionRes, sessionsRes] = await Promise.all([
        fetch(`/api/auditions/${auditionId}`),
        fetch(`/api/auditions/${auditionId}/callbacks`),
      ]);

      const auditionData = (await auditionRes.json()) as {
        audition?: AuditionData;
        error?: string;
      };
      const sessionsData = (await sessionsRes.json()) as {
        sessions?: CallbackSession[];
        error?: string;
      };

      if (!auditionRes.ok) {
        throw new Error(auditionData.error ?? "Failed to fetch audition");
      }

      setAudition(auditionData.audition ?? null);
      setSessions(sessionsData.sessions ?? []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [auditionId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreateSuccess = (): void => {
    void fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  const nextRound = sessions.length > 0 ? Math.max(...sessions.map((s) => s.round)) + 1 : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/producer/auditions/${auditionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Callbacks</h1>
          <p className="text-muted-foreground">{audition?.title}</p>
        </div>
      </div>

      <CallbackSessionList
        auditionId={auditionId}
        sessions={sessions}
        onCreateNew={() => {
          setCreateDialogOpen(true);
        }}
      />

      <CreateCallbackDialog
        auditionId={auditionId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        nextRound={nextRound}
      />
    </div>
  );
}
