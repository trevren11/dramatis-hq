import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface SubscriptionEndingEmailProps {
  name: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
  renewUrl: string;
  billingUrl: string;
  activeProductions?: number;
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

const countdownBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
  border: "2px solid #fcd34d",
};

const countdownNumber = {
  fontSize: "48px",
  fontWeight: "700",
  color: "#b45309",
  margin: "0",
};

const countdownLabel = {
  fontSize: "16px",
  color: "#92400e",
  marginTop: "4px",
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

const warningBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  padding: "16px",
  marginBottom: "24px",
};

const warningText = {
  fontSize: "15px",
  color: "#991b1b",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "16px",
};

const secondaryContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const lostFeatures = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#dc2626",
  marginBottom: "4px",
  paddingLeft: "20px",
};

export function SubscriptionEndingEmail({
  name,
  planName,
  endDate,
  daysRemaining,
  renewUrl,
  billingUrl,
  activeProductions,
  unsubscribeUrl,
}: SubscriptionEndingEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Your ${planName} subscription ends in ${String(daysRemaining)} days`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Your Subscription is Ending Soon</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        We wanted to remind you that your <strong>{planName}</strong> subscription is ending soon.
        To continue enjoying full access to Dramatis HQ, please renew your subscription.
      </Text>

      <Section style={countdownBox}>
        <Text style={countdownNumber}>{daysRemaining}</Text>
        <Text style={countdownLabel}>days remaining</Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Current Plan:</span> {planName}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Ends On:</span> {endDate}
        </Text>
        {activeProductions !== undefined && activeProductions > 0 && (
          <Text style={detailRow}>
            <span style={detailLabel}>Active Productions:</span> {activeProductions}
          </Text>
        )}
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>What you&apos;ll lose access to:</strong>
        </Text>
        <Text style={lostFeatures}>&#10007; Creating new auditions</Text>
        <Text style={lostFeatures}>&#10007; Managing active productions</Text>
        <Text style={lostFeatures}>&#10007; Advanced scheduling features</Text>
        <Text style={lostFeatures}>&#10007; Team messaging tools</Text>
        <Text style={lostFeatures}>&#10007; Document storage</Text>
      </Section>

      {activeProductions !== undefined && activeProductions > 0 && (
        <Text style={paragraph}>
          You currently have {activeProductions} active production
          {activeProductions > 1 ? "s" : ""}. Renew now to ensure uninterrupted access for your
          team.
        </Text>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={renewUrl}>Renew Subscription</EmailButton>
      </Section>

      <Section style={secondaryContainer}>
        <EmailButton href={billingUrl} variant="secondary">
          View Billing Options
        </EmailButton>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        If you&apos;ve decided not to continue, we&apos;d love to hear your feedback. You can always
        return whenever you&apos;re ready - your data will be preserved for 30 days after your
        subscription ends.
      </Text>
    </EmailLayout>
  );
}

SubscriptionEndingEmail.PreviewProps = {
  name: "Sarah Johnson",
  planName: "Producer Pro",
  endDate: "May 25, 2026",
  daysRemaining: 7,
  renewUrl: "https://dramatishq.com/settings/billing/renew",
  billingUrl: "https://dramatishq.com/settings/billing",
  activeProductions: 3,
} as SubscriptionEndingEmailProps;

export default SubscriptionEndingEmail;
