import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { generateSecureToken, getPasswordResetExpiry } from "@/lib/auth/tokens";

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

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email service like Resend)
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: ${process.env.NEXTAUTH_URL ?? ""}/reset-password?token=${token}`);

    return NextResponse.json({
      message: "If an account with that email exists, we sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
