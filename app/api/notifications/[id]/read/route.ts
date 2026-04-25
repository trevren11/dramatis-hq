export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const success = await pushNotificationService.markAsRead(id, session.user.id);

    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
