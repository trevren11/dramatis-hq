"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TalentQueue,
  ProfileViewer,
  DecisionPanel,
  CastList,
  NotesPanel,
} from "@/components/audition-session";
import { RefreshCw, ArrowLeft } from "lucide-react";

type DecisionType = "callback" | "no_thanks" | "callback_role";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface TalentData {
  id: string;
  name: string;
  email: string;
  unionMemberships: string[] | null;
  heightInches: number | null;
  hairColor: string | null;
  eyeColor: string | null;
  gender: string | null;
  ageRangeLow: number | null;
  ageRangeHigh: number | null;
  bio: string | null;
  headshotUrl: string | null;
}

interface NoteData {
  id: string;
  note: string;
  createdAt: string;
  createdBy: string;
}

interface DecisionData {
  id: string;
  type: DecisionType;
  roleId: string | null;
  notes: string | null;
  decidedAt: string;
}

interface QueueItem {
  id: string;
  queueNumber: number | null;
  checkinStatus: "checked_in" | "in_room" | "completed";
  checkedInAt: string | null;
  talent: TalentData;
  decision: DecisionData | null;
  notes: NoteData[];
}

interface SessionData {
  audition: {
    id: string;
    title: string;
    slug: string;
    location: string | null;
    isVirtual: boolean | null;
    status: string;
  };
  roles: Role[];
  queue: QueueItem[];
  counts: {
    total: number;
    checkedIn: number;
    inRoom: number;
    completed: number;
    callback: number;
    callbackRole: number;
    noThanks: number;
    undecided: number;
  };
}

interface AuditionSessionPageProps {
  auditionId: string;
  initialData: SessionData;
}

const POLL_INTERVAL = 10000; // 10 seconds

// eslint-disable-next-line complexity
export function AuditionSessionPage({
  auditionId,
  initialData,
}: AuditionSessionPageProps): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<SessionData>(initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_lastDecisionId, setLastDecisionId] = useState<string | null>(null);

  const currentTalent = data.queue[currentIndex];

  // Fetch fresh data
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/session`);
      if (res.ok) {
        const newData = (await res.json()) as SessionData;
        setData(newData);
      }
    } catch (error) {
      console.error("Failed to fetch session data:", error);
    }
  }, [auditionId]);

  // Refresh handler
  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData();
    }, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [fetchData]);

  // Navigation handlers
  const handleSelect = useCallback((index: number): void => {
    setCurrentIndex(index);
  }, []);

  const handlePrevious = useCallback((): void => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback((): void => {
    setCurrentIndex((prev) => Math.min(data.queue.length - 1, prev + 1));
  }, [data.queue.length]);

  // Decision handler
  const handleDecision = useCallback(
    async (decision: DecisionType, roleId?: string, notes?: string): Promise<void> => {
      if (!currentTalent) return;

      const res = await fetch(`/api/auditions/${auditionId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentProfileId: currentTalent.talent.id,
          decision,
          roleId: roleId ?? null,
          notes: notes ?? null,
        }),
      });

      if (res.ok) {
        const result = (await res.json()) as { decision: { id: string } };
        setLastDecisionId(result.decision.id);
        await fetchData();
      }
    },
    [auditionId, currentTalent, fetchData]
  );

  // Undo decision handler
  const handleUndo = useCallback(async (): Promise<void> => {
    if (!currentTalent?.decision) return;

    const res = await fetch(`/api/auditions/${auditionId}/decisions/${currentTalent.decision.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setLastDecisionId(null);
      await fetchData();
    }
  }, [auditionId, currentTalent, fetchData]);

  // Add note handler
  const handleAddNote = useCallback(
    async (note: string): Promise<void> => {
      if (!currentTalent) return;

      const res = await fetch(`/api/auditions/${auditionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentProfileId: currentTalent.talent.id,
          note,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    },
    [auditionId, currentTalent, fetchData]
  );

  // Select talent from cast list
  const handleSelectTalent = useCallback(
    (talentId: string): void => {
      const index = data.queue.findIndex((q) => q.talent.id === talentId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    },
    [data.queue]
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.back();
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{data.audition.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data.audition.status}</Badge>
              {data.audition.location && (
                <span className="text-muted-foreground text-sm">{data.audition.location}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {data.counts.total} in queue
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Queue */}
        <aside className="w-64 border-r">
          <TalentQueue
            queue={data.queue.map((q) => ({
              id: q.id,
              queueNumber: q.queueNumber,
              talent: {
                id: q.talent.id,
                name: q.talent.name,
                headshotUrl: q.talent.headshotUrl,
              },
              decision: q.decision ? { type: q.decision.type } : null,
              checkinStatus: q.checkinStatus,
            }))}
            currentIndex={currentIndex}
            onSelect={handleSelect}
            onPrevious={handlePrevious}
            onNext={handleNext}
            className="h-full rounded-none border-0"
          />
        </aside>

        {/* Center - Profile viewer */}
        <main className="flex-1">
          <ProfileViewer
            talent={currentTalent?.talent ?? null}
            queueNumber={currentTalent?.queueNumber ?? null}
            onPrevious={handlePrevious}
            onNext={handleNext}
            className="h-full rounded-none border-0"
          />
        </main>

        {/* Right sidebar - Decisions, Notes, Cast List */}
        <aside className="flex w-80 flex-col border-l">
          {/* Decision Panel */}
          <DecisionPanel
            talentId={currentTalent?.talent.id ?? null}
            talentName={currentTalent?.talent.name ?? null}
            currentDecision={currentTalent?.decision ?? null}
            roles={data.roles}
            onDecision={handleDecision}
            onUndo={handleUndo}
            className="rounded-none border-0 border-b"
          />

          {/* Notes Panel */}
          <NotesPanel
            talentId={currentTalent?.talent.id ?? null}
            talentName={currentTalent?.talent.name ?? null}
            notes={currentTalent?.notes ?? []}
            onAddNote={handleAddNote}
            className="flex-1 rounded-none border-0 border-b"
          />

          {/* Cast List */}
          <CastList
            items={data.queue.map((q) => ({
              talentId: q.talent.id,
              talentName: q.talent.name,
              headshotUrl: q.talent.headshotUrl,
              queueNumber: q.queueNumber,
              decision: q.decision,
            }))}
            roles={data.roles}
            counts={{
              callback: data.counts.callback,
              callbackRole: data.counts.callbackRole,
              noThanks: data.counts.noThanks,
              undecided: data.counts.undecided,
            }}
            onSelectTalent={handleSelectTalent}
            className="h-64 rounded-none border-0"
          />
        </aside>
      </div>
    </div>
  );
}
