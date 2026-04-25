"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { FileManager } from "./FileManager";
import { CommentSection } from "./CommentSection";
import { Plus, FileText, FolderOpen, Settings } from "lucide-react";
import type {
  ProductionDepartment,
  ProductionNote,
  ProductionFile,
  ProductionFolder,
} from "@/lib/db/schema/production-notes";

interface DepartmentPanelProps {
  showId: string;
  department: ProductionDepartment;
  onDepartmentUpdated: () => void;
}

interface NoteWithComments extends ProductionNote {
  commentsCount?: number;
}

export function DepartmentPanel({
  showId,
  department,
  onDepartmentUpdated: _onDepartmentUpdated,
}: DepartmentPanelProps): React.ReactElement {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState<NoteWithComments[]>([]);
  const [files, setFiles] = useState<ProductionFile[]>([]);
  const [folders, setFolders] = useState<ProductionFolder[]>([]);
  const [selectedNote, setSelectedNote] = useState<ProductionNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const fetchDepartmentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${department.id}`
      );
      if (response.ok) {
        const data = (await response.json()) as {
          notes: NoteWithComments[];
          files: ProductionFile[];
          folders: ProductionFolder[];
        };
        setNotes(data.notes);
        setFiles(data.files);
        setFolders(data.folders);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load department data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showId, department.id, toast]);

  useEffect(() => {
    void fetchDepartmentData();
  }, [fetchDepartmentData]);

  const handleCreateNote = useCallback(async () => {
    setIsCreatingNote(true);
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${department.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Untitled Note",
            content: "",
            isDraft: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const data = (await response.json()) as { note: ProductionNote };
      setNotes((prev) => [data.note, ...prev]);
      setSelectedNote(data.note);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    } finally {
      setIsCreatingNote(false);
    }
  }, [showId, department.id, toast]);

  const handleNoteUpdated = useCallback((updatedNote: ProductionNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    setSelectedNote(updatedNote);
  }, []);

  const handleNoteDeleted = useCallback(
    (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    },
    [selectedNote]
  );

  const handleFileUploaded = useCallback((file: ProductionFile) => {
    setFiles((prev) => [file, ...prev]);
  }, []);

  const handleFileDeleted = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: department.color ?? "#6b7280" }}
          />
          <h2 className="text-lg font-semibold">{department.name}</h2>
        </div>
        <div className="flex gap-2">
          {activeTab === "notes" && (
            <Button
              size="sm"
              onClick={() => {
                void handleCreateNote();
              }}
              disabled={isCreatingNote}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-b px-4">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger
              value="notes"
              className="data-[state=active]:border-primary gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4" />
              Notes
              {notes.length > 0 && (
                <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs">
                  {notes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="data-[state=active]:border-primary gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FolderOpen className="h-4 w-4" />
              Files
              {files.length > 0 && (
                <span className="bg-muted ml-1 rounded-full px-2 py-0.5 text-xs">
                  {files.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:border-primary gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes" className="m-0 flex-1 overflow-hidden">
          <div className="flex h-full">
            <div className="w-72 shrink-0 border-r">
              <ScrollArea className="h-full">
                <NotesList
                  notes={notes}
                  selectedNoteId={selectedNote?.id}
                  onSelectNote={setSelectedNote}
                  isLoading={isLoading}
                />
              </ScrollArea>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              {selectedNote ? (
                <>
                  <div className="flex-1 overflow-hidden">
                    <NoteEditor
                      showId={showId}
                      departmentId={department.id}
                      note={selectedNote}
                      onNoteUpdated={handleNoteUpdated}
                      onNoteDeleted={handleNoteDeleted}
                    />
                  </div>
                  <div className="h-64 shrink-0 border-t">
                    <CommentSection
                      showId={showId}
                      departmentId={department.id}
                      noteId={selectedNote.id}
                    />
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">Select a note or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="m-0 flex-1 overflow-hidden">
          <FileManager
            showId={showId}
            departmentId={department.id}
            files={files}
            folders={folders}
            onFileUploaded={handleFileUploaded}
            onFileDeleted={handleFileDeleted}
          />
        </TabsContent>

        <TabsContent value="settings" className="m-0 flex-1 overflow-auto p-4">
          <div className="max-w-lg space-y-4">
            <h3 className="text-lg font-medium">Department Settings</h3>
            <p className="text-muted-foreground text-sm">
              Configure department access, templates, and notifications.
            </p>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Department settings coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
