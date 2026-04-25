export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Only delete sessions belonging to this user
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, session.user.id)));

    return NextResponse.json({ message: "Session revoked" });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
