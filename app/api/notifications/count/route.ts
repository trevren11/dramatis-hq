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

    const count = await pushNotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Get notification count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
