export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blockedUsers } from "@/lib/db/schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    await db
      .delete(blockedUsers)
      .where(and(eq(blockedUsers.userId, session.user.id), eq(blockedUsers.blockedUserId, userId)));

    return NextResponse.json({ message: "User unblocked" });
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
