export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings, users } from "@/lib/db/schema";

// Generate a base32 secret for TOTP
function generateSecret(): string {
  const buffer = crypto.randomBytes(20);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (const byte of buffer) {
    const char = base32Chars[byte % 32];
    if (char !== undefined) {
      secret += char;
    }
  }
  return secret;
}

// Generate a simple QR code data URL (placeholder)
function generateQRCodeUrl(secret: string, email: string): string {
  const otpAuthUrl = `otpauth://totp/Dramatis-HQ:${encodeURIComponent(email)}?secret=${secret}&issuer=Dramatis-HQ`;
  // In production, use a proper QR code library like 'qrcode'
  // For now, return a placeholder that indicates the URL
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
}

export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if 2FA is already enabled
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, session.user.id),
    });

    if (settings?.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    // Get user email
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate secret
    const secret = generateSecret();
    const qrCode = generateQRCodeUrl(secret, user.email);

    // Store the secret (but don't enable 2FA yet)
    if (settings) {
      await db
        .update(userSettings)
        .set({
          twoFactorSecret: secret,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.user.id));
    } else {
      await db.insert(userSettings).values({
        userId: session.user.id,
        twoFactorSecret: secret,
      });
    }

    return NextResponse.json({
      secret,
      qrCode,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
