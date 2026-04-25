export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

const unsubscribeSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await pushNotificationService.removeSubscription(
      session.user.id,
      parsed.data.endpoint
    );

    if (!result.success) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subscription removed" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
