import type { EmailType, EmailStatus } from "@/lib/db/schema/emails";
import type { ReactElement } from "react";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement;
  type: EmailType;
  userId?: string;
  metadata?: Record<string, unknown>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
  scheduledAt?: Date;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  resendId?: string;
  error?: string;
  errorCode?: string;
}

export interface BulkSendResult {
  results: SendEmailResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface EmailServiceConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface EmailLogEntry {
  id: string;
  userId?: string | null;
  type: EmailType;
  toEmail: string;
  fromEmail: string;
  subject: string;
  resendId?: string | null;
  status: EmailStatus;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EmailPreferenceCheck {
  userId: string;
  emailType: EmailType;
}

export interface EmailPreferenceResult {
  canSend: boolean;
  reason?: string;
}

// Webhook event types from Resend
export type ResendWebhookEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

export interface ResendWebhookPayload {
  type: ResendWebhookEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields depending on event type
    click?: {
      link: string;
      timestamp: string;
    };
    bounce?: {
      message: string;
    };
  };
}
