"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Download, Trash2, FileText, Calendar, Lock, AlertCircle } from "lucide-react";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/db/schema/documents";

interface DocumentItem {
  id: string;
  name: string;
  documentType: DocumentType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  isProducerUploaded: boolean;
  description: string | null;
  taxYear: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentListProps {
  refreshTrigger?: number;
}

export function DocumentList({ refreshTrigger = 0 }: DocumentListProps): React.ReactElement {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = (await response.json()) as { documents: DocumentItem[] };
      setDocuments(data.documents);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load documents",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDocuments();
  }, [refreshTrigger, fetchDocuments]);

  const handleDownload = async (doc: DocumentItem): Promise<void> => {
    setDownloadingId(doc.id);
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to download");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download document",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: DocumentItem): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    setDeletingId(doc.id);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to delete");
      }

      setDocuments(documents.filter((d) => d.id !== doc.id));
      toast({
        title: "Success",
        description: "Document deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>Loading your secure documents...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents</CardTitle>
        <CardDescription>
          {documents.length === 0
            ? "No documents uploaded yet"
            : `${String(documents.length)} document${documents.length === 1 ? "" : "s"} stored securely`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
            <FileText className="mb-2 h-12 w-12 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                {/* Icon */}
                <div className="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{doc.name}</h4>
                    <Badge variant="outline" className="flex-shrink-0">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </Badge>
                    {doc.isProducerUploaded && (
                      <Badge variant="secondary" className="flex-shrink-0">
                        <Lock className="mr-1 h-3 w-3" />
                        Producer
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.createdAt)}
                    </span>
                    {doc.taxYear && <span>Tax Year: {doc.taxYear}</span>}
                  </div>
                  {doc.description && (
                    <p className="text-muted-foreground mt-1 truncate text-sm">{doc.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {doc.isProducerUploaded ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Cannot delete producer-uploaded documents"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDelete(doc)}
                      disabled={deletingId === doc.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
