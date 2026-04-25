import { describe, it, expect } from "vitest";
import * as resendModule from "../resend";
import { CRITICAL_EMAIL_TYPES } from "@/lib/db/schema/emails";

describe("EmailService", () => {
  describe("resend configuration", () => {
    it("getFromAddress returns formatted from address", () => {
      const { getFromAddress, emailConfig } = resendModule;
      const fromAddress = getFromAddress();
      expect(fromAddress).toBe(`${emailConfig.fromName} <${emailConfig.fromEmail}>`);
    });

    it("isEmailConfigured returns false when no API key", () => {
      // resend is null when no API key is set
      expect(resendModule.resend).toBeNull();
      expect(resendModule.isEmailConfigured()).toBe(false);
    });

    it("emailConfig has required properties", () => {
      const { emailConfig } = resendModule;
      expect(emailConfig).toHaveProperty("fromEmail");
      expect(emailConfig).toHaveProperty("fromName");
      expect(emailConfig).toHaveProperty("maxRetries");
      expect(emailConfig).toHaveProperty("retryDelay");
      expect(emailConfig.maxRetries).toBe(3);
      expect(emailConfig.retryDelay).toBe(1000);
    });
  });

  describe("critical email types", () => {
    it("includes email_verification as critical", () => {
      expect(CRITICAL_EMAIL_TYPES).toContain("email_verification");
    });

    it("includes password_reset as critical", () => {
      expect(CRITICAL_EMAIL_TYPES).toContain("password_reset");
    });

    it("includes payment_failed as critical", () => {
      expect(CRITICAL_EMAIL_TYPES).toContain("payment_failed");
    });

    it("does not include welcome as critical", () => {
      expect(CRITICAL_EMAIL_TYPES).not.toContain("welcome");
    });

    it("does not include new_message as critical", () => {
      expect(CRITICAL_EMAIL_TYPES).not.toContain("new_message");
    });
  });
});

// Note: EmailService tests that require database access are skipped in this
// test file because the service imports from lib/db which uses "server-only".
// Integration tests for the service should be done in an e2e test environment.

describe("Email Templates", () => {
  it("exports auth templates", async () => {
    const templates = await import("../templates");
    expect(templates.WelcomeEmail).toBeDefined();
    expect(templates.VerifyEmailTemplate).toBeDefined();
    expect(templates.PasswordResetEmail).toBeDefined();
    expect(templates.LoginNotificationEmail).toBeDefined();
  });

  it("exports audition templates", async () => {
    const templates = await import("../templates");
    expect(templates.SubmissionConfirmationEmail).toBeDefined();
    expect(templates.CallbackNotificationEmail).toBeDefined();
    expect(templates.CastNotificationEmail).toBeDefined();
    expect(templates.RejectionNotificationEmail).toBeDefined();
  });

  it("exports production templates", async () => {
    const templates = await import("../templates");
    expect(templates.ScheduleUpdateEmail).toBeDefined();
    expect(templates.NewMessageEmail).toBeDefined();
    expect(templates.DocumentSharedEmail).toBeDefined();
    expect(templates.RehearsalReminderEmail).toBeDefined();
  });

  it("exports billing templates", async () => {
    const templates = await import("../templates");
    expect(templates.SubscriptionConfirmationEmail).toBeDefined();
    expect(templates.PaymentReceiptEmail).toBeDefined();
    expect(templates.PaymentFailedEmail).toBeDefined();
    expect(templates.SubscriptionEndingEmail).toBeDefined();
  });

  it("exports shared components", async () => {
    const templates = await import("../templates");
    expect(templates.EmailLayout).toBeDefined();
    expect(templates.EmailButton).toBeDefined();
  });
});
