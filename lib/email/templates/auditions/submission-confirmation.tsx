import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface SubmissionConfirmationEmailProps {
  talentName: string;
  showTitle: string;
  organizationName: string;
  submittedAt: string;
  confirmationNumber: string;
  rolesAppliedFor?: string[];
  auditionDetailsUrl: string;
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

const confirmationBox = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const confirmationLabel = {
  fontSize: "14px",
  color: "#047857",
  marginBottom: "4px",
};

const confirmationNumber = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#065f46",
  fontFamily: "monospace",
};

const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const detailRow = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0",
};

const detailLabel = {
  fontWeight: "600",
  color: "#1f2937",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

export function SubmissionConfirmationEmail({
  talentName,
  showTitle,
  organizationName,
  submittedAt,
  confirmationNumber: confNumber,
  rolesAppliedFor,
  auditionDetailsUrl,
  unsubscribeUrl,
}: SubmissionConfirmationEmailProps): React.ReactElement {
  const firstName = talentName.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Your audition submission for ${showTitle} has been received`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Submission Received!</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        Thank you for submitting your audition for <strong>{showTitle}</strong> with{" "}
        {organizationName}. Your submission has been received and is being reviewed.
      </Text>

      <Section style={confirmationBox}>
        <Text style={confirmationLabel}>Confirmation Number</Text>
        <Text style={confirmationNumber}>{confNumber}</Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Show:</span> {showTitle}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Organization:</span> {organizationName}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Submitted:</span> {submittedAt}
        </Text>
        {rolesAppliedFor && rolesAppliedFor.length > 0 && (
          <Text style={detailRow}>
            <span style={detailLabel}>Roles:</span> {rolesAppliedFor.join(", ")}
          </Text>
        )}
      </Section>

      <Text style={paragraph}>
        <strong>What happens next?</strong>
      </Text>
      <Text style={paragraph}>
        The creative team will review all submissions and reach out to selected candidates for
        auditions or callbacks. Keep an eye on your email and Dramatis HQ notifications.
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={auditionDetailsUrl}>View Submission Details</EmailButton>
      </Section>

      <Text style={paragraph}>Break a leg!</Text>
    </EmailLayout>
  );
}

SubmissionConfirmationEmail.PreviewProps = {
  talentName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  submittedAt: "April 25, 2026 at 2:30 PM",
  confirmationNumber: "AUD-2026-0425-1234",
  rolesAppliedFor: ["Marian Paroo", "Mrs. Paroo"],
  auditionDetailsUrl: "https://dramatishq.com/applications/123",
} as SubmissionConfirmationEmailProps;

export default SubmissionConfirmationEmail;
