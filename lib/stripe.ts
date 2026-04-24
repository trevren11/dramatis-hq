import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Lazy-initialized stripe proxy for backward compatibility
export const stripe = {
  get customers(): Stripe["customers"] {
    return getStripe().customers;
  },
  get subscriptions(): Stripe["subscriptions"] {
    return getStripe().subscriptions;
  },
  get checkout(): Stripe["checkout"] {
    return getStripe().checkout;
  },
  get billingPortal(): Stripe["billingPortal"] {
    return getStripe().billingPortal;
  },
  get invoices(): Stripe["invoices"] {
    return getStripe().invoices;
  },
  get webhooks(): Stripe["webhooks"] {
    return getStripe().webhooks;
  },
};

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
} as const;

export const TRIAL_PERIOD_DAYS = 14;
