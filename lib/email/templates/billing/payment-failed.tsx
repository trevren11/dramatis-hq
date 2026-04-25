import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface PaymentFailedEmailProps {
  name: string;
  amount: string;
  planName: string;
  failureReason?: string;
  cardLast4?: string;
  retryDate?: string;
  gracePeriodEndDate: string;
  updatePaymentUrl: string;
  billingUrl: string;
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

const alertBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "24px",
  marginBottom: "24px",
  border: "1px solid #fecaca",
};

const alertIcon = {
  fontSize: "32px",
  marginBottom: "12px",
  textAlign: "center" as const,
};

const alertText = {
  fontSize: "16px",
  color: "#991b1b",
  textAlign: "center" as const,
  margin: "0",
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
  backgroundColor: "#fef9c3",
  borderLeft: "4px solid #eab308",
  padding: "16px",
  marginBottom: "24px",
};

const warningText = {
  fontSize: "15px",
  color: "#854d0e",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const commonReasons = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  marginBottom: "4px",
  paddingLeft: "20px",
};

export function PaymentFailedEmail({
  name,
  amount,
  planName,
  failureReason,
  cardLast4,
  retryDate,
  gracePeriodEndDate,
  updatePaymentUrl,
  billingUrl,
}: PaymentFailedEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout preview={`Action required: Your payment of ${amount} failed`} showFooter={true}>
      <Heading style={heading}>Payment Failed</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        We were unable to process your payment for your Dramatis HQ subscription. Please update your
        payment method to avoid any interruption to your service.
      </Text>

      <Section style={alertBox}>
        <Text style={alertIcon}>&#9888;</Text>
        <Text style={alertText}>
          Payment of {amount} for {planName} was declined
        </Text>
      </Section>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <span style={detailLabel}>Amount:</span> {amount}
        </Text>
        <Text style={detailRow}>
          <span style={detailLabel}>Plan:</span> {planName}
        </Text>
        {cardLast4 && (
          <Text style={detailRow}>
            <span style={detailLabel}>Card:</span> ending in {cardLast4}
          </Text>
        )}
        {failureReason && (
          <Text style={detailRow}>
            <span style={detailLabel}>Reason:</span> {failureReason}
          </Text>
        )}
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>Important:</strong> Your subscription will remain active until{" "}
          {gracePeriodEndDate}. Please update your payment method before then to avoid losing access
          to your account.
        </Text>
      </Section>

      {retryDate && (
        <Text style={paragraph}>
          We&apos;ll automatically retry the payment on {retryDate}. To avoid another failed
          payment, please update your payment method now.
        </Text>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={updatePaymentUrl} variant="danger">
          Update Payment Method
        </EmailButton>
      </Section>

      <Text style={paragraph}>
        <strong>Common reasons for payment failure:</strong>
      </Text>
      <Text style={commonReasons}>&#8226; Insufficient funds</Text>
      <Text style={commonReasons}>&#8226; Card expired or canceled</Text>
      <Text style={commonReasons}>&#8226; Bank security block on the transaction</Text>
      <Text style={commonReasons}>&#8226; Incorrect billing information</Text>

      <Text style={{ ...paragraph, marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
        If you believe this is an error or need assistance, please{" "}
        <a href={billingUrl} style={{ color: "#7c3aed" }}>
          contact our support team
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

PaymentFailedEmail.PreviewProps = {
  name: "Sarah Johnson",
  amount: "$49.00",
  planName: "Producer Pro",
  failureReason: "Card declined",
  cardLast4: "4242",
  retryDate: "April 28, 2026",
  gracePeriodEndDate: "May 2, 2026",
  updatePaymentUrl: "https://dramatishq.com/settings/billing/update",
  billingUrl: "https://dramatishq.com/settings/billing",
} as PaymentFailedEmailProps;

export default PaymentFailedEmail;
