"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StickyNote, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  note: string;
  createdAt: Date | string;
  createdBy: string;
}

interface NotesPanelProps {
  talentId: string | null;
  talentName: string | null;
  notes: Note[];
  onAddNote: (note: string) => Promise<void>;
  className?: string;
}

/**
 * Private notes panel for adding notes about talent
 */
export function NotesPanel({
  talentId,
  talentName,
  notes,
  onAddNote,
  className,
}: NotesPanelProps): React.ReactElement {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!newNote.trim() || !talentId) return;

    setIsSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  if (!talentId) {
    return (
      <Card className={cn("flex h-full flex-col", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <StickyNote className="h-4 w-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex-1 text-center text-sm">
          Select a talent to view and add notes
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <StickyNote className="h-4 w-4" />
          Notes for {talentName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* Add note input */}
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => {
              setNewNote(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add a private note..."
            className="min-h-[80px] resize-none text-sm"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Cmd+Enter to save</span>
            <Button
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={!newNote.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center text-sm">No notes yet</div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                    <span>{note.createdBy}</span>
                    <span>
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
