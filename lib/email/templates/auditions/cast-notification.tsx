import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface CastNotificationEmailProps {
  talentName: string;
  showTitle: string;
  organizationName: string;
  roleName: string;
  rehearsalStart: string;
  performanceDates: string;
  venue?: string;
  responseDeadline: string;
  acceptUrl: string;
  declineUrl: string;
  productionPageUrl: string;
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

const celebrationBox = {
  backgroundColor: "#fdf4ff",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
  border: "2px solid #e879f9",
};

const celebrationEmoji = {
  fontSize: "48px",
  marginBottom: "12px",
};

const roleText = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#7c3aed",
  margin: "0",
};

const showText = {
  fontSize: "18px",
  color: "#6b7280",
  marginTop: "8px",
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

export function CastNotificationEmail({
  talentName,
  showTitle,
  organizationName,
  roleName,
  rehearsalStart,
  performanceDates,
  venue,
  responseDeadline,
  acceptUrl,
  declineUrl,
  productionPageUrl,
  additionalInfo,
  unsubscribeUrl,
}: CastNotificationEmailProps): React.ReactElement {
  const firstName = talentName.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Congratulations! You've been cast as ${roleName} in ${showTitle}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Congratulations, {firstName}!</Heading>

      <Text style={paragraph}>
        We are thrilled to inform you that {organizationName} has selected you for their upcoming
        production!
      </Text>

      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>🎭</Text>
        <Text style={roleText}>{roleName}</Text>
        <Text style={showText}>in {showTitle}</Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Rehearsals Begin:</span> {rehearsalStart}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Performance Dates:</span> {performanceDates}
        </Text>
        {venue && (
          <Text style={detailRow}>
            <span style={detailLabel}>Venue:</span> {venue}
          </Text>
        )}
        <Text style={detailRow}>
          <span style={detailLabel}>Organization:</span> {organizationName}
        </Text>
      </Section>

      {additionalInfo && (
        <Text style={paragraph}>
          <strong>Additional Information:</strong>
          <br />
          {additionalInfo}
        </Text>
      )}

      <Text style={deadlineText}>Please confirm your acceptance by {responseDeadline}</Text>

      <Section style={buttonContainer}>
        <EmailButton href={acceptUrl}>Accept Role</EmailButton>
      </Section>

      <Section style={declineContainer}>
        <EmailButton href={declineUrl} variant="secondary">
          Decline Role
        </EmailButton>
      </Section>

      <Text style={paragraph}>
        Once you accept, you&apos;ll have full access to the production page where you can view
        schedules, scripts, and communicate with the team.
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href={productionPageUrl} variant="secondary">
          View Production Details
        </EmailButton>
      </Section>

      <Text style={paragraph}>
        We look forward to working with you!
        <br />
        <br />
        Break a leg,
        <br />
        {organizationName}
      </Text>
    </EmailLayout>
  );
}

CastNotificationEmail.PreviewProps = {
  talentName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  roleName: "Marian Paroo",
  rehearsalStart: "May 15, 2026",
  performanceDates: "July 10-26, 2026",
  venue: "Main Stage Theatre",
  responseDeadline: "May 1, 2026",
  acceptUrl: "https://dramatishq.com/cast/accept/123",
  declineUrl: "https://dramatishq.com/cast/decline/123",
  productionPageUrl: "https://dramatishq.com/shows/123",
  additionalInfo:
    "Please bring comfortable shoes for choreography. First read-through will be on May 15th at 7 PM.",
} as CastNotificationEmailProps;

export default CastNotificationEmail;
