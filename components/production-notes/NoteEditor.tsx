"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Trash2, Pin, PinOff, History, MoreVertical } from "lucide-react";
import type { ProductionNote, ProductionNoteVersion } from "@/lib/db/schema/production-notes";

interface NoteEditorProps {
  showId: string;
  departmentId: string;
  note: ProductionNote;
  onNoteUpdated: (note: ProductionNote) => void;
  onNoteDeleted: (noteId: string) => void;
}

export function NoteEditor({
  showId,
  departmentId,
  note,
  onNoteUpdated,
  onNoteDeleted,
}: NoteEditorProps): React.ReactElement {
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versions, setVersions] = useState<ProductionNoteVersion[]>([]);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content ?? "");
    setHasUnsavedChanges(false);
  }, [note.id, note.title, note.content]);

  const saveNote = useCallback(
    async (saveVersion = false) => {
      if (isSaving) return;
      setIsSaving(true);

      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${note.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              content,
              saveVersion,
              isDraft: false,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save note");
        }

        const data = (await response.json()) as { note: ProductionNote };
        onNoteUpdated(data.note);
        setHasUnsavedChanges(false);

        if (saveVersion) {
          toast({
            title: "Version saved",
            description: "A new version of this note has been saved",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to save note",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [showId, departmentId, note.id, title, content, isSaving, onNoteUpdated, toast]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setHasUnsavedChanges(true);

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        void saveNote(false);
      }, 2000);
    },
    [saveNote]
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  }, []);

  const handleTogglePin = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${note.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !note.isPinned }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { note: ProductionNote };
        onNoteUpdated(data.note);
        toast({
          title: note.isPinned ? "Note unpinned" : "Note pinned",
          description: note.isPinned
            ? "The note has been unpinned"
            : "The note will appear at the top",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive",
      });
    }
  }, [showId, departmentId, note.id, note.isPinned, onNoteUpdated, toast]);

  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${note.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onNoteDeleted(note.id);
        toast({
          title: "Note deleted",
          description: "The note has been permanently deleted",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  }, [showId, departmentId, note.id, onNoteDeleted, toast]);

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${note.id}`
      );
      if (response.ok) {
        const data = (await response.json()) as { versions: ProductionNoteVersion[] };
        setVersions(data.versions);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    }
  }, [showId, departmentId, note.id, toast]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Input
          value={title}
          onChange={(e) => {
            handleTitleChange(e.target.value);
          }}
          onBlur={() => {
            if (hasUnsavedChanges) void saveNote();
          }}
          className="h-8 border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Note title..."
        />
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-muted-foreground text-xs">Unsaved changes</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void saveNote(true);
            }}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Version"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  void handleTogglePin();
                }}
              >
                {note.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin note
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin note
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowVersionDialog(true);
                  void fetchVersions();
                }}
              >
                <History className="mr-2 h-4 w-4" />
                Version history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setShowDeleteDialog(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => {
            handleContentChange(e.target.value);
          }}
          className="min-h-[400px] w-full resize-none border-0 bg-transparent text-sm focus:outline-none"
          placeholder="Start writing..."
        />
      </ScrollArea>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete &quot;{note.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {versions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No previous versions saved
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">Version {version.version}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.changesSummary && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {version.changesSummary}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTitle(version.title);
                        setContent(version.content ?? "");
                        setHasUnsavedChanges(true);
                        setShowVersionDialog(false);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
