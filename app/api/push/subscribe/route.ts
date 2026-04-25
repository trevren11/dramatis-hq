export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

const subscribeSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth key is required"),
  }),
  userAgent: z.string().optional(),
  deviceName: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await pushNotificationService.registerSubscription(session.user.id, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to register subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Subscription registered", subscriptionId: result.subscriptionId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
