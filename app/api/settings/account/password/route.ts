export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Validate new password strength
    const strengthResult = validatePasswordStrength(newPassword);
    if (!strengthResult.isValid) {
      return NextResponse.json(
        { error: "Weak password", details: { newPassword: strengthResult.errors } },
        { status: 400 }
      );
    }

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            error: "Current password required",
            details: { currentPassword: ["Current password is required"] },
          },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          {
            error: "Invalid current password",
            details: { currentPassword: ["Current password is incorrect"] },
          },
          { status: 400 }
        );
      }
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
