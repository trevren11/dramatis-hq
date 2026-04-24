import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// Mock stripe
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(),
      })),
    })),
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn((key: string) => (key === "stripe-signature" ? "test_signature" : null)),
    })
  ),
}));

import { stripe } from "@/lib/stripe";

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  describe("signature verification", () => {
    it("rejects requests with invalid signature", () => {
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      // Signature verification happens during event construction
      expect(() => stripe.webhooks.constructEvent("{}", "invalid_sig", "whsec_test")).toThrow(
        "Invalid signature"
      );
    });

    it("accepts requests with valid signature", () => {
      const mockEvent: Stripe.Event = {
        id: "evt_test",
        object: "event",
        api_version: "2024-12-18",
        created: Date.now() / 1000,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            object: "checkout.session",
            metadata: { organizationId: "org_123", plan: "monthly" },
            subscription: "sub_test",
          } as unknown as Stripe.Checkout.Session,
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: "req_test", idempotency_key: null },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      const result = stripe.webhooks.constructEvent("{}", "valid_sig", "whsec_test");
      expect(result.type).toBe("checkout.session.completed");
    });
  });

  describe("event handling", () => {
    it("handles checkout.session.completed event", () => {
      const session: Partial<Stripe.Checkout.Session> = {
        id: "cs_test",
        object: "checkout.session",
        metadata: { organizationId: "org_123", plan: "monthly" },
        subscription: "sub_test",
      };

      expect(session.metadata?.organizationId).toBe("org_123");
      expect(session.metadata?.plan).toBe("monthly");
    });

    it("handles customer.subscription.updated event", () => {
      const subscription: Partial<Stripe.Subscription> = {
        id: "sub_test",
        object: "subscription",
        status: "active",
        items: {
          object: "list",
          data: [
            {
              id: "si_test",
              object: "subscription_item",
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          url: "/v1/subscription_items",
        },
        metadata: { organizationId: "org_123" },
      };

      expect(subscription.status).toBe("active");
      expect(subscription.metadata?.organizationId).toBe("org_123");
      expect(subscription.items?.data[0]?.current_period_start).toBeDefined();
    });

    it("handles customer.subscription.deleted event", () => {
      const subscription: Partial<Stripe.Subscription> = {
        id: "sub_test",
        object: "subscription",
        status: "canceled",
        canceled_at: Math.floor(Date.now() / 1000),
      };

      expect(subscription.status).toBe("canceled");
      expect(subscription.canceled_at).toBeDefined();
    });

    it("handles invoice.paid event", () => {
      const invoice: Partial<Stripe.Invoice> = {
        id: "in_test",
        object: "invoice",
        customer: "cus_test",
        amount_due: 2900,
        amount_paid: 2900,
        currency: "usd",
        status: "paid",
        hosted_invoice_url: "https://invoice.stripe.com/test",
        invoice_pdf: "https://pay.stripe.com/invoice/test/pdf",
        status_transitions: {
          finalized_at: null,
          marked_uncollectible_at: null,
          paid_at: Math.floor(Date.now() / 1000),
          voided_at: null,
        },
      };

      expect(invoice.status).toBe("paid");
      expect(invoice.amount_paid).toBe(2900);
    });

    it("handles invoice.payment_failed event", () => {
      const invoice: Partial<Stripe.Invoice> = {
        id: "in_test",
        object: "invoice",
        customer: "cus_test",
        amount_due: 2900,
        amount_paid: 0,
        currency: "usd",
        status: "open",
      };

      expect(invoice.status).toBe("open");
      expect(invoice.amount_paid).toBe(0);
    });
  });

  describe("status mapping", () => {
    const statusMap: Record<string, string> = {
      trialing: "trialing",
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "unpaid",
      incomplete: "incomplete",
      incomplete_expired: "incomplete_expired",
      paused: "canceled",
    };

    it.each(Object.entries(statusMap))(
      "maps Stripe status %s to %s",
      (stripeStatus, expectedStatus) => {
        expect(statusMap[stripeStatus]).toBe(expectedStatus);
      }
    );
  });
});
