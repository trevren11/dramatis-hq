import * as React from "react";
import { Heading, Text, Section, CodeInline } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface VerifyEmailProps {
  name: string;
  verificationUrl: string;
  verificationCode?: string;
  expiresIn?: string;
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

const codeContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const codeStyle = {
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "8px",
  backgroundColor: "#f3f4f6",
  padding: "16px 32px",
  borderRadius: "8px",
  color: "#1f2937",
};

const smallText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  marginTop: "24px",
};

export function VerifyEmailTemplate({
  name,
  verificationUrl,
  verificationCode,
  expiresIn = "24 hours",
}: VerifyEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout preview="Verify your email address for Dramatis HQ" showFooter={true}>
      <Heading style={heading}>Verify Your Email</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        Thanks for signing up for Dramatis HQ! Please verify your email address to complete your
        account setup and access all features.
      </Text>

      {verificationCode && (
        <Section style={codeContainer}>
          <Text style={{ ...paragraph, marginBottom: "8px" }}>Your verification code is:</Text>
          <CodeInline style={codeStyle}>{verificationCode}</CodeInline>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={verificationUrl}>Verify Email Address</EmailButton>
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
        {verificationUrl}
      </Text>

      <Text style={smallText}>
        This link will expire in {expiresIn}. If you didn&apos;t create an account with Dramatis HQ,
        you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmailTemplate.PreviewProps = {
  name: "Sarah Johnson",
  verificationUrl: "https://dramatishq.com/verify?token=abc123",
  verificationCode: "847293",
  expiresIn: "24 hours",
} as VerifyEmailProps;

export default VerifyEmailTemplate;
