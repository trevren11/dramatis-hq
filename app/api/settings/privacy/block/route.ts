export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, blockedUsers } from "@/lib/db/schema";

const blockUserSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = blockUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Find user by email
    const userToBlock = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (!userToBlock) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userToBlock.id === session.user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Check if already blocked
    const existingBlock = await db.query.blockedUsers.findFirst({
      where: and(
        eq(blockedUsers.userId, session.user.id),
        eq(blockedUsers.blockedUserId, userToBlock.id)
      ),
    });

    if (existingBlock) {
      return NextResponse.json({ error: "User already blocked" }, { status: 400 });
    }

    // Create block
    await db.insert(blockedUsers).values({
      userId: session.user.id,
      blockedUserId: userToBlock.id,
    });

    return NextResponse.json({ message: "User blocked" });
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
