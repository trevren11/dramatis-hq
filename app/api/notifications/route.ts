export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";
import { IN_APP_NOTIFICATION_TYPE_VALUES } from "@/lib/db/schema/push-notifications";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  unreadOnly: z.coerce.boolean().optional().default(false),
  types: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.enum(IN_APP_NOTIFICATION_TYPE_VALUES)))
    .optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      unreadOnly: searchParams.get("unreadOnly"),
      types: searchParams.get("types"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const notifications = await pushNotificationService.getNotifications(
      session.user.id,
      parsed.data
    );

    const unreadCount = await pushNotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
