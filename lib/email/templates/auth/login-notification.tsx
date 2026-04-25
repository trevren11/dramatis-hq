import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface LoginNotificationEmailProps {
  name: string;
  loginTime: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  securityUrl: string;
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

const infoBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "24px",
};

const infoRow = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0",
};

const infoLabel = {
  fontWeight: "600",
  color: "#1f2937",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const warningBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  padding: "12px 16px",
  marginTop: "24px",
  marginBottom: "24px",
};

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#991b1b",
  margin: "0",
};

export function LoginNotificationEmail({
  name,
  loginTime,
  ipAddress,
  location,
  device,
  browser,
  securityUrl,
  unsubscribeUrl,
}: LoginNotificationEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout preview="New login to your Dramatis HQ account" unsubscribeUrl={unsubscribeUrl}>
      <Heading style={heading}>New Login Detected</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        We noticed a new sign-in to your Dramatis HQ account. If this was you, no action is needed.
      </Text>

      <Section style={infoBox}>
        <Text style={infoRow}>
          <span style={infoLabel}>Time:</span> {loginTime}
        </Text>
        {location && (
          <Text style={infoRow}>
            <span style={infoLabel}>Location:</span> {location}
          </Text>
        )}
        {device && (
          <Text style={infoRow}>
            <span style={infoLabel}>Device:</span> {device}
          </Text>
        )}
        {browser && (
          <Text style={infoRow}>
            <span style={infoLabel}>Browser:</span> {browser}
          </Text>
        )}
        {ipAddress && (
          <Text style={infoRow}>
            <span style={infoLabel}>IP Address:</span> {ipAddress}
          </Text>
        )}
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>Wasn&apos;t you?</strong> If you didn&apos;t sign in recently, your account may be
          compromised. Please secure your account immediately.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <EmailButton href={securityUrl} variant="danger">
          Secure My Account
        </EmailButton>
      </Section>

      <Text style={paragraph}>For your security, we recommend:</Text>
      <Text style={{ ...paragraph, paddingLeft: "20px" }}>
        &#8226; Using a strong, unique password
        <br />
        &#8226; Enabling two-factor authentication
        <br />
        &#8226; Reviewing your active sessions regularly
      </Text>
    </EmailLayout>
  );
}

LoginNotificationEmail.PreviewProps = {
  name: "Sarah Johnson",
  loginTime: "April 25, 2026 at 10:30 AM EST",
  ipAddress: "192.168.1.1",
  location: "New York, NY, USA",
  device: "MacBook Pro",
  browser: "Chrome 123",
  securityUrl: "https://dramatishq.com/settings/security",
} as LoginNotificationEmailProps;

export default LoginNotificationEmail;
