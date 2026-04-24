import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions, invoices } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request): Promise<NextResponse> {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

function getSubscriptionPeriodDates(subscription: Stripe.Subscription): {
  periodStart: Date | null;
  periodEnd: Date | null;
} {
  // In newer Stripe API versions, period dates are on subscription items
  const firstItem = subscription.items.data[0];
  if (firstItem) {
    return {
      periodStart: new Date(firstItem.current_period_start * 1000),
      periodEnd: new Date(firstItem.current_period_end * 1000),
    };
  }
  return { periodStart: null, periodEnd: null };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    console.error("No organizationId in checkout session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription in checkout session");
    return;
  }

  // Fetch the full subscription details with items expanded
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data"],
  });

  const { periodStart, periodEnd } = getSubscriptionPeriodDates(stripeSubscription);

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscriptionId,
      status: mapStripeStatus(stripeSubscription.status),
      plan: session.metadata?.plan as "monthly" | "annual" | undefined,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, organizationId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) {
    // Try to find by stripeSubscriptionId
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    });
    if (!existing) {
      console.error("Could not find subscription to update");
      return;
    }
    await updateSubscriptionRecord(existing.organizationId, subscription);
  } else {
    await updateSubscriptionRecord(organizationId, subscription);
  }
}

async function updateSubscriptionRecord(
  organizationId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const { periodStart, periodEnd } = getSubscriptionPeriodDates(subscription);

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end && periodEnd ? periodEnd : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, organizationId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscription.id),
  });

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.organizationId, existing.organizationId));
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!subscription) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  const paidAt = invoice.status_transitions.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  await db
    .insert(invoices)
    .values({
      organizationId: subscription.organizationId,
      stripeInvoiceId: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
      paidAt,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    })
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: {
        status: "paid",
        amountPaid: invoice.amount_paid,
        paidAt,
      },
    });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId),
  });

  if (!subscription) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // Update subscription status to past_due
  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, subscription.organizationId));

  // Record the failed invoice
  await db
    .insert(invoices)
    .values({
      organizationId: subscription.organizationId,
      stripeInvoiceId: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: 0,
      currency: invoice.currency,
      status: "open",
      invoiceUrl: invoice.hosted_invoice_url ?? null,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    })
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: {
        status: "open",
      },
    });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
):
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired" {
  const statusMap: Record<
    string,
    "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired"
  > = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    paused: "canceled", // Map paused to canceled for simplicity
  };
  return statusMap[status] ?? "incomplete";
}
