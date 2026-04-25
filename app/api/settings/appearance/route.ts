export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";

const updateAppearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().max(100).optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user settings
    const existingSettings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    const settings =
      existingSettings ??
      (await db
        .insert(userSettings)
        .values({ userId: session.user.id })
        .returning()
        .then(([s]) => s));

    return NextResponse.json({
      appearance: {
        theme: settings?.theme ?? "system",
        language: settings?.language ?? "en",
        timezone: settings?.timezone ?? "UTC",
      },
    });
  } catch (error) {
    console.error("Get appearance settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updateAppearanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.theme !== undefined) {
      updateData.theme = parsed.data.theme;
    }
    if (parsed.data.language !== undefined) {
      updateData.language = parsed.data.language;
    }
    if (parsed.data.timezone !== undefined) {
      updateData.timezone = parsed.data.timezone;
    }

    // Upsert settings
    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    if (existing) {
      await db.update(userSettings).set(updateData).where(eq(userSettings.userId, session.user.id));
    } else {
      await db.insert(userSettings).values({
        userId: session.user.id,
        ...updateData,
      });
    }

    return NextResponse.json({ message: "Appearance settings updated" });
  } catch (error) {
    console.error("Update appearance settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
