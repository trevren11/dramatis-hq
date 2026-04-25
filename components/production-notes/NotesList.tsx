"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Pin, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ProductionNote } from "@/lib/db/schema/production-notes";

interface NotesListProps {
  notes: ProductionNote[];
  selectedNoteId?: string;
  onSelectNote: (note: ProductionNote) => void;
  isLoading: boolean;
}

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  isLoading,
}: NotesListProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-3">
            <div className="bg-muted h-4 w-3/4 rounded" />
            <div className="bg-muted mt-2 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center">
        <div>
          <FileText className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-2 text-sm">No notes yet</p>
          <p className="text-xs">Create your first note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => {
            onSelectNote(note);
          }}
          className={cn(
            "hover:bg-muted/50 w-full rounded-lg border p-3 text-left transition-colors",
            selectedNoteId === note.id && "border-primary bg-muted"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 font-medium">{note.title}</h4>
            <div className="flex shrink-0 gap-1">
              {note.isPinned && <Pin className="text-primary h-3 w-3" />}
              {note.isDraft && (
                <Badge variant="secondary" className="text-xs">
                  Draft
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {note.lastEditedAt
              ? `Edited ${formatDistanceToNow(new Date(note.lastEditedAt), { addSuffix: true })}`
              : `Created ${formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}`}
          </p>
        </button>
      ))}
    </div>
  );
}
