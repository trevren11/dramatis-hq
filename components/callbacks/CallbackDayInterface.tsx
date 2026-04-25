"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { DecisionDialog } from "./DecisionDialog";
import { CallbackNotesPanel } from "./CallbackNotesPanel";
import { cn } from "@/lib/utils";
import { Users, Clock, RefreshCw, ArrowLeft, FileText, Gavel } from "lucide-react";
import Link from "next/link";

interface TalentInfo {
  id: string;
  name: string;
  email: string;
  headshotUrl?: string | null;
}

interface RoleInfo {
  id: string;
  name: string;
}

interface QueueItem {
  id: string;
  queueNumber: number | null;
  checkedInAt: Date | null;
  scheduledTime: string | null;
  talent: TalentInfo | null;
}

interface CallbackSession {
  id: string;
  name: string;
  round: number;
  status: string;
  location?: string | null;
  isVirtual: boolean;
}

interface CallbackDayInterfaceProps {
  auditionId: string;
  auditionTitle: string;
  sessionId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CallbackDayInterface({
  auditionId,
  auditionTitle,
  sessionId,
}: CallbackDayInterfaceProps): React.ReactElement {
  const { toast } = useToast();
  const [session, setSession] = useState<CallbackSession | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [counts, setCounts] = useState({ total: 0, checkedIn: 0, notCheckedIn: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedTalent, setSelectedTalent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  const fetchData = useCallback(
    async (showRefreshing = false): Promise<void> => {
      if (showRefreshing) setIsRefreshing(true);

      try {
        const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}/checkin`);
        const data = (await res.json()) as {
          session?: CallbackSession;
          queue?: QueueItem[];
          counts?: { total: number; checkedIn: number; notCheckedIn: number };
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch data");
        }

        setSession(data.session ?? null);
        setQueue(data.queue ?? []);
        setCounts(data.counts ?? { total: 0, checkedIn: 0, notCheckedIn: 0 });

        const sessionRes = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}`);
        const sessionData = (await sessionRes.json()) as { roles?: RoleInfo[] };
        setRoles(sessionData.roles ?? []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load callback data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [auditionId, sessionId, toast]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData(false);
    }, 10000);

    return (): void => {
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleRefresh = (): void => {
    void fetchData(true);
  };

  const openDecisionDialog = (talent: { id: string; name: string }): void => {
    setSelectedTalent(talent);
    setDecisionDialogOpen(true);
  };

  const openNotesPanel = (talent: { id: string; name: string }): void => {
    setSelectedTalent(talent);
    setNotesPanelOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/producer/auditions/${auditionId}/callbacks/${sessionId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{session?.name ?? "Callback"}</h1>
          </div>
          <p className="text-muted-foreground ml-10">{auditionTitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            {counts.checkedIn} / {counts.total} checked in
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Callback Queue
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                Waiting: {queue.filter((q) => q.queueNumber).length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">No talent checked in yet</p>
              <p className="mt-1 text-sm">
                Talent will appear here when they check in for the callback.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
                  {item.queueNumber && (
                    <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                      {item.queueNumber}
                    </div>
                  )}

                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={item.talent?.headshotUrl ?? undefined}
                      alt={item.talent?.name ?? ""}
                    />
                    <AvatarFallback>
                      {item.talent ? getInitials(item.talent.name) : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.talent?.name ?? "Unknown"}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {item.talent?.email ?? ""}
                    </p>
                  </div>

                  {item.scheduledTime && (
                    <div className="text-muted-foreground hidden shrink-0 text-sm sm:block">
                      Scheduled: {item.scheduledTime}
                    </div>
                  )}

                  {item.checkedInAt && (
                    <div className="text-muted-foreground hidden shrink-0 text-sm sm:block">
                      Checked in: {formatTime(item.checkedInAt)}
                    </div>
                  )}

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (item.talent) {
                          openNotesPanel({ id: item.talent.id, name: item.talent.name });
                        }
                      }}
                      disabled={!item.talent}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (item.talent) {
                          openDecisionDialog({ id: item.talent.id, name: item.talent.name });
                        }
                      }}
                      disabled={!item.talent}
                    >
                      <Gavel className="mr-2 h-4 w-4" />
                      Decision
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTalent && (
        <>
          <DecisionDialog
            auditionId={auditionId}
            sessionId={sessionId}
            talentId={selectedTalent.id}
            talentName={selectedTalent.name}
            roles={roles}
            open={decisionDialogOpen}
            onOpenChange={setDecisionDialogOpen}
            onSuccess={() => void fetchData()}
          />

          <CallbackNotesPanel
            auditionId={auditionId}
            sessionId={sessionId}
            talentId={selectedTalent.id}
            talentName={selectedTalent.name}
            open={notesPanelOpen}
            onOpenChange={setNotesPanelOpen}
          />
        </>
      )}
    </div>
  );
}
