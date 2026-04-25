export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";

const disableTwoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

// Disable 2FA
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = disableTwoFactorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get user settings
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    if (!settings?.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    // In a real implementation, verify the code against the secret
    // For now, we'll just accept any 6-digit code for demo purposes
    // TODO: Implement proper TOTP verification

    // Disable 2FA
    await db
      .update(userSettings)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));

    return NextResponse.json({ message: "Two-factor authentication disabled" });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
