import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import {
  emailLogs,
  emailPreferences,
  emailUnsubscribeTokens,
  CRITICAL_EMAIL_TYPES,
  type EmailType,
  type EmailStatus,
} from "@/lib/db/schema/emails";
import { resend, emailConfig, getFromAddress, isEmailConfigured } from "./resend";
import type {
  SendEmailOptions,
  SendEmailResult,
  BulkSendResult,
  EmailPreferenceCheck,
  EmailPreferenceResult,
} from "./types";

export class EmailService {
  private maxRetries: number;
  private retryDelay: number;

  constructor(config?: { maxRetries?: number; retryDelay?: number }) {
    this.maxRetries = config?.maxRetries ?? emailConfig.maxRetries;
    this.retryDelay = config?.retryDelay ?? emailConfig.retryDelay;
  }

  /**
   * Send a single email
   */
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const toEmails = Array.isArray(options.to) ? options.to : [options.to];

    // Check preferences for each recipient if userId is provided
    if (options.userId) {
      const preferenceCheck = await this.checkPreferences({
        userId: options.userId,
        emailType: options.type,
      });

      if (!preferenceCheck.canSend) {
        return {
          success: false,
          error: preferenceCheck.reason ?? "User has opted out of this email type",
          errorCode: "USER_OPTED_OUT",
        };
      }
    }

    // Create log entry
    const logEntry = await db
      .insert(emailLogs)
      .values({
        userId: options.userId,
        type: options.type,
        toEmail: toEmails.join(", "),
        fromEmail: emailConfig.fromEmail,
        subject: options.subject,
        status: "queued",
        metadata: options.metadata,
      })
      .returning();

    const logId = logEntry[0]?.id ?? "";
    if (!logId) {
      return {
        success: false,
        error: "Failed to create email log entry",
        errorCode: "LOG_CREATION_FAILED",
      };
    }

    // If Resend is not configured, log and return mock success
    if (!isEmailConfigured() || !resend) {
      console.log(`[EMAIL] Mock send to ${toEmails.join(", ")}:`, {
        subject: options.subject,
        type: options.type,
      });

      await this.updateLogStatus(logId, "sent", {
        sentAt: new Date(),
        metadata: { ...options.metadata, mockSend: true },
      });

      return {
        success: true,
        id: logId,
        resendId: `mock_${logId}`,
      };
    }

    // Update status to sending
    await this.updateLogStatus(logId, "sending");

    try {
      const result = await this.sendWithRetry(options, toEmails);

      if (result.success && result.resendId) {
        await this.updateLogStatus(logId, "sent", {
          resendId: result.resendId,
          sentAt: new Date(),
        });
      } else {
        await this.updateLogStatus(logId, "failed", {
          error: result.error,
          errorCode: result.errorCode,
          failedAt: new Date(),
        });
      }

      return {
        ...result,
        id: logId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await this.updateLogStatus(logId, "failed", {
        error: errorMessage,
        errorCode: "SEND_FAILED",
        failedAt: new Date(),
      });

      return {
        success: false,
        id: logId,
        error: errorMessage,
        errorCode: "SEND_FAILED",
      };
    }
  }

  /**
   * Send multiple emails in bulk
   */
  async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const results: SendEmailResult[] = [];

    // Process emails sequentially to respect rate limits
    for (const email of emails) {
      const result = await this.send(email);
      results.push(result);

      // Small delay between sends to avoid rate limiting
      await this.delay(100);
    }

    return {
      results,
      summary: {
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  }

  /**
   * Check if user preferences allow sending this email type
   */
  async checkPreferences(check: EmailPreferenceCheck): Promise<EmailPreferenceResult> {
    // Critical emails are always sent
    if (CRITICAL_EMAIL_TYPES.includes(check.emailType)) {
      return { canSend: true };
    }

    const preference = await db.query.emailPreferences.findFirst({
      where: and(
        eq(emailPreferences.userId, check.userId),
        eq(emailPreferences.emailType, check.emailType)
      ),
    });

    // If no preference exists, default to sending
    if (!preference) {
      return { canSend: true };
    }

    if (!preference.enabled) {
      return {
        canSend: false,
        reason: "User has disabled this email type",
      };
    }

    if (preference.frequency === "never") {
      return {
        canSend: false,
        reason: "User has set frequency to never",
      };
    }

    // For digest preferences (daily/weekly), we'd check the last digest time
    // For now, we allow immediate sends for all non-never frequencies
    return { canSend: true };
  }

  /**
   * Generate an unsubscribe token for a user
   */
  async generateUnsubscribeToken(userId: string, emailType?: EmailType): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

    await db.insert(emailUnsubscribeTokens).values({
      userId,
      token,
      emailType,
      expiresAt,
    });

    return token;
  }

