export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts, userSettings, blockedUsers } from "@/lib/db/schema";

const updatePrivacySchema = z.object({
  activityVisible: z.boolean().optional(),
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

    // Get blocked users
    const blocked = await db.query.blockedUsers.findMany({
      where: eq(blockedUsers.userId, session.user.id),
    });

    // Get blocked user details
    const blockedUserIds = blocked.map((b) => b.blockedUserId);
    const blockedUserDetails =
      blockedUserIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, blockedUserIds),
          })
        : [];

    const blockedUsersWithDetails = blocked.map((b) => {
      const user = blockedUserDetails.find((u) => u.id === b.blockedUserId);
      return {
        id: b.blockedUserId,
        name: user?.name ?? null,
        email: user?.email ?? "Unknown",
        blockedAt: b.createdAt.toISOString(),
      };
    });

    // Get connected accounts (third-party connections)
    const connectedAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
    });

    const connections = connectedAccounts.map((acc) => ({
      id: acc.id,
      provider: acc.provider,
      connectedAt: acc.id, // Using id as proxy since we don't have createdAt
    }));

    return NextResponse.json({
      privacy: {
        activityVisible: settings?.activityVisible ?? true,
        blockedUsers: blockedUsersWithDetails,
        connections,
      },
    });
  } catch (error) {
    console.error("Get privacy settings error:", error);
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
    const parsed = updatePrivacySchema.safeParse(body);

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
          activityVisible: parsed.data.activityVisible,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.user.id));
    } else {
      await db.insert(userSettings).values({
        userId: session.user.id,
        activityVisible: parsed.data.activityVisible,
      });
    }

    return NextResponse.json({ message: "Privacy settings updated" });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
