import { Resend } from "resend";

// Initialize Resend client
// In development without a key, we use a mock client
const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

// Default email configuration
export const emailConfig = {
  fromEmail: process.env.EMAIL_FROM ?? "noreply@dramatishq.com",
  fromName: process.env.EMAIL_FROM_NAME ?? "Dramatis HQ",
  replyTo: process.env.EMAIL_REPLY_TO,
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay (will be multiplied for exponential backoff)
};

// Format the from address
export function getFromAddress(): string {
  return `${emailConfig.fromName} <${emailConfig.fromEmail}>`;
}

// Check if email sending is configured
export function isEmailConfigured(): boolean {
  return resend !== null;
}
