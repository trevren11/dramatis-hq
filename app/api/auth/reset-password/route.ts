import { NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Weak password", details: { password: passwordValidation.errors } },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expires, new Date())),
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user's password
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    // Delete all reset tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
