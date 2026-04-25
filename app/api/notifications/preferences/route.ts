export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push/service";

const updatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  scheduleChange: z.boolean().optional(),
  rehearsalReminder: z.boolean().optional(),
  callbackNotification: z.boolean().optional(),
  castDecision: z.boolean().optional(),
  documentShared: z.boolean().optional(),
  commentMention: z.boolean().optional(),
  auditionSubmission: z.boolean().optional(),
  systemAnnouncement: z.boolean().optional(),
  dndEnabled: z.boolean().optional(),
  dndStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  dndEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  timezone: z.string().optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await pushNotificationService.getOrCreatePreferences(session.user.id);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const preferences = await pushNotificationService.updatePreferences(
      session.user.id,
      parsed.data
    );

    return NextResponse.json({
      message: "Preferences updated",
      preferences,
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
