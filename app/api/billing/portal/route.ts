import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
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

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, profile.id),
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL ?? ""}/producer/setup`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
