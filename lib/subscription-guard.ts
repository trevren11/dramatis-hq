import { db } from "@/lib/db";
import { subscriptions, producerProfiles, type Subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "no_subscription"
  | "expired";

export interface SubscriptionCheck {
  status: SubscriptionStatus;
  hasAccess: boolean;
  trialEndsAt?: Date;
  daysRemaining?: number;
  message?: string;
}

const GRACE_PERIOD_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysRemaining(targetDate: Date, now: Date): number {
  return Math.ceil((targetDate.getTime() - now.getTime()) / MS_PER_DAY);
}

function checkTrialStatus(subscription: Subscription, now: Date): SubscriptionCheck | null {
  if (subscription.status !== "trialing") return null;

  const trialEnd = subscription.trialEnd;
  if (!trialEnd) return null;

  const daysRemaining = getDaysRemaining(trialEnd, now);

  if (daysRemaining <= 0) {
    return {
      status: "expired",
      hasAccess: false,
      message: "Your trial has expired. Please subscribe to continue.",
    };
  }

  return {
    status: "trialing",
    hasAccess: true,
    trialEndsAt: trialEnd,
    daysRemaining,
    message:
      daysRemaining <= 3
        ? `Your trial ends in ${String(daysRemaining)} day${daysRemaining === 1 ? "" : "s"}`
        : undefined,
  };
}

function checkPastDueStatus(subscription: Subscription, now: Date): SubscriptionCheck | null {
  if (subscription.status !== "past_due") return null;

  const periodEnd = subscription.currentPeriodEnd;
  if (periodEnd) {
    const gracePeriodEnd = new Date(periodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    if (now < gracePeriodEnd) {
      const daysRemaining = getDaysRemaining(gracePeriodEnd, now);
      return {
        status: "past_due",
        hasAccess: true,
        daysRemaining,
        message: `Payment failed. Please update your payment method within ${String(daysRemaining)} day${daysRemaining === 1 ? "" : "s"}.`,
      };
    }
  }

  return {
    status: "past_due",
    hasAccess: false,
    message: "Payment failed. Please update your payment method to regain access.",
  };
}

function checkCanceledStatus(subscription: Subscription, now: Date): SubscriptionCheck | null {
  if (subscription.status !== "canceled") return null;

  const periodEnd = subscription.currentPeriodEnd;
  if (periodEnd && now < periodEnd) {
    const daysRemaining = getDaysRemaining(periodEnd, now);
    return {
      status: "canceled",
      hasAccess: true,
      daysRemaining,
      message: `Your subscription is canceled. Access ends in ${String(daysRemaining)} day${daysRemaining === 1 ? "" : "s"}.`,
    };
  }

  return {
    status: "canceled",
    hasAccess: false,
    message: "Your subscription has ended. Please resubscribe to regain access.",
  };
}

export async function checkSubscription(userId: string): Promise<SubscriptionCheck> {
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, userId),
  });

  if (!profile) {
    return {
      status: "no_subscription",
      hasAccess: false,
      message: "Producer profile not found",
    };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, profile.id),
  });

  if (!subscription) {
    return {
      status: "no_subscription",
      hasAccess: false,
      message: "No subscription found. Please subscribe to continue.",
    };
  }

  const now = new Date();

  // Check trial status
  const trialCheck = checkTrialStatus(subscription, now);
  if (trialCheck) return trialCheck;

  // Check active subscription
  if (subscription.status === "active") {
    return { status: "active", hasAccess: true };
  }

  // Check past_due with grace period
  const pastDueCheck = checkPastDueStatus(subscription, now);
  if (pastDueCheck) return pastDueCheck;

  // Check canceled subscription
  const canceledCheck = checkCanceledStatus(subscription, now);
  if (canceledCheck) return canceledCheck;

  // Handle other statuses (unpaid, incomplete, etc.)
  return {
    status: "no_subscription",
    hasAccess: false,
    message: "Subscription issue. Please contact support.",
  };
}

export async function requireSubscription(userId: string): Promise<void> {
  const check = await checkSubscription(userId);

  if (!check.hasAccess) {
    throw new SubscriptionRequiredError(check.message ?? "Subscription required");
  }
}

export class SubscriptionRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionRequiredError";
  }
}
