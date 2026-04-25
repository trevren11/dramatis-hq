export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await pushNotificationService.getUserSubscriptions(session.user.id);

    // Don't expose full endpoint/keys, just metadata for UI
    const sanitized = subscriptions.map((sub) => ({
      id: sub.id,
      deviceName: sub.deviceName,
      userAgent: sub.userAgent,
      lastUsedAt: sub.lastUsedAt,
      createdAt: sub.createdAt,
    }));

    return NextResponse.json({ subscriptions: sanitized });
  } catch (error) {
    console.error("Get push subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
