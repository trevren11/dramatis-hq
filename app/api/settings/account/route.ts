export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema/users";

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connectedAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
    });

    return NextResponse.json({
      account: {
        name: user.name,
        email: user.email,
        emailVerified: !!user.emailVerified,
        hasPassword: !!user.passwordHash,
        connectedAccounts: connectedAccounts.map((acc) => ({
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
        })),
      },
    });
  } catch (error) {
    console.error("Get account error:", error);
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
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    await db.update(users).set(updateData).where(eq(users.id, session.user.id));

    return NextResponse.json({ message: "Account updated" });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete by setting deletedAt timestamp
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
