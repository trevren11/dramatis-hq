"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { FileText, Clock, Save } from "lucide-react";

interface CallbackNote {
  id: string;
  content: string | null;
  roleId: string | null;
  createdAt: Date;
  role?: { id: string; name: string } | null;
}

interface CallbackNotesPanelProps {
  auditionId: string;
  sessionId: string;
  talentId: string;
  talentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallbackNotesPanel({
  auditionId,
  sessionId,
  talentId,
  talentName,
  open,
  onOpenChange,
}: CallbackNotesPanelProps): React.ReactElement {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CallbackNote[]>([]);
  const [initialNotes, setInitialNotes] = useState<{ responses: unknown }[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/auditions/${auditionId}/callbacks/${sessionId}/notes?talentProfileId=${talentId}&includeInitial=true`
      );
      const data = (await res.json()) as {
        notes?: CallbackNote[];
        initialNotes?: { responses: unknown }[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to fetch notes");
      }

      setNotes(data.notes ?? []);
      setInitialNotes(data.initialNotes ?? []);

      const existingNote = (data.notes ?? []).find((n) => !n.roleId);
      if (existingNote) {
        setCurrentNote(existingNote.content ?? "");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [auditionId, sessionId, talentId, toast]);

  useEffect(() => {
    if (open) {
      void fetchNotes();
    }
  }, [open, fetchNotes]);

  const handleSaveNote = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/auditions/${auditionId}/callbacks/${sessionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentProfileId: talentId,
          content: currentNote,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save note");
      }

      toast({
        title: "Note Saved",
        description: "Callback notes have been saved",
      });

      void fetchNotes();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] overflow-y-auto sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes for {talentName}
          </SheetTitle>
          <SheetDescription>View previous notes and add callback-specific notes.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <Label>Callback Notes</Label>
              <Textarea
                value={currentNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setCurrentNote(e.target.value);
                }}
                placeholder="Add notes from this callback session..."
                rows={5}
              />
              <Button
                onClick={() => {
                  void handleSaveNote();
                }}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>

            <Separator />

            {initialNotes.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Initial Audition</Badge>
                    Form Responses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {JSON.stringify(initialNotes[0]?.responses, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {notes.length > 0 && (
              <div className="space-y-3">
                <Label>Previous Notes</Label>
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        {note.role && (
                          <Badge variant="outline" className="text-xs">
                            {note.role.name}
                          </Badge>
                        )}
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {notes.length === 0 && initialNotes.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No previous notes found for this talent.
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
