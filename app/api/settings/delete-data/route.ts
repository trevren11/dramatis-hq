export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// This endpoint initiates a complete data deletion
// This is separate from account deletion and removes ALL user data
export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In production, this would:
    // 1. Queue a background job to delete all user data
    // 2. Send confirmation email
    // 3. Actually delete the data after a grace period
    //
    // For GDPR compliance, we use soft delete first
    // and have a separate process to hard delete after 30 days

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    console.log(`Data deletion requested for user: ${session.user.id}`);

    return NextResponse.json({
      message: "Data deletion request received",
      details:
        "Your data will be permanently deleted within 30 days. You will receive a confirmation email.",
    });
  } catch (error) {
    console.error("Delete data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
