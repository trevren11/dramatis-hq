import * as React from "react";
import { Heading, Text, Section, Hr } from "@react-email/components";
import { EmailLayout, EmailButton } from "../components";

export interface PaymentReceiptEmailProps {
  name: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  paymentMethod: string;
  cardLast4?: string;
  planName: string;
  billingPeriod: string;
  invoiceUrl: string;
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

const receiptBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
  border: "1px solid #e5e7eb",
};

const receiptHeader = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "4px",
};

const receiptTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "16px",
};

const lineItem = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "15px",
  lineHeight: "28px",
  color: "#4b5563",
};

const lineItemLabel = {
  color: "#6b7280",
};

const lineItemValue = {
  fontWeight: "500",
  color: "#1f2937",
};

const totalLine = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "2px solid #e5e7eb",
};

const paidBadge = {
  display: "inline-block",
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "14px",
  fontWeight: "600",
  marginTop: "16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

export function PaymentReceiptEmail({
  name,
  invoiceNumber,
  invoiceDate,
  amount,
  paymentMethod,
  cardLast4,
  planName,
  billingPeriod,
  invoiceUrl,
  billingUrl,
  unsubscribeUrl,
}: PaymentReceiptEmailProps): React.ReactElement {
  const firstName = name.split(" ")[0] ?? "there";

  return (
    <EmailLayout
      preview={`Payment receipt for ${amount} - Invoice ${invoiceNumber}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Payment Received</Heading>

      <Text style={paragraph}>Hi {firstName},</Text>

      <Text style={paragraph}>
        Thank you for your payment! Here&apos;s your receipt for your Dramatis HQ subscription.
      </Text>

      <Section style={receiptBox}>
        <Text style={receiptHeader}>Receipt</Text>
        <Text style={receiptTitle}>Invoice #{invoiceNumber}</Text>

        <div style={lineItem}>
          <span style={lineItemLabel}>Date</span>
          <span style={lineItemValue}>{invoiceDate}</span>
        </div>
        <div style={lineItem}>
          <span style={lineItemLabel}>Description</span>
          <span style={lineItemValue}>{planName}</span>
        </div>
        <div style={lineItem}>
          <span style={lineItemLabel}>Billing Period</span>
          <span style={lineItemValue}>{billingPeriod}</span>
        </div>
        <div style={lineItem}>
          <span style={lineItemLabel}>Payment Method</span>
          <span style={lineItemValue}>
            {paymentMethod}
            {cardLast4 && ` ending in ${cardLast4}`}
          </span>
        </div>

        <div style={totalLine}>
          <span>Total Paid</span>
          <span>{amount}</span>
        </div>

        <Text style={{ textAlign: "center" as const, marginTop: "16px", marginBottom: "0" }}>
          <span style={paidBadge}>PAID</span>
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <EmailButton href={invoiceUrl}>Download Invoice</EmailButton>
      </Section>

      <Hr style={divider} />

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Questions about your bill?{" "}
        <a href={billingUrl} style={{ color: "#7c3aed" }}>
          View billing history
        </a>{" "}
        or contact our support team.
      </Text>
    </EmailLayout>
  );
}

PaymentReceiptEmail.PreviewProps = {
  name: "Sarah Johnson",
  invoiceNumber: "INV-2026-0425-001",
  invoiceDate: "April 25, 2026",
  amount: "$49.00",
  paymentMethod: "Visa",
  cardLast4: "4242",
  planName: "Producer Pro (Monthly)",
  billingPeriod: "Apr 25, 2026 - May 25, 2026",
  invoiceUrl: "https://dramatishq.com/invoices/123",
  billingUrl: "https://dramatishq.com/settings/billing",
} as PaymentReceiptEmailProps;

export default PaymentReceiptEmail;
