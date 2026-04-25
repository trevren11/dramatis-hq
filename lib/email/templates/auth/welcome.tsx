import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface WelcomeEmailProps {
  name: string;
  userType: "talent" | "producer";
  loginUrl: string;
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

const featureList = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  marginBottom: "8px",
  paddingLeft: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

export function WelcomeEmail({
  name,
  userType,
  loginUrl,
  unsubscribeUrl,
}: WelcomeEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";
  const isTalent = userType === "talent";

  return (
    <EmailLayout preview={`Welcome to Dramatis HQ, ${firstName}!`} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={heading}>Welcome to Dramatis HQ, {firstName}!</Heading>

      <Text style={paragraph}>
        We&apos;re thrilled to have you join our community of theater professionals.
        {isTalent
          ? " Your journey to your next role starts here."
          : " Managing your productions just got easier."}
      </Text>

      <Text style={paragraph}>With Dramatis HQ, you can:</Text>

      {isTalent ? (
        <Section>
          <Text style={featureList}>&#8226; Build and share your professional resume</Text>
          <Text style={featureList}>&#8226; Discover and apply for auditions</Text>
          <Text style={featureList}>&#8226; Manage your calendar and availability</Text>
          <Text style={featureList}>&#8226; Communicate with production teams</Text>
          <Text style={featureList}>&#8226; Access scripts and rehearsal materials</Text>
        </Section>
      ) : (
        <Section>
          <Text style={featureList}>&#8226; Post auditions and manage submissions</Text>
          <Text style={featureList}>&#8226; Organize callbacks and cast your shows</Text>
          <Text style={featureList}>&#8226; Create and share rehearsal schedules</Text>
          <Text style={featureList}>&#8226; Communicate with your entire cast</Text>
          <Text style={featureList}>&#8226; Securely share scripts and materials</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={loginUrl}>Get Started</EmailButton>
      </Section>

      <Text style={paragraph}>
        If you have any questions, our support team is always here to help.
      </Text>

      <Text style={paragraph}>
        Break a leg!
        <br />
        The Dramatis HQ Team
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Sarah Johnson",
  userType: "talent",
  loginUrl: "https://dramatishq.com/login",
} as WelcomeEmailProps;

export default WelcomeEmail;
