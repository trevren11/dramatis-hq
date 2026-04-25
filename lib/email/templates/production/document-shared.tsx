import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface DocumentSharedEmailProps {
  recipientName: string;
  sharedBy: string;
  showTitle: string;
  documentName: string;
  documentType: "script" | "music" | "schedule" | "notes" | "other";
  description?: string;
  documentUrl: string;
  expiresAt?: string;
  unsubscribeUrl?: string;
}

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  marginBottom: "16px",
};

const documentBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "24px",
  marginBottom: "24px",
  border: "1px solid #e5e7eb",
};

const documentIcon = {
  fontSize: "32px",
  marginBottom: "12px",
};

const documentName = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
  marginBottom: "8px",
};

const documentMeta = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const descriptionBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  padding: "12px 16px",
  marginBottom: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const warningText = {
  fontSize: "14px",
  color: "#dc2626",
  textAlign: "center" as const,
  marginTop: "16px",
};

const documentIcons: Record<string, string> = {
  script: "📜",
  music: "🎵",
  schedule: "📅",
  notes: "📝",
  other: "📄",
};

export function DocumentSharedEmail({
  recipientName,
  sharedBy,
  showTitle,
  documentName: docName,
  documentType,
  description,
  documentUrl,
  expiresAt,
  unsubscribeUrl,
}: DocumentSharedEmailProps): React.ReactElement {
  const firstName = recipientName.split(" ")[0] ?? "there";
  const icon = documentIcons[documentType] ?? documentIcons.other;

  const typeLabels: Record<string, string> = {
    script: "Script",
    music: "Sheet Music",
    schedule: "Schedule",
    notes: "Production Notes",
    other: "Document",
  };

  const typeLabel = typeLabels[documentType] ?? "Document";

  return (
    <EmailLayout
      preview={`${sharedBy} shared a ${typeLabel} with you`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Document Shared With You</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        <strong>{sharedBy}</strong> has shared a document with you for <strong>{showTitle}</strong>.
      </Text>

      <Section style={documentBox}>
        <Text style={documentIcon}>{icon}</Text>
        <Text style={documentName}>{docName}</Text>
        <Text style={documentMeta}>
          {typeLabel} &bull; Shared by {sharedBy}
        </Text>
      </Section>

      {description && (
        <Section style={descriptionBox}>
          <Text style={{ margin: "0", fontSize: "15px", color: "#1e40af" }}>
            <strong>Note from {sharedBy}:</strong> {description}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={documentUrl}>View Document</EmailButton>
      </Section>

      {expiresAt && <Text style={warningText}>This document link expires on {expiresAt}</Text>}

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Please do not share this document outside of the production team without permission from the
        director or production manager.
      </Text>
    </EmailLayout>
  );
}

DocumentSharedEmail.PreviewProps = {
  recipientName: "Sarah Johnson",
  sharedBy: "Jane Director",
  showTitle: "The Music Man",
  documentName: "The Music Man - Full Script (Revised).pdf",
  documentType: "script",
  description:
    "Here's the revised script with the updated Act 2 changes we discussed. Please review before Wednesday's rehearsal.",
  documentUrl: "https://dramatishq.com/documents/123",
  expiresAt: "May 15, 2026",
} as DocumentSharedEmailProps;

export default DocumentSharedEmail;
