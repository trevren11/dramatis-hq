import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface RehearsalReminderEmailProps {
  recipientName: string;
  showTitle: string;
  organizationName: string;
  rehearsalType: string;
  date: string;
  time: string;
  location: string;
  calledScenes?: string[];
  calledRoles?: string[];
  whatToBring?: string[];
  notes?: string;
  calendarUrl: string;
  conflictUrl: string;
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

const reminderBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const reminderText = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#92400e",
  margin: "0",
};

const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const detailRow = {
  fontSize: "15px",
  lineHeight: "28px",
  color: "#4b5563",
  margin: "0",
};

const detailLabel = {
  fontWeight: "600",
  color: "#1f2937",
};

const sectionHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
  marginTop: "20px",
  marginBottom: "8px",
};

const listItem = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  marginBottom: "4px",
  paddingLeft: "16px",
};

const notesBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  padding: "12px 16px",
  marginBottom: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "16px",
};

const conflictContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

export function RehearsalReminderEmail({
  recipientName,
  showTitle,
  organizationName,
  rehearsalType,
  date,
  time,
  location,
  calledScenes,
  calledRoles,
  whatToBring,
  notes,
  calendarUrl,
  conflictUrl,
  unsubscribeUrl,
}: RehearsalReminderEmailProps): React.ReactElement {
  const firstName = recipientName.split(" ")[0];

  return (
    <EmailLayout
      preview={`Rehearsal reminder: ${rehearsalType} tomorrow for ${showTitle}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={reminderBox}>
        <Text style={reminderText}>REHEARSAL TOMORROW</Text>
      </Section>

      <Heading style={heading}>{rehearsalType}</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        This is a reminder that you have a rehearsal scheduled for tomorrow for{" "}
        <strong>{showTitle}</strong>.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Date:</span> {date}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Time:</span> {time}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Location:</span> {location}
        </Text>
      </Section>

      {calledScenes && calledScenes.length > 0 && (
        <>
          <Text style={sectionHeader}>SCENES BEING WORKED:</Text>
          {calledScenes.map((scene, index) => (
            <Text key={index} style={listItem}>
              &#8226; {scene}
            </Text>
          ))}
        </>
      )}

      {calledRoles && calledRoles.length > 0 && (
        <>
          <Text style={sectionHeader}>CALLED ROLES:</Text>
          {calledRoles.map((role, index) => (
            <Text key={index} style={listItem}>
              &#8226; {role}
            </Text>
          ))}
        </>
      )}

      {whatToBring && whatToBring.length > 0 && (
        <>
          <Text style={sectionHeader}>PLEASE BRING:</Text>
          {whatToBring.map((item, index) => (
            <Text key={index} style={listItem}>
              &#8226; {item}
            </Text>
          ))}
        </>
      )}

      {notes && (
        <Section style={notesBox}>
          <Text style={{ margin: "0", fontSize: "15px", color: "#1e40af" }}>
            <strong>Director&apos;s Notes:</strong> {notes}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={calendarUrl}>View Full Schedule</EmailButton>
      </Section>

      <Section style={conflictContainer}>
        <EmailButton href={conflictUrl} variant="secondary">
          Report a Conflict
        </EmailButton>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Please arrive 10 minutes early. If you have any questions, contact the stage manager through
        Dramatis HQ.
      </Text>

      <Text style={paragraph}>
        See you there!
        <br />
        {organizationName}
      </Text>
    </EmailLayout>
  );
}

RehearsalReminderEmail.PreviewProps = {
  recipientName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  rehearsalType: "Act 2 Choreography Rehearsal",
  date: "Thursday, May 21, 2026",
  time: "7:00 PM - 10:00 PM",
  location: "Dance Studio B, 456 Theater Way",
  calledScenes: ["Shipoopi", "The Wells Fargo Wagon", "Finale"],
  calledRoles: ["Harold Hill", "Marian Paroo", "Ensemble"],
  whatToBring: ["Dance shoes", "Water bottle", "Character shoes for finale"],
  notes:
    "We'll be running the full choreography for all Act 2 numbers. Please be warmed up and ready to go at 7 PM sharp.",
  calendarUrl: "https://dramatishq.com/shows/123/schedule",
  conflictUrl: "https://dramatishq.com/shows/123/schedule/conflict",
} as RehearsalReminderEmailProps;

export default RehearsalReminderEmail;