  /**
   * Process an unsubscribe request
   */
  async processUnsubscribe(token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const unsubToken = await db.query.emailUnsubscribeTokens.findFirst({
      where: eq(emailUnsubscribeTokens.token, token),
    });

    if (!unsubToken) {
      return { success: false, error: "Invalid token" };
    }

    if (unsubToken.usedAt) {
      return { success: false, error: "Token already used" };
    }

    if (new Date() > unsubToken.expiresAt) {
      return { success: false, error: "Token expired" };
    }

    // Mark token as used
    await db
      .update(emailUnsubscribeTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailUnsubscribeTokens.id, unsubToken.id));

    if (unsubToken.emailType) {
      // Unsubscribe from specific email type
      await db
        .insert(emailPreferences)
        .values({
          userId: unsubToken.userId,
          emailType: unsubToken.emailType,
          enabled: false,
          frequency: "never",
        })
        .onConflictDoUpdate({
          target: [emailPreferences.userId, emailPreferences.emailType],
          set: {
            enabled: false,
            frequency: "never",
            updatedAt: new Date(),
          },
        });
    } else {
      // Unsubscribe from all non-critical emails
      const nonCriticalTypes = [
        "welcome",
        "login_notification",
        "audition_submission",
        "callback_notification",
        "cast_notification",
        "rejection_notification",
        "schedule_update",
        "new_message",
        "document_shared",
        "rehearsal_reminder",
        "subscription_confirmation",
        "subscription_ending",
      ] as const;

      for (const emailType of nonCriticalTypes) {
        await db
          .insert(emailPreferences)
          .values({
            userId: unsubToken.userId,
            emailType,
            enabled: false,
            frequency: "never",
          })
          .onConflictDoUpdate({
            target: [emailPreferences.userId, emailPreferences.emailType],
            set: {
              enabled: false,
              frequency: "never",
              updatedAt: new Date(),
            },
          });
      }
    }

    return { success: true };
  }

  /**
   * Update email log status
   */
  private async updateLogStatus(
    logId: string,
    status: EmailStatus,
    updates?: {
      resendId?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      openedAt?: Date;
      clickedAt?: Date;
      bouncedAt?: Date;
      failedAt?: Date;
      error?: string;
      errorCode?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await db
      .update(emailLogs)
      .set({
        status,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emailLogs.id, logId));
  }

  /**
   * Send email with retry logic
   */
  private async sendWithRetry(
    options: SendEmailOptions,
    toEmails: string[]
  ): Promise<SendEmailResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const result = await this.attemptSend(options, toEmails);
      if (result.success) {
        return result;
      }

      lastError = new Error(result.error ?? "Unknown error");

      // Don't retry on certain errors
      if (this.isNonRetryableError(lastError)) {
        break;
      }

      // Exponential backoff
      if (attempt < this.maxRetries - 1) {
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    return {
      success: false,
      error: lastError?.message ?? "Unknown error",
      errorCode: "SEND_FAILED",
    };
  }

  /**
   * Attempt a single email send
   */
  private async attemptSend(
    options: SendEmailOptions,
    toEmails: string[]
  ): Promise<SendEmailResult> {
    try {
      if (!resend) {
        return { success: false, error: "Resend not configured" };
      }

      const result = await resend.emails.send({
        from: getFromAddress(),
        to: toEmails,
        subject: options.subject,
        html: options.html,
        text: options.text,
        react: options.react,
        replyTo: options.replyTo ?? emailConfig.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
        scheduledAt: options.scheduledAt?.toISOString(),
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      // result.data may be null in edge cases
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const resendId = result.data?.id;
      return { success: true, resendId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      "invalid email",
      "validation error",
      "invalid api key",
      "unauthorized",
      "forbidden",
    ];

    const message = error.message.toLowerCase();
    return nonRetryableMessages.some((msg) => message.includes(msg));
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle webhook events from Resend
   */
  async handleWebhookEvent(
    eventType: string,
    emailId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const log = await db.query.emailLogs.findFirst({
      where: eq(emailLogs.resendId, emailId),
    });

    if (!log) {
      console.warn(`[EMAIL] Webhook received for unknown email: ${emailId}`);
      return;
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    switch (eventType) {
      case "email.delivered":
        updates.status = "delivered";
        updates.deliveredAt = new Date();
        break;
      case "email.opened":
        updates.status = "opened";
        updates.openedAt = new Date();
        break;
      case "email.clicked":
        updates.status = "clicked";
        updates.clickedAt = new Date();
        break;
      case "email.bounced": {
        updates.status = "bounced";
        updates.bouncedAt = new Date();
        const bounceData = data.bounce as { message?: string } | undefined;
        updates.error = bounceData?.message ?? "Email bounced";
        break;
      }
      case "email.complained":
        updates.status = "complained";
        updates.error = "Recipient marked as spam";
        break;
      default:
        console.log(`[EMAIL] Unhandled webhook event: ${eventType}`);
        return;
    }

    await db.update(emailLogs).set(updates).where(eq(emailLogs.id, log.id));
  }
}

// Singleton instance
export const emailService = new EmailService();
