"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, File, Image, FileText, Download, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ProductionFile, ProductionFolder } from "@/lib/db/schema/production-notes";

interface FileManagerProps {
  showId: string;
  departmentId: string;
  files: ProductionFile[];
  folders: ProductionFolder[];
  onFileUploaded: (file: ProductionFile) => void;
  onFileDeleted: (fileId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): React.ComponentType<{ className?: string }> {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

export function FileManager({
  showId,
  departmentId,
  files,
  folders: _folders,
  onFileUploaded,
  onFileDeleted,
}: FileManagerProps): React.ReactElement {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProductionFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProductionFile | null>(null);

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = event.target.files?.[0];
      if (!uploadedFile) return;

      setIsUploading(true);
      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/files`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: uploadedFile.name,
              originalFilename: uploadedFile.name,
              mimeType: uploadedFile.type,
              fileSize: uploadedFile.size,
            }),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to create file record");
        }

        const data = (await response.json()) as { file: ProductionFile; uploadUrl: string };

        const uploadResponse = await fetch(data.uploadUrl, {
          method: "PUT",
          body: uploadedFile,
          headers: { "Content-Type": uploadedFile.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        onFileUploaded(data.file);
        toast({
          title: "File uploaded",
          description: `${uploadedFile.name} has been uploaded`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [showId, departmentId, onFileUploaded, toast]
  );

  const handlePreview = useCallback(
    async (file: ProductionFile) => {
      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/files/${file.id}`
        );
        if (response.ok) {
          const data = (await response.json()) as { downloadUrl: string };
          setSelectedFile(file);
          setPreviewUrl(data.downloadUrl);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load file preview",
          variant: "destructive",
        });
      }
    },
    [showId, departmentId, toast]
  );

  const handleDownload = useCallback(
    async (file: ProductionFile) => {
      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/files/${file.id}`
        );
        if (response.ok) {
          const data = (await response.json()) as { downloadUrl: string };
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = file.originalFilename;
          link.click();
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to download file",
          variant: "destructive",
        });
      }
    },
    [showId, departmentId, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!fileToDelete) return;

    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/files/${fileToDelete.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onFileDeleted(fileToDelete.id);
        toast({
          title: "File deleted",
          description: `${fileToDelete.name} has been deleted`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
    setFileToDelete(null);
  }, [showId, departmentId, fileToDelete, onFileDeleted, toast]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium">Files</h3>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              void handleUpload(e);
            }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
          />
          <Button
            size="sm"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {files.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-center">
            <div>
              <File className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No files uploaded</p>
              <p className="text-sm">Upload files to share with your team</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="group hover:bg-muted/50 relative flex flex-col rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <FileIcon className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">{file.name}</h4>
                      <p className="text-muted-foreground text-xs">
                        {formatFileSize(file.fileSize)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {(file.isImage || file.isPdf) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          void handlePreview(file);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        void handleDownload(file);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-7 w-7"
                      onClick={() => {
                        setFileToDelete(file);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog
        open={!!selectedFile && !!previewUrl}
        onOpenChange={() => {
          setSelectedFile(null);
          setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] items-center justify-center overflow-auto">
            {selectedFile?.isImage && previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={selectedFile.name}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {selectedFile?.isPdf && previewUrl && (
              <iframe src={previewUrl} title={selectedFile.name} className="h-[60vh] w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? This action cannot be
            undone.
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
    </div>
  );
}
