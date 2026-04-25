export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { generateSecureToken, getPasswordResetExpiry } from "@/lib/auth/tokens";
import { emailService, PasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, we sent a password reset link.",
      });
    }

    // Delete any existing reset tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    // Create new reset token
    const token = generateSecureToken();
    const expires = getPasswordResetExpiry();

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expires,
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL ?? ""}/reset-password?token=${token}`;

    await emailService.send({
      to: user.email,
      subject: "Reset your Dramatis HQ password",
      type: "password_reset",
      userId: user.id,
      react: PasswordResetEmail({
        name: user.name ?? "there",
        resetUrl,
        expiresIn: "1 hour",
      }),
      metadata: {
        resetToken: token,
      },
    });

    return NextResponse.json({
      message: "If an account with that email exists, we sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
