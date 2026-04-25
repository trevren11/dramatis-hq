import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, castingAssignments } from "@/lib/db/schema";
import { castingBulkLockSchema, castingBulkStatusSchema } from "@/lib/validations/casting";
import { eq, and, inArray } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");

    if (operation === "lock") {
      const parsed = castingBulkLockSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      await db
        .update(castingAssignments)
        .set({ isLocked: parsed.data.isLocked, updatedAt: new Date() })
        .where(
          and(
            eq(castingAssignments.showId, showId),
            inArray(castingAssignments.id, parsed.data.assignmentIds)
          )
        );

      return NextResponse.json({ success: true });
    } else if (operation === "status") {
      const parsed = castingBulkStatusSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      await db
        .update(castingAssignments)
        .set({ status: parsed.data.status, updatedAt: new Date() })
        .where(
          and(
            eq(castingAssignments.showId, showId),
            inArray(castingAssignments.id, parsed.data.assignmentIds)
          )
        );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Error bulk updating casting:", error);
    return NextResponse.json({ error: "Failed to bulk update" }, { status: 500 });
  }
}
