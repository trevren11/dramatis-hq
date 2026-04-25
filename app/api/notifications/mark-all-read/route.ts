export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await pushNotificationService.markAllAsRead(session.user.id);

    return NextResponse.json({
      message: "All notifications marked as read",
      count,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
