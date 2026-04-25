import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface CallbackNotificationEmailProps {
  talentName: string;
  showTitle: string;
  organizationName: string;
  roleName: string;
  callbackDate: string;
  callbackTime: string;
  location?: string;
  virtualLink?: string;
  responseDeadline: string;
  acceptUrl: string;
  declineUrl: string;
  additionalInfo?: string;
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

const highlightBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "24px",
};

const highlightText = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1e40af",
  margin: "0",
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
  marginBottom: "16px",
};

const declineContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const deadlineText = {
  fontSize: "14px",
  color: "#dc2626",
  fontWeight: "500",
  textAlign: "center" as const,
  marginTop: "24px",
};

export function CallbackNotificationEmail({
  talentName,
  showTitle,
  organizationName,
  roleName,
  callbackDate,
  callbackTime,
  location,
  virtualLink,
  responseDeadline,
  acceptUrl,
  declineUrl,
  additionalInfo,
  unsubscribeUrl,
}: CallbackNotificationEmailProps): React.ReactElement {
  const firstName = talentName.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Callback invitation for ${roleName} in ${showTitle}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>You&apos;ve Been Called Back!</Heading>

      <Text style={paragraph}>Dear {firstName},</Text>

      <Text style={paragraph}>
        Congratulations! Based on your audition, {organizationName} would like to invite you to a
        callback for their production of <strong>{showTitle}</strong>.
      </Text>

      <Section style={highlightBox}>
        <Text style={highlightText}>You are being considered for: {roleName}</Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Date:</span> {callbackDate}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Time:</span> {callbackTime}
        </Text>
        {location && (
          <Text style={detailRow}>
            <span style={detailLabel}>Location:</span> {location}
          </Text>
        )}
        {virtualLink && (
          <Text style={detailRow}>
            <span style={detailLabel}>Virtual Link:</span>{" "}
            <a href={virtualLink} style={{ color: "#7c3aed" }}>
              Join Callback
            </a>
          </Text>
        )}
      </Section>

      {additionalInfo && (
        <Text style={paragraph}>
          <strong>Additional Information:</strong>
          <br />
          {additionalInfo}
        </Text>
      )}

      <Text style={deadlineText}>Please respond by {responseDeadline}</Text>

      <Section style={buttonContainer}>
        <EmailButton href={acceptUrl}>Accept Callback</EmailButton>
      </Section>

      <Section style={declineContainer}>
        <EmailButton href={declineUrl} variant="secondary">
          Unable to Attend
        </EmailButton>
      </Section>

      <Text style={paragraph}>
        We look forward to seeing you! If you have any questions, please contact the production team
        through Dramatis HQ.
      </Text>

      <Text style={paragraph}>
        Best regards,
        <br />
        {organizationName}
      </Text>
    </EmailLayout>
  );
}

CallbackNotificationEmail.PreviewProps = {
  talentName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  roleName: "Marian Paroo",
  callbackDate: "Saturday, May 3, 2026",
  callbackTime: "2:00 PM - 4:00 PM",
  location: "Main Stage Theatre, 123 Broadway, New York, NY",
  responseDeadline: "May 1, 2026",
  acceptUrl: "https://dramatishq.com/callback/accept/123",
  declineUrl: "https://dramatishq.com/callback/decline/123",
  additionalInfo:
    "Please prepare a 16-bar cut of 'My White Knight' and be prepared for cold readings.",
} as CallbackNotificationEmailProps;

export default CallbackNotificationEmail;
