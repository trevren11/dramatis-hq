export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/users";
import { emailService } from "@/lib/email/service";
import { VerifyEmailTemplate } from "@/lib/email/templates/auth";

const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updateEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if email is already in use
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Generate verification token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token with new email as identifier
    await db.insert(verificationTokens).values({
      identifier: `email_change:${session.user.id}:${email.toLowerCase()}`,
      token,
      expires,
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}&type=email_change`;

    await emailService.send({
      to: email,
      subject: "Verify your new email address - Dramatis HQ",
      type: "email_verification",
      userId: session.user.id,
      react: VerifyEmailTemplate({
        name: session.user.name ?? "User",
        verificationUrl,
        expiresIn: "24 hours",
      }),
    });

    return NextResponse.json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Update email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
