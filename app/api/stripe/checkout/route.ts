import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, subscriptions } from "@/lib/db/schema";
import { stripe, STRIPE_PRICES, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { plan } = parsed.data;
    const priceId = STRIPE_PRICES[plan];

    if (!priceId) {
      return NextResponse.json({ error: `Price not configured for ${plan} plan` }, { status: 500 });
    }

    // Check for existing subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, profile.id),
    });

    let customerId = existingSubscription?.stripeCustomerId;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: profile.companyName,
        metadata: {
          organizationId: profile.id,
          userId: session.user.id,
        },
      });
      customerId = customer.id;

      // Store customer ID for later
      await db.insert(subscriptions).values({
        organizationId: profile.id,
        stripeCustomerId: customerId,
        status: "incomplete",
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: {
          organizationId: profile.id,
        },
      },
      success_url: `${process.env.NEXTAUTH_URL ?? ""}/producer/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL ?? ""}/producer/setup?canceled=true`,
      metadata: {
        organizationId: profile.id,
        plan,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
