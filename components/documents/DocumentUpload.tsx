"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, FileText, X } from "lucide-react";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/db/schema/documents";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

interface PendingFile {
  file: File;
  name: string;
  documentType: DocumentType;
  description: string;
  taxYear?: number;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps): React.ReactElement {
  const { toast } = useToast();
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelection = useCallback(
    (file: File): void => {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, or PNG file",
        });
        return;
      }

      if (file.size > MAX_DOCUMENT_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is ${String(MAX_DOCUMENT_SIZE / (1024 * 1024))}MB`,
        });
        return;
      }

      setPendingFile({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""),
        documentType: "Other",
        description: "",
      });
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!pendingFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile.file);
      formData.append("name", pendingFile.name);
      formData.append("documentType", pendingFile.documentType);
      if (pendingFile.description) {
        formData.append("description", pendingFile.description);
      }
      if (pendingFile.taxYear) {
        formData.append("taxYear", String(pendingFile.taxYear));
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to upload");
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setPendingFile(null);
      onUploadComplete?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isTaxDocument = pendingFile?.documentType === "W2" || pendingFile?.documentType === "1099";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload secure documents like W-2s, contracts, and call sheets. All documents are
          encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pendingFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "hover:border-primary hover:bg-muted/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_DOCUMENT_TYPES.join(",")}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground mt-2 text-sm">Drag and drop or click to upload</p>
            <p className="text-muted-foreground text-xs">
              PDF, JPG, or PNG up to {MAX_DOCUMENT_SIZE / (1024 * 1024)}MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File preview */}
            <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
              <FileText className="h-8 w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pendingFile.file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(pendingFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingFile(null);
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Document details form */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Document Name</label>
                <Input
                  value={pendingFile.name}
                  onChange={(e) => {
                    setPendingFile({ ...pendingFile, name: e.target.value });
                  }}
                  placeholder="Enter document name"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Document Type</label>
                <select
                  value={pendingFile.documentType}
                  onChange={(e) => {
                    setPendingFile({
                      ...pendingFile,
                      documentType: e.target.value as DocumentType,
                    });
                  }}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isUploading}
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {isTaxDocument && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Tax Year</label>
                  <Input
                    type="number"
                    value={pendingFile.taxYear ?? ""}
                    onChange={(e) => {
                      setPendingFile({
                        ...pendingFile,
                        taxYear: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      });
                    }}
                    placeholder={String(new Date().getFullYear() - 1)}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    disabled={isUploading}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Description (optional)</label>
                <Input
                  value={pendingFile.description}
                  onChange={(e) => {
                    setPendingFile({ ...pendingFile, description: e.target.value });
                  }}
                  placeholder="Add a description"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Upload button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPendingFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleUpload()}
                disabled={isUploading || !pendingFile.name}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
