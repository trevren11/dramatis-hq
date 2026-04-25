"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DOCUMENT_TYPE_LABELS } from "@/lib/db/schema/documents";
import { TAX_DOCUMENT_TYPES } from "@/lib/db/schema/producer-documents";

interface DocumentUploadFormProps {
  talentUserId: string;
  talentName: string;
  showId?: string;
  showTitle?: string;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const documentTypeOptions = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function DocumentUploadForm({
  talentUserId,
  talentName,
  showId,
  showTitle,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DocumentUploadFormProps): React.ReactElement {
  const [file, setFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");
  const [deadline, setDeadline] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [sendNotification, setSendNotification] = React.useState<boolean>(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isTaxDocument = TAX_DOCUMENT_TYPES.includes(documentType as (typeof TAX_DOCUMENT_TYPES)[number]);
  const currentYear = new Date().getFullYear();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!file || !documentType) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("name", name || file.name);
    formData.append("talentUserId", talentUserId);
    if (showId) formData.append("showId", showId);
    if (year) formData.append("year", year);
    if (deadline) formData.append("deadline", deadline);
    if (notes) formData.append("notes", notes);
    formData.append("sendNotification", String(sendNotification));

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm">
          <span className="text-muted-foreground">Uploading for:</span>{" "}
          <span className="font-medium">{talentName}</span>
        </p>
        {showTitle && (
          <p className="text-sm">
            <span className="text-muted-foreground">Show:</span>{" "}
            <span className="font-medium">{showTitle}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Document File *</Label>
        <Input
          ref={fileInputRef}
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          required
        />
        <p className="text-muted-foreground text-xs">
          Accepted formats: PDF, JPEG, PNG. Max size: 25MB
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type *</Label>
        <Select value={documentType} onValueChange={setDocumentType} required>
          <SelectTrigger id="documentType">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Document Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={file?.name ?? "Enter document name"}
        />
      </div>

      {isTaxDocument && (
        <div className="space-y-2">
          <Label htmlFor="year">Tax Year *</Label>
          <Select value={year} onValueChange={setYear} required={isTaxDocument}>
            <SelectTrigger id="year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline (optional)</Label>
        <Input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes for this document..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sendNotification"
          checked={sendNotification}
          onCheckedChange={(checked) => setSendNotification(checked === true)}
        />
        <Label htmlFor="sendNotification" className="text-sm font-normal">
          Notify {talentName.split(" ")[0]} via email when document is uploaded
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!file || !documentType || isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </div>
    </form>
  );
}
