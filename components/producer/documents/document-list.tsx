"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// CardHeader and CardTitle imported for potential future use
void CardHeader;
void CardTitle;
import { Badge } from "@/components/ui/badge";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DOCUMENT_TYPE_LABELS } from "@/lib/db/schema/documents";
import { PRODUCER_DOCUMENT_STATUS_OPTIONS } from "@/lib/db/schema/producer-documents";
import { DocumentUploadForm } from "./document-upload-form";

interface ProducerDocument {
  id: string;
  documentId: string;
  documentType: string;
  name: string;
  mimeType: string;
  fileSize: number;
  status: string;
  year: number | null;
  deadline: string | null;
  notes: string | null;
  viewedAt: string | null;
  downloadedAt: string | null;
  createdAt: string;
  talent: {
    id: string;
    userId: string;
    name: string;
    email: string;
  };
  show?: {
    id: string;
    title: string;
  } | null;
}

interface DocumentListProps {
  documents: ProducerDocument[];
  isLoading?: boolean;
  showId?: string;
  showTitle?: string;
  talentOptions?: { id: string; userId: string; name: string }[];
  onUpload: (formData: FormData) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  onRefresh?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: string): React.ReactElement {
  const statusConfig = PRODUCER_DOCUMENT_STATUS_OPTIONS.find((s) => s.value === status);
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    delivered: "secondary",
    viewed: "default",
    downloaded: "default",
  };

  return <Badge variant={variants[status] ?? "outline"}>{statusConfig?.label ?? status}</Badge>;
}

export function DocumentList({
  documents,
  isLoading = false,
  showId,
  showTitle,
  talentOptions = [],
  onUpload,
  onDelete,
  onRefresh,
}: DocumentListProps): React.ReactElement {
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [selectedTalent, setSelectedTalent] = React.useState<{
    id: string;
    userId: string;
    name: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredDocuments = documents.filter((doc) => {
    if (filterType !== "all" && doc.documentType !== filterType) return false;
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    return true;
  });

  const handleUploadSubmit = async (formData: FormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onUpload(formData);
      setUploadDialogOpen(false);
      setSelectedTalent(null);
      onRefresh?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUpload = (talent: { id: string; userId: string; name: string }): void => {
    setSelectedTalent(talent);
    setUploadDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PRODUCER_DOCUMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {talentOptions.length > 0 && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Upload Document</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Document for Talent</DialogTitle>
                <DialogDescription>
                  {selectedTalent
                    ? `Uploading document for ${selectedTalent.name}`
                    : "First, select a talent to upload a document for"}
                </DialogDescription>
              </DialogHeader>

              {!selectedTalent ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Select a talent:</p>
                  <div className="max-h-[300px] space-y-1 overflow-y-auto">
                    {talentOptions.map((talent) => (
                      <Button
                        key={talent.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          handleOpenUpload(talent);
                        }}
                      >
                        {talent.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <DocumentUploadForm
                  talentUserId={selectedTalent.userId}
                  talentName={selectedTalent.name}
                  showId={showId}
                  showTitle={showTitle}
                  onSubmit={handleUploadSubmit}
                  onCancel={() => {
                    setSelectedTalent(null);
                    setUploadDialogOpen(false);
                  }}
                  isSubmitting={isSubmitting}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center">Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No documents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{doc.name}</h4>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    <span className="font-medium">{doc.talent.name}</span>
                    {doc.show && <span> &bull; {doc.show.title}</span>}
                    {doc.year && <span> &bull; {doc.year}</span>}
                    <span> &bull; {formatFileSize(doc.fileSize)}</span>
                    <span> &bull; {formatDate(doc.createdAt)}</span>
                  </p>
                  {(doc.viewedAt ?? doc.downloadedAt) && (
                    <p className="mt-1 text-xs text-green-600">
                      {doc.downloadedAt
                        ? `Downloaded ${formatDate(doc.downloadedAt)}`
                        : doc.viewedAt
                          ? `Viewed ${formatDate(doc.viewedAt)}`
                          : null}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                  </Badge>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void onDelete(doc.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
