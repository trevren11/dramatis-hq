"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Play, Settings } from "lucide-react";
import Link from "next/link";
import {
  CallbackInvitationList,
  ImportCallbacksDialog,
  TimeSlotScheduler,
} from "@/components/callbacks";

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

interface CallbackInvitation {
  id: string;
  talentProfileId: string;
  roleId?: string | null;
  scheduledDate?: Date | null;
  scheduledTime?: string | null;
  checkedInAt?: Date | null;
  queueNumber?: number | null;
  emailSentAt?: Date | null;
  emailStatus?: string | null;
  talent: TalentInfo | null;
  role: RoleInfo | null;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  talentProfileId?: string;
}

interface ScheduleDate {
  date: string;
  slots: TimeSlot[];
}

interface CallbackSession {
  id: string;
  name: string;
  round: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  location?: string | null;
  isVirtual: boolean;
  notes?: string | null;
  scheduleDates: ScheduleDate[];
  slotDurationMinutes: number;
}

export default function CallbackSessionDetailPage(): React.ReactElement {
  const params = useParams();
  const auditionId = params.id as string;
  const sessionId = params.sessionId as string;
  const { toast } = useToast();

  const [session, setSession] = useState<CallbackSession | null>(null);
  const [invitations, setInvitations] = useState<CallbackInvitation[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("invitations");

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}`);
      const data = (await res.json()) as {
        session?: CallbackSession;
        invitations?: CallbackInvitation[];
        roles?: RoleInfo[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to fetch session");
      }

      setSession(data.session ?? null);
      setInvitations(data.invitations ?? []);
      setRoles(data.roles ?? []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [auditionId, sessionId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRemoveInvitation = async (id: string): Promise<void> => {
    try {
      const res = await fetch(
        `/api/auditions/${auditionId}/callbacks/${sessionId}/invitations/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to remove invitation");
      }

      toast({ title: "Removed", description: "Invitation removed" });
      void fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove",
        variant: "destructive",
      });
    }
  };

  const handleSendEmails = async (invitationIds: string[]): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationIds,
          subject: `Callback: ${session?.name ?? ""}`,
          body: `You have been invited to a callback audition.\n\nSession: ${session?.name ?? ""}\nLocation: ${session?.location ?? "TBD"}\n\nPlease confirm your attendance.`,
        }),
      });

      const data = (await res.json()) as {
        summary?: { sent: number; failed: number };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send emails");
      }

      toast({
        title: "Emails Sent",
        description: `Sent ${String(data.summary?.sent ?? 0)} emails${data.summary?.failed ? `, ${String(data.summary.failed)} failed` : ""}`,
      });

      void fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send emails",
        variant: "destructive",
      });
    }
  };

  const handleScheduleChange = async (dates: ScheduleDate[]): Promise<void> => {
    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleDates: dates }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to update schedule");
      }

      setSession((prev) => (prev ? { ...prev, scheduleDates: dates } : prev));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/producer/auditions/${auditionId}/callbacks`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{session.name}</h1>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Badge variant="outline">Round {session.round}</Badge>
              {session.location && <span>{session.location}</span>}
              {session.isVirtual && <Badge variant="secondary">Virtual</Badge>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/producer/auditions/${auditionId}/callbacks/${sessionId}/checkin`}>
              <Play className="mr-2 h-4 w-4" />
              Start Callback
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invitations">
            <Users className="mr-2 h-4 w-4" />
            Talent ({invitations.length})
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="mt-4">
          <CallbackInvitationList
            auditionId={auditionId}
            sessionId={sessionId}
            invitations={invitations}
            roles={roles}
            onRemoveInvitation={handleRemoveInvitation}
            onSendEmail={handleSendEmails}
            onAddInvitations={() => {
              setImportDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <TimeSlotScheduler
            scheduleDates={session.scheduleDates}
            slotDurationMinutes={session.slotDurationMinutes}
            onScheduleChange={(dates) => {
              void handleScheduleChange(dates);
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
              <CardDescription>Configure this callback session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">{session.location ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Slot Duration</p>
                  <p className="text-muted-foreground text-sm">
                    {session.slotDurationMinutes} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {session.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Virtual</p>
                  <p className="text-muted-foreground text-sm">
                    {session.isVirtual ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {session.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {session.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportCallbacksDialog
        auditionId={auditionId}
        sessionId={sessionId}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => void fetchData()}
      />
    </div>
  );
}
