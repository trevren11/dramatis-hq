import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface SubscriptionConfirmationEmailProps {
  name: string;
  planName: string;
  amount: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  features: string[];
  dashboardUrl: string;
  billingUrl: string;
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

const successBox = {
  backgroundColor: "#ecfdf5",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
  border: "2px solid #10b981",
};

const checkmark = {
  fontSize: "48px",
  marginBottom: "12px",
};

const planText = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#059669",
  margin: "0",
};

const priceText = {
  fontSize: "16px",
  color: "#047857",
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

const featuresHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  marginTop: "24px",
  marginBottom: "12px",
};

const featureItem = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  marginBottom: "8px",
  paddingLeft: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

export function SubscriptionConfirmationEmail({
  name,
  planName,
  amount,
  billingCycle,
  nextBillingDate,
  features,
  dashboardUrl,
  billingUrl,
  unsubscribeUrl,
}: SubscriptionConfirmationEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";
  const cycleText = billingCycle === "monthly" ? "/month" : "/year";

  return (
    <EmailLayout
      preview={`Welcome to ${planName}! Your subscription is now active`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Welcome to {planName}!</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        Thank you for subscribing to Dramatis HQ! Your subscription is now active and you have full
        access to all {planName} features.
      </Text>

      <Section style={successBox}>
        <Text style={checkmark}>&#10003;</Text>
        <Text style={planText}>{planName}</Text>
        <Text style={priceText}>
          {amount}
          {cycleText}
        </Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Plan:</span> {planName}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Billing Cycle:</span>{" "}
          {billingCycle === "monthly" ? "Monthly" : "Annual"}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Next Billing Date:</span> {nextBillingDate}
        </Text>
      </Section>

      <Text style={featuresHeader}>What&apos;s included in your plan:</Text>
      {features.map((feature, index) => (
        <Text key={index} style={featureItem}>
          &#10003; {feature}
        </Text>
      ))}

      <Section style={buttonContainer}>
        <EmailButton href={dashboardUrl}>Go to Dashboard</EmailButton>
      </Section>

      <Text style={{ ...paragraph, textAlign: "center" as const }}>
        <a href={billingUrl} style={{ color: "#7c3aed" }}>
          Manage your subscription
        </a>
      </Text>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Need help getting started? Check out our{" "}
        <a href="https://dramatishq.com/help" style={{ color: "#7c3aed" }}>
          Help Center
        </a>{" "}
        or reply to this email.
      </Text>
    </EmailLayout>
  );
}

SubscriptionConfirmationEmail.PreviewProps = {
  name: "Sarah Johnson",
  planName: "Producer Pro",
  amount: "$49",
  billingCycle: "monthly",
  nextBillingDate: "May 25, 2026",
  features: [
    "Unlimited auditions",
    "Up to 10 active productions",
    "Advanced scheduling tools",
    "Custom email templates",
    "Priority support",
  ],
  dashboardUrl: "https://dramatishq.com/producer",
  billingUrl: "https://dramatishq.com/settings/billing",
} as SubscriptionConfirmationEmailProps;

export default SubscriptionConfirmationEmail;
