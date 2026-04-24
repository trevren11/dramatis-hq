import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, subscriptions } from "@/lib/db/schema";
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
      return NextResponse.json({ subscription: null });
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, profile.id),
    });

    return NextResponse.json({ subscription: subscription ?? null });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
