import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
  ipAddress?: string;
  userAgent?: string;
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

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const smallText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  marginTop: "24px",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "12px 16px",
  marginTop: "24px",
  marginBottom: "24px",
};

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#92400e",
  margin: "0",
};

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresIn = "1 hour",
  ipAddress,
  userAgent,
}: PasswordResetEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout preview="Reset your Dramatis HQ password" showFooter={true}>
      <Heading style={heading}>Reset Your Password</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        We received a request to reset the password for your Dramatis HQ account. Click the button
        below to choose a new password.
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
      </Section>

      <Text style={paragraph}>Or copy and paste this link into your browser:</Text>
      <Text
        style={{
          ...paragraph,
          wordBreak: "break-all",
          fontSize: "14px",
          color: "#7c3aed",
        }}
      >
        {resetUrl}
      </Text>

      <Text style={smallText}>
        This link will expire in {expiresIn}. After that, you&apos;ll need to request a new password
        reset.
      </Text>

      <Section style={warningBox}>
        <Text style={warningText}>
          If you didn&apos;t request this password reset, please ignore this email or contact our
          support team if you have concerns about your account security.
        </Text>
      </Section>

      {(ipAddress ?? userAgent) && (
        <Text style={smallText}>
          Request details:
          {ipAddress && (
            <>
              <br />
              IP Address: {ipAddress}
            </>
          )}
          {userAgent && (
            <>
              <br />
              Device: {userAgent}
            </>
          )}
        </Text>
      )}
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Sarah Johnson",
  resetUrl: "https://dramatishq.com/reset-password?token=abc123",
  expiresIn: "1 hour",
  ipAddress: "192.168.1.1",
  userAgent: "Chrome on macOS",
} as PasswordResetEmailProps;

export default PasswordResetEmail;
