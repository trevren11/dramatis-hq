import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production or when DSN is set
  enabled: !!process.env.SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",

  // Attach additional context
  beforeSend(event) {
    // Redact sensitive data from headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-api-key"];
    }

    // Redact sensitive data from body
    if (event.request?.data && typeof event.request.data === "string") {
      try {
        const body = JSON.parse(event.request.data);
        const sensitiveFields = ["password", "token", "secret", "apiKey", "creditCard"];
        sensitiveFields.forEach((field) => {
          if (body[field]) {
            body[field] = "[REDACTED]";
          }
        });
        event.request.data = JSON.stringify(body);
      } catch {
        // Not JSON, leave as is
      }
    }

    return event;
  },

  // Profile slow database queries
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  integrations: [
    // HTTP integration for request tracing
    Sentry.httpIntegration(),
  ],
});
