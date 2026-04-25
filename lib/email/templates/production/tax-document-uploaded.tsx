import * as React from "react";
import { Heading, Text, Section, Hr } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface TaxDocumentUploadedEmailProps {
  recipientName: string;
  organizationName: string;
  showTitle?: string;
  documentName: string;
  documentType: "W2" | "1099" | "I9" | "Contract" | "CallSheet" | "Other";
  year?: number;
  documentUrl: string;
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
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "24px",
  marginBottom: "24px",
  border: "1px solid #fbbf24",
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

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const importantBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  padding: "12px 16px",
  marginBottom: "24px",
};

const securityNote = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "24px",
  border: "1px solid #10b981",
};

const documentIcons: Record<string, string> = {
  W2: "📋",
  "1099": "📋",
  I9: "📝",
  Contract: "📄",
  CallSheet: "📅",
  Other: "📎",
};

const typeLabels: Record<string, string> = {
  W2: "W-2 Tax Form",
  "1099": "1099 Tax Form",
  I9: "I-9 Employment Form",
  Contract: "Contract",
  CallSheet: "Call Sheet",
  Other: "Document",
};

const typeDescriptions: Record<string, string> = {
  W2: "This is your annual wage and tax statement required for filing your taxes.",
  "1099": "This is your independent contractor earnings statement required for filing your taxes.",
  I9: "This is your employment eligibility verification form required for working in the United States.",
  Contract: "Please review this contract document carefully.",
  CallSheet: "Please review the attached call sheet for your upcoming production schedule.",
  Other: "Please review this document at your earliest convenience.",
};

export function TaxDocumentUploadedEmail({
  recipientName,
  organizationName,
  showTitle,
  documentName: docName,
  documentType,
  year,
  documentUrl,
  unsubscribeUrl,
}: TaxDocumentUploadedEmailProps): React.ReactElement {
  const firstName = recipientName.split(" ")[0] ?? "there";
  const icon = documentIcons[documentType] ?? documentIcons.Other;
  const typeLabel = typeLabels[documentType] ?? "Document";
  const typeDescription = typeDescriptions[documentType] ?? typeDescriptions.Other;
  const isTaxDocument = documentType === "W2" || documentType === "1099";

  return (
    <EmailLayout
      preview={`${organizationName} uploaded a ${typeLabel}${year ? ` (${String(year)})` : ""} for you`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>New Document Available</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        <strong>{organizationName}</strong> has uploaded a new document for you
        {showTitle && (
          <>
            {" "}
            related to <strong>{showTitle}</strong>
          </>
        )}
        .
      </Text>

      <Section style={documentBox}>
        <Text style={documentIcon}>{icon}</Text>
        <Text style={documentName}>{docName}</Text>
        <Text style={documentMeta}>
          {typeLabel}
          {year && <> &bull; Tax Year {year}</>}
        </Text>
      </Section>

      <Text style={paragraph}>{typeDescription}</Text>

      {isTaxDocument && (
        <Section style={importantBox}>
          <Text style={{ margin: "0", fontSize: "15px", color: "#dc2626" }}>
            <strong>Important:</strong> This document contains sensitive tax information. Please
            download and save it securely for your records. You will need this for filing your
            taxes.
          </Text>
        </Section>
      )}

      {documentType === "I9" && (
        <Section style={importantBox}>
          <Text style={{ margin: "0", fontSize: "15px", color: "#dc2626" }}>
            <strong>Important:</strong> I-9 forms must be completed within 3 business days of your
            start date. Please review this document promptly.
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={documentUrl}>View Document</EmailButton>
      </Section>

      <Hr style={{ borderColor: "#e5e7eb", marginTop: "32px", marginBottom: "32px" }} />

      <Section style={securityNote}>
        <Text style={{ margin: "0", fontSize: "14px", color: "#047857", fontWeight: "500" }}>
          Your documents are securely encrypted
        </Text>
        <Text style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
          All documents uploaded to Dramatis HQ are encrypted using industry-standard AES-256
          encryption. Only you and authorized personnel can access your documents.
        </Text>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280", marginTop: "24px" }}>
        This document was uploaded to your secure document storage in Dramatis HQ. You can access
        all your documents anytime from your Documents page.
      </Text>
    </EmailLayout>
  );
}

TaxDocumentUploadedEmail.PreviewProps = {
  recipientName: "John Smith",
  organizationName: "Broadway Theatre Company",
  showTitle: "The Music Man",
  documentName: "W-2 2025 - John Smith.pdf",
  documentType: "W2",
  year: 2025,
  documentUrl: "https://dramatishq.com/documents/view/123",
} as TaxDocumentUploadedEmailProps;

export default TaxDocumentUploadedEmail;
