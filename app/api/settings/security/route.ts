export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, userSettings, loginHistory } from "@/lib/db/schema";

const updateSecuritySchema = z.object({
  securityNotifications: z.boolean().optional(),
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

    // Get active sessions
    const activeSessions = await db.query.sessions.findMany({
      where: eq(sessions.userId, session.user.id),
    });

    const sessionData = activeSessions.map((s) => ({
      id: s.id,
      deviceName: null,
      browser: null,
      location: null,
      ipAddress: null,
      lastActiveAt: s.expires.toISOString(),
      isCurrent: s.sessionToken === session.user.id, // Simplified check
    }));

    // Get login history (last 10)
    const history = await db.query.loginHistory.findMany({
      where: eq(loginHistory.userId, session.user.id),
      orderBy: [desc(loginHistory.createdAt)],
      limit: 10,
    });

    const historyData = history.map((h) => ({
      id: h.id,
      browser: h.browser,
      location: h.location,
      ipAddress: h.ipAddress,
      successful: h.successful ?? true,
      createdAt: h.createdAt.toISOString(),
    }));

    return NextResponse.json({
      security: {
        twoFactorEnabled: settings?.twoFactorEnabled ?? false,
        securityNotifications: settings?.securityNotifications ?? true,
        sessions: sessionData,
        loginHistory: historyData,
      },
    });
  } catch (error) {
    console.error("Get security settings error:", error);
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
    const parsed = updateSecuritySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Upsert settings
    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    if (existing) {
      await db
        .update(userSettings)
        .set({
          securityNotifications: parsed.data.securityNotifications,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.user.id));
    } else {
      await db.insert(userSettings).values({
        userId: session.user.id,
        securityNotifications: parsed.data.securityNotifications,
      });
    }

    return NextResponse.json({ message: "Security settings updated" });
  } catch (error) {
    console.error("Update security settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
