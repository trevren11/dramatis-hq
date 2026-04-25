import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface RejectionNotificationEmailProps {
  talentName: string;
  showTitle: string;
  organizationName: string;
  auditionsUrl: string;
  feedbackIncluded?: boolean;
  feedback?: string;
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

const feedbackBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "24px",
  borderLeft: "4px solid #9ca3af",
};

const feedbackLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "8px",
};

const feedbackText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  fontStyle: "italic",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const encouragementBox = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "24px",
};

const encouragementText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#1e40af",
  margin: "0",
  textAlign: "center" as const,
};

export function RejectionNotificationEmail({
  talentName,
  showTitle,
  organizationName,
  auditionsUrl,
  feedbackIncluded,
  feedback,
  unsubscribeUrl,
}: RejectionNotificationEmailProps): React.ReactElement {
  const firstName = talentName.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Update on your audition for ${showTitle}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Thank You for Your Audition</Heading>

      <Text style={paragraph}>Dear {firstName},</Text>

      <Text style={paragraph}>
        Thank you for auditioning for our production of <strong>{showTitle}</strong>. We truly
        appreciate the time and effort you put into your audition.
      </Text>

      <Text style={paragraph}>
        After careful consideration, we regret to inform you that we will not be able to offer you a
        role in this production. Please know that this was an incredibly difficult decision given
        the high caliber of talent we saw.
      </Text>

      {feedbackIncluded && feedback && (
        <Section style={feedbackBox}>
          <Text style={feedbackLabel}>Director&apos;s Notes:</Text>
          <Text style={feedbackText}>{feedback}</Text>
        </Section>
      )}

      <Section style={encouragementBox}>
        <Text style={encouragementText}>
          Every audition is a step forward in your journey. We encourage you to continue pursuing
          your passion and hope to see you at future auditions!
        </Text>
      </Section>

      <Text style={paragraph}>
        New audition opportunities are posted regularly. Check out what&apos;s available:
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={auditionsUrl}>Browse Open Auditions</EmailButton>
      </Section>

      <Text style={paragraph}>
        Thank you again for your interest in {organizationName}. We wish you the best in your
        theatrical endeavors.
      </Text>

      <Text style={paragraph}>
        Warm regards,
        <br />
        {organizationName}
      </Text>
    </EmailLayout>
  );
}

RejectionNotificationEmail.PreviewProps = {
  talentName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  auditionsUrl: "https://dramatishq.com/auditions",
  feedbackIncluded: true,
  feedback:
    "Your vocal performance was excellent and showed great range. We encourage you to continue working on character physicality for musical theater roles.",
} as RejectionNotificationEmailProps;

export default RejectionNotificationEmail;
