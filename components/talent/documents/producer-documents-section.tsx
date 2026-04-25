"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_TYPE_LABELS } from "@/lib/db/schema/documents";

interface ProducerUploadedDocument {
  id: string;
  name: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  taxYear?: number;
  createdAt: string;
  uploadedBy?: {
    organizationId: string;
    organizationName: string | null;
  };
  show?: {
    id: string;
    title: string;
  } | null;
  viewStatus?: {
    viewedAt: string | null;
    downloadedAt: string | null;
  };
}

interface ProducerDocumentsSectionProps {
  documents: ProducerUploadedDocument[];
  isLoading?: boolean;
  onView: (documentId: string) => void;
  onDownload: (documentId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
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

function getDocumentIcon(documentType: string): string {
  const icons: Record<string, string> = {
    W2: "W2",
    "1099": "1099",
    I9: "I-9",
    Contract: "Contract",
    CallSheet: "Call Sheet",
    Other: "Doc",
  };
  return icons[documentType] ?? "Doc";
}

function isTaxDocument(documentType: string): boolean {
  return documentType === "W2" || documentType === "1099";
}

export function ProducerDocumentsSection({
  documents,
  isLoading = false,
  onView,
  onDownload,
}: ProducerDocumentsSectionProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents from Productions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents from Productions</CardTitle>
          <CardDescription>
            When producers upload documents for you (W-2s, contracts, etc.), they will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group documents by organization
  const groupedByOrg = documents.reduce<Record<string, ProducerUploadedDocument[]>>((acc, doc) => {
    const orgName = doc.uploadedBy?.organizationName ?? "Unknown Production";
    if (!acc[orgName]) acc[orgName] = [];
    acc[orgName]!.push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Documents from Productions</h2>
        <p className="text-muted-foreground text-sm">
          Tax documents, contracts, and other files uploaded by your producers
        </p>
      </div>

      {Object.entries(groupedByOrg).map(([orgName, orgDocs]) => (
        <Card key={orgName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{orgName}</CardTitle>
            <CardDescription>{orgDocs.length} document(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-lg font-medium">
                      {getDocumentIcon(doc.documentType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{doc.name}</h4>
                        {isTaxDocument(doc.documentType) && (
                          <Badge variant="outline" className="text-xs">
                            Tax Document
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                        {doc.taxYear && <span> &bull; {doc.taxYear}</span>}
                        {doc.show && <span> &bull; {doc.show.title}</span>}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatFileSize(doc.fileSize)} &bull; Uploaded {formatDate(doc.createdAt)}
                      </p>
                      {doc.viewStatus?.downloadedAt && (
                        <p className="text-xs text-green-600">
                          Downloaded {formatDate(doc.viewStatus.downloadedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onView(doc.id)}>
                      View
                    </Button>
                    <Button size="sm" onClick={() => onDownload(doc.id)}>
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Important notice for tax documents */}
      {documents.some((d) => isTaxDocument(d.documentType)) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="text-amber-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-800">Tax Document Notice</p>
                <p className="text-sm text-amber-700">
                  Please download and save tax documents (W-2, 1099) to your personal records. You
                  will need these for filing your taxes. Documents are securely encrypted and only
                  you can access them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
