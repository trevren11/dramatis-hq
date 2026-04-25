import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface ScheduleUpdateEmailProps {
  recipientName: string;
  showTitle: string;
  organizationName: string;
  updateType: "added" | "modified" | "cancelled";
  eventName: string;
  previousDate?: string;
  previousTime?: string;
  newDate: string;
  newTime: string;
  location?: string;
  notes?: string;
  updatedBy: string;
  calendarUrl: string;
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

const updateBadge = {
  added: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  modified: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  cancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
};

const badgeContainer = {
  marginBottom: "24px",
};

const badge = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "14px",
  fontWeight: "600",
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

const strikethrough = {
  textDecoration: "line-through",
  color: "#9ca3af",
};

const newValue = {
  color: "#059669",
  fontWeight: "500",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const notesBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  padding: "12px 16px",
  marginBottom: "24px",
};

export function ScheduleUpdateEmail({
  recipientName,
  showTitle,
  organizationName,
  updateType,
  eventName,
  previousDate,
  previousTime,
  newDate,
  newTime,
  location,
  notes,
  updatedBy,
  calendarUrl,
  unsubscribeUrl,
}: ScheduleUpdateEmailProps): React.ReactElement {
  const firstName = recipientName.split(" ")[0] ?? "there";
  const badgeStyle = { ...badge, ...updateBadge[updateType] };

  const updateText = {
    added: "New Event Added",
    modified: "Schedule Changed",
    cancelled: "Event Cancelled",
  };

  return (
    <EmailLayout
      preview={`Schedule update for ${showTitle}: ${eventName}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Schedule Update</Heading>

      <Section style={badgeContainer}>
        <span style={badgeStyle}>{updateText[updateType]}</span>
      </Section>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        There has been a schedule update for <strong>{showTitle}</strong>.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Event:</span> {eventName}
        </Text>

        {updateType === "modified" && previousDate && previousTime ? (
          <>
            <Text style={detailRow}>
              <span style={detailLabel}>Previous:</span>{" "}
              <span style={strikethrough}>
                {previousDate} at {previousTime}
              </span>
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>New:</span>{" "}
              <span style={newValue}>
                {newDate} at {newTime}
              </span>
            </Text>
          </>
        ) : updateType === "cancelled" ? (
          <Text style={detailRow}>
            <span style={detailLabel}>Was scheduled for:</span>{" "}
            <span style={strikethrough}>
              {newDate} at {newTime}
            </span>
          </Text>
        ) : (
          <Text style={detailRow}>
            <span style={detailLabel}>When:</span> {newDate} at {newTime}
          </Text>
        )}

        {location && (
          <Text style={detailRow}>
            <span style={detailLabel}>Location:</span> {location}
          </Text>
        )}

        <Text style={{ ...detailRow, marginTop: "12px", fontSize: "14px", color: "#6b7280" }}>
          Updated by {updatedBy}
        </Text>
      </Section>

      {notes && (
        <Section style={notesBox}>
          <Text style={{ margin: "0", fontSize: "15px", color: "#1e40af" }}>
            <strong>Notes:</strong> {notes}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={calendarUrl}>View Full Calendar</EmailButton>
      </Section>

      <Text style={paragraph}>
        Please update your calendar accordingly. If you have any conflicts, contact the production
        team through Dramatis HQ.
      </Text>

      <Text style={paragraph}>
        Best,
        <br />
        {organizationName}
      </Text>
    </EmailLayout>
  );
}

ScheduleUpdateEmail.PreviewProps = {
  recipientName: "Sarah Johnson",
  showTitle: "The Music Man",
  organizationName: "Broadway Theatre Company",
  updateType: "modified",
  eventName: "Act 2 Choreography Rehearsal",
  previousDate: "May 20, 2026",
  previousTime: "6:00 PM",
  newDate: "May 21, 2026",
  newTime: "7:00 PM",
  location: "Dance Studio B",
  notes: "Moved due to venue conflict. Please bring dance shoes.",
  updatedBy: "Jane Director",
  calendarUrl: "https://dramatishq.com/shows/123/schedule",
} as ScheduleUpdateEmailProps;

export default ScheduleUpdateEmail;
