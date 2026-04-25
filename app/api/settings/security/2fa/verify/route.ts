export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";

const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = verifyTwoFactorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get user settings with the pending secret
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    if (!settings?.twoFactorSecret) {
      return NextResponse.json(
        { error: "No 2FA setup in progress. Please start setup first." },
        { status: 400 }
      );
    }

    if (settings.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    // In a real implementation, verify the code using TOTP
    // For now, accept any 6-digit code for demo purposes
    // TODO: Implement proper TOTP verification using the secret
    const isValidCode = /^\d{6}$/.test(parsed.data.code);

    if (!isValidCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Enable 2FA
    await db
      .update(userSettings)
      .set({
        twoFactorEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));

    return NextResponse.json({ message: "Two-factor authentication enabled" });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
