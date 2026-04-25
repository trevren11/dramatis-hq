import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface NewMessageEmailProps {
  recipientName: string;
  senderName: string;
  senderRole?: string;
  showTitle?: string;
  messagePreview: string;
  messageUrl: string;
  isGroupMessage?: boolean;
  groupName?: string;
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

const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "24px",
  marginBottom: "24px",
  borderLeft: "4px solid #7c3aed",
};

const senderInfo = {
  display: "flex",
  alignItems: "center",
  marginBottom: "12px",
};

const senderAvatar = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  fontWeight: "600",
  marginRight: "12px",
};

const senderName = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
};

const senderRoleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const messagePreviewStyle = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

export function NewMessageEmail({
  recipientName,
  senderName: sender,
  senderRole,
  showTitle,
  messagePreview,
  messageUrl,
  isGroupMessage,
  groupName,
  unsubscribeUrl,
}: NewMessageEmailProps): React.ReactElement {
  const firstName = recipientName.split(" ")[0] ?? "there";
  const senderInitials = sender
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const subject = isGroupMessage
    ? `New message in ${groupName ?? "group chat"}`
    : `New message from ${sender}`;

  return (
    <EmailLayout preview={subject} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={heading}>New Message</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        {isGroupMessage ? (
          <>
            You have a new message in <strong>{groupName}</strong>
            {showTitle && <> for {showTitle}</>}.
          </>
        ) : (
          <>
            <strong>{sender}</strong> sent you a message
            {showTitle && <> regarding {showTitle}</>}.
          </>
        )}
      </Text>

      <Section style={messageBox}>
        <Section style={senderInfo}>
          <span style={senderAvatar}>{senderInitials}</span>
          <div>
            <Text style={senderName}>{sender}</Text>
            {senderRole && <Text style={senderRoleStyle}>{senderRole}</Text>}
          </div>
        </Section>
        <Text style={messagePreviewStyle}>{messagePreview}</Text>
      </Section>

      <Section style={buttonContainer}>
        <EmailButton href={messageUrl}>View Full Message</EmailButton>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Reply directly in Dramatis HQ to continue the conversation.
      </Text>
    </EmailLayout>
  );
}

NewMessageEmail.PreviewProps = {
  recipientName: "Sarah Johnson",
  senderName: "Jane Director",
  senderRole: "Director",
  showTitle: "The Music Man",
  messagePreview:
    "Hi Sarah, I wanted to check in about the choreography for the Shipoopi number. Can you meet 15 minutes early tomorrow to run through the new blocking? Let me know if that works for you.",
  messageUrl: "https://dramatishq.com/messages/123",
  isGroupMessage: false,
} as NewMessageEmailProps;

export default NewMessageEmail;
