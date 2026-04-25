// Auth templates
export {
  WelcomeEmail,
  VerifyEmailTemplate,
  PasswordResetEmail,
  LoginNotificationEmail,
} from "./auth";
export type {
  WelcomeEmailProps,
  VerifyEmailProps,
  PasswordResetEmailProps,
  LoginNotificationEmailProps,
} from "./auth";

// Audition templates
export {
  SubmissionConfirmationEmail,
  CallbackNotificationEmail,
  CastNotificationEmail,
  RejectionNotificationEmail,
} from "./auditions";
export type {
  SubmissionConfirmationEmailProps,
  CallbackNotificationEmailProps,
  CastNotificationEmailProps,
  RejectionNotificationEmailProps,
} from "./auditions";

// Production templates
export {
  ScheduleUpdateEmail,
  NewMessageEmail,
  DocumentSharedEmail,
  RehearsalReminderEmail,
  TaxDocumentUploadedEmail,
} from "./production";
export type {
  ScheduleUpdateEmailProps,
  NewMessageEmailProps,
  DocumentSharedEmailProps,
  RehearsalReminderEmailProps,
  TaxDocumentUploadedEmailProps,
} from "./production";

// Billing templates
export {
  SubscriptionConfirmationEmail,
  PaymentReceiptEmail,
  PaymentFailedEmail,
  SubscriptionEndingEmail,
} from "./billing";
export type {
  SubscriptionConfirmationEmailProps,
  PaymentReceiptEmailProps,
  PaymentFailedEmailProps,
  SubscriptionEndingEmailProps,
} from "./billing";

// Shared components
export { EmailLayout, EmailButton } from "./components";
