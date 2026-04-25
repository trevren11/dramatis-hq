import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import {
  WelcomeEmail,
  VerifyEmailTemplate,
  PasswordResetEmail,
  LoginNotificationEmail,
  SubmissionConfirmationEmail,
  CallbackNotificationEmail,
  CastNotificationEmail,
  RejectionNotificationEmail,
  ScheduleUpdateEmail,
  NewMessageEmail,
  DocumentSharedEmail,
  RehearsalReminderEmail,
  SubscriptionConfirmationEmail,
  PaymentReceiptEmail,
  PaymentFailedEmail,
  SubscriptionEndingEmail,
  EmailLayout,
  EmailButton,
} from "../index";

describe("Email Templates", () => {
  describe("Auth Templates", () => {
    describe("WelcomeEmail", () => {
      it("renders for talent user", async () => {
        const html = await render(
          WelcomeEmail({
            name: "Jane Doe",
            userType: "talent",
            loginUrl: "https://example.com/login",
          })
        );
        expect(html).toContain("Welcome to Dramatis HQ");
        expect(html).toContain("Jane");
        expect(html).toContain("https://example.com/login");
        expect(html).toContain("Discover and apply for auditions");
      });

      it("renders for producer user", async () => {
        const html = await render(
          WelcomeEmail({
            name: "John Producer",
            userType: "producer",
            loginUrl: "https://example.com/login",
          })
        );
        expect(html).toContain("Welcome to Dramatis HQ");
        expect(html).toContain("Post auditions and manage submissions");
      });

      it("handles single-word names", async () => {
        const html = await render(
          WelcomeEmail({
            name: "Madonna",
            userType: "talent",
            loginUrl: "https://example.com/login",
          })
        );
        expect(html).toContain("Madonna");
      });

      it("has valid PreviewProps", () => {
        expect(WelcomeEmail.PreviewProps).toBeDefined();
        expect(WelcomeEmail.PreviewProps.name).toBeDefined();
        expect(WelcomeEmail.PreviewProps.userType).toBeDefined();
        expect(WelcomeEmail.PreviewProps.loginUrl).toBeDefined();
      });
    });

    describe("VerifyEmailTemplate", () => {
      it("renders with verification link", async () => {
        const html = await render(
          VerifyEmailTemplate({
            name: "Jane Doe",
            verificationUrl: "https://example.com/verify?token=abc",
          })
        );
        expect(html).toContain("Verify");
        expect(html).toContain("https://example.com/verify?token=abc");
      });

      it("has valid PreviewProps", () => {
        expect(VerifyEmailTemplate.PreviewProps).toBeDefined();
        expect(VerifyEmailTemplate.PreviewProps.name).toBeDefined();
        expect(VerifyEmailTemplate.PreviewProps.verificationUrl).toBeDefined();
      });
    });

    describe("PasswordResetEmail", () => {
      it("renders with reset link", async () => {
        const html = await render(
          PasswordResetEmail({
            name: "Jane Doe",
            resetUrl: "https://example.com/reset?token=xyz",
          })
        );
        expect(html).toContain("Reset");
        expect(html).toContain("https://example.com/reset?token=xyz");
      });

      it("has valid PreviewProps", () => {
        expect(PasswordResetEmail.PreviewProps).toBeDefined();
      });
    });

    describe("LoginNotificationEmail", () => {
      it("renders with login details", async () => {
        const html = await render(
          LoginNotificationEmail({
            name: "Jane Doe",
            loginTime: "April 25, 2026 at 10:30 AM",
            device: "MacBook Pro",
            browser: "Chrome 123",
            location: "New York, NY",
            ipAddress: "192.168.1.1",
            securityUrl: "https://example.com/security",
          })
        );
        expect(html).toContain("Jane");
        expect(html).toContain("April 25, 2026");
        expect(html).toContain("New York, NY");
      });

      it("has valid PreviewProps", () => {
        expect(LoginNotificationEmail.PreviewProps).toBeDefined();
      });
    });
  });

  describe("Audition Templates", () => {
    describe("SubmissionConfirmationEmail", () => {
      it("renders submission confirmation", async () => {
        const html = await render(
          SubmissionConfirmationEmail({
            talentName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            submittedAt: "April 25, 2026 at 2:30 PM",
            confirmationNumber: "ABC123",
            rolesAppliedFor: ["Hamilton", "Burr"],
            auditionDetailsUrl: "https://example.com/audition/123",
          })
        );
        expect(html).toContain("Hamilton");
        expect(html).toContain("Broadway Productions");
        expect(html).toContain("Submission");
      });

      it("has valid PreviewProps", () => {
        expect(SubmissionConfirmationEmail.PreviewProps).toBeDefined();
      });
    });

    describe("CallbackNotificationEmail", () => {
      it("renders callback notification", async () => {
        const html = await render(
          CallbackNotificationEmail({
            talentName: "Jane Doe",
            showTitle: "The Music Man",
            organizationName: "Theater Company",
            roleName: "Marian",
            callbackDate: "May 1, 2026",
            callbackTime: "2:00 PM",
            responseDeadline: "April 28, 2026",
            acceptUrl: "https://example.com/accept",
            declineUrl: "https://example.com/decline",
          })
        );
        expect(html).toContain("Called Back");
        expect(html).toContain("Marian");
        expect(html).toContain("The Music Man");
      });

      it("renders with optional location", async () => {
        const html = await render(
          CallbackNotificationEmail({
            talentName: "Jane Doe",
            showTitle: "The Music Man",
            organizationName: "Theater Company",
            roleName: "Marian",
            callbackDate: "May 1, 2026",
            callbackTime: "2:00 PM",
            location: "Main Stage Theater",
            responseDeadline: "April 28, 2026",
            acceptUrl: "https://example.com/accept",
            declineUrl: "https://example.com/decline",
          })
        );
        expect(html).toContain("Main Stage Theater");
      });

      it("renders with virtual link", async () => {
        const html = await render(
          CallbackNotificationEmail({
            talentName: "Jane Doe",
            showTitle: "The Music Man",
            organizationName: "Theater Company",
            roleName: "Marian",
            callbackDate: "May 1, 2026",
            callbackTime: "2:00 PM",
            virtualLink: "https://zoom.us/j/123",
            responseDeadline: "April 28, 2026",
            acceptUrl: "https://example.com/accept",
            declineUrl: "https://example.com/decline",
          })
        );
        expect(html).toContain("https://zoom.us/j/123");
      });

      it("has valid PreviewProps", () => {
        expect(CallbackNotificationEmail.PreviewProps).toBeDefined();
      });
    });

    describe("CastNotificationEmail", () => {
      it("renders cast notification", async () => {
        const html = await render(
          CastNotificationEmail({
            talentName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            roleName: "Angelica Schuyler",
            rehearsalStart: "May 1, 2026",
            performanceDates: "June 1-30, 2026",
            acceptUrl: "https://example.com/accept",
            declineUrl: "https://example.com/decline",
            responseDeadline: "April 28, 2026",
            productionPageUrl: "https://example.com/production",
          })
        );
        expect(html).toContain("Hamilton");
        expect(html).toContain("Angelica Schuyler");
        expect(html).toContain("cast");
      });

      it("has valid PreviewProps", () => {
        expect(CastNotificationEmail.PreviewProps).toBeDefined();
      });
    });

    describe("RejectionNotificationEmail", () => {
      it("renders rejection notification", async () => {
        const html = await render(
          RejectionNotificationEmail({
            talentName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            auditionsUrl: "https://example.com/auditions",
          })
        );
        expect(html).toContain("Hamilton");
        expect(html).toContain("Broadway Productions");
      });

      it("has valid PreviewProps", () => {
        expect(RejectionNotificationEmail.PreviewProps).toBeDefined();
      });
    });
  });

  describe("Production Templates", () => {
    describe("ScheduleUpdateEmail", () => {
      it("renders schedule update", async () => {
        const html = await render(
          ScheduleUpdateEmail({
            recipientName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            updateType: "added",
            eventName: "Opening Night",
            newDate: "May 1, 2026",
            newTime: "7:00 PM",
            updatedBy: "Jane Director",
            calendarUrl: "https://example.com/schedule",
          })
        );
        expect(html).toContain("Hamilton");
        expect(html).toContain("Opening Night");
        expect(html).toContain("Schedule");
      });

      it("has valid PreviewProps", () => {
        expect(ScheduleUpdateEmail.PreviewProps).toBeDefined();
      });
    });

    describe("NewMessageEmail", () => {
      it("renders new message notification", async () => {
        const html = await render(
          NewMessageEmail({
            recipientName: "Jane Doe",
            senderName: "John Director",
            showTitle: "Hamilton",
            messagePreview: "Hey, just wanted to check in about...",
            messageUrl: "https://example.com/messages/123",
          })
        );
        expect(html).toContain("John Director");
        expect(html).toContain("Hamilton");
        expect(html).toContain("message");
      });

      it("has valid PreviewProps", () => {
        expect(NewMessageEmail.PreviewProps).toBeDefined();
      });
    });

    describe("DocumentSharedEmail", () => {
      it("renders document shared notification", async () => {
        const html = await render(
          DocumentSharedEmail({
            recipientName: "Jane Doe",
            sharedBy: "John Director",
            showTitle: "Hamilton",
            documentName: "Act 1 Script",
            documentType: "script",
            documentUrl: "https://example.com/docs/123",
          })
        );
        expect(html).toContain("Act 1 Script");
        expect(html).toContain("John Director");
        expect(html).toContain("shared");
      });

      it("has valid PreviewProps", () => {
        expect(DocumentSharedEmail.PreviewProps).toBeDefined();
      });
    });

    describe("RehearsalReminderEmail", () => {
      it("renders rehearsal reminder", async () => {
        const html = await render(
          RehearsalReminderEmail({
            recipientName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            rehearsalType: "Act 2 Choreography",
            date: "May 1, 2026",
            time: "6:00 PM",
            location: "Main Stage",
            calendarUrl: "https://example.com/schedule",
            conflictUrl: "https://example.com/conflict",
          })
        );
        expect(html).toContain("Hamilton");
        expect(html).toContain("May 1, 2026");
        expect(html).toContain("Main Stage");
        expect(html).toContain("Rehearsal");
      });

      it("renders with notes", async () => {
        const html = await render(
          RehearsalReminderEmail({
            recipientName: "Jane Doe",
            showTitle: "Hamilton",
            organizationName: "Broadway Productions",
            rehearsalType: "Act 2 Choreography",
            date: "May 1, 2026",
            time: "6:00 PM",
            location: "Main Stage",
            notes: "Please bring your script",
            calendarUrl: "https://example.com/schedule",
            conflictUrl: "https://example.com/conflict",
          })
        );
        expect(html).toContain("Please bring your script");
      });

      it("has valid PreviewProps", () => {
        expect(RehearsalReminderEmail.PreviewProps).toBeDefined();
      });
    });
  });

  describe("Billing Templates", () => {
    describe("SubscriptionConfirmationEmail", () => {
      it("renders subscription confirmation", async () => {
        const html = await render(
          SubscriptionConfirmationEmail({
            name: "Jane Doe",
            planName: "Professional",
            amount: "$29.99",
            billingCycle: "monthly",
            nextBillingDate: "May 25, 2026",
            features: ["Unlimited shows", "Priority support"],
            dashboardUrl: "https://example.com/dashboard",
            billingUrl: "https://example.com/billing",
          })
        );
        expect(html).toContain("Professional");
        expect(html).toContain("29.99");
        expect(html).toContain("subscription");
      });

      it("has valid PreviewProps", () => {
        expect(SubscriptionConfirmationEmail.PreviewProps).toBeDefined();
      });
    });

    describe("PaymentReceiptEmail", () => {
      it("renders payment receipt", async () => {
        const html = await render(
          PaymentReceiptEmail({
            name: "Jane Doe",
            invoiceNumber: "INV-2026-001",
            invoiceDate: "April 25, 2026",
            amount: "$29.99",
            paymentMethod: "Visa",
            cardLast4: "4242",
            planName: "Professional Plan",
            billingPeriod: "May 2026",
            invoiceUrl: "https://example.com/receipt/123",
            billingUrl: "https://example.com/billing",
          })
        );
        expect(html).toContain("29.99");
        expect(html).toContain("Professional Plan");
        expect(html).toContain("Receipt");
      });

      it("has valid PreviewProps", () => {
        expect(PaymentReceiptEmail.PreviewProps).toBeDefined();
      });
    });

    describe("PaymentFailedEmail", () => {
      it("renders payment failed notification", async () => {
        const html = await render(
          PaymentFailedEmail({
            name: "Jane Doe",
            amount: "$29.99",
            planName: "Professional",
            failureReason: "Card declined",
            updatePaymentUrl: "https://example.com/billing",
            billingUrl: "https://example.com/billing",
            gracePeriodEndDate: "May 1, 2026",
            retryDate: "April 28, 2026",
          })
        );
        expect(html).toContain("29.99");
        expect(html).toContain("Card declined");
        expect(html).toContain("Payment");
      });

      it("has valid PreviewProps", () => {
        expect(PaymentFailedEmail.PreviewProps).toBeDefined();
      });
    });

    describe("SubscriptionEndingEmail", () => {
      it("renders subscription ending notification", async () => {
        const html = await render(
          SubscriptionEndingEmail({
            name: "Jane Doe",
            planName: "Professional",
            endDate: "May 25, 2026",
            daysRemaining: 7,
            renewUrl: "https://example.com/renew",
            billingUrl: "https://example.com/billing",
          })
        );
        expect(html).toContain("Professional");
        expect(html).toContain("7");
        expect(html).toContain("Subscription");
      });

      it("has valid PreviewProps", () => {
        expect(SubscriptionEndingEmail.PreviewProps).toBeDefined();
      });
    });
  });

  describe("Shared Components", () => {
    describe("EmailLayout", () => {
      it("renders with preview text", async () => {
        const html = await render(
          EmailLayout({
            preview: "Test preview text",
            children: "Content",
          })
        );
        expect(html).toContain("Dramatis HQ");
      });

      it("renders children", async () => {
        const html = await render(
          EmailLayout({
            preview: "Test",
            children: "Test content here",
          })
        );
        expect(html).toContain("Test content here");
      });

      it("renders unsubscribe link when provided", async () => {
        const html = await render(
          EmailLayout({
            preview: "Test",
            children: "Content",
            unsubscribeUrl: "https://example.com/unsubscribe",
          })
        );
        expect(html).toContain("https://example.com/unsubscribe");
        expect(html).toContain("Unsubscribe");
      });
    });

    describe("EmailButton", () => {
      it("renders primary button by default", async () => {
        const html = await render(
          EmailButton({
            href: "https://example.com",
            children: "Click Me",
          })
        );
        expect(html).toContain("Click Me");
        expect(html).toContain("https://example.com");
      });

      it("renders secondary button variant", async () => {
        const html = await render(
          EmailButton({
            href: "https://example.com",
            variant: "secondary",
            children: "Secondary Action",
          })
        );
        expect(html).toContain("Secondary Action");
      });
    });
  });
});
