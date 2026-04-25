import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, castingAssignments, roles } from "@/lib/db/schema";
import { castingAssignmentUpdateSchema } from "@/lib/validations/casting";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, assignmentId } = await params;

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

    const existing = await db.query.castingAssignments.findFirst({
      where: and(eq(castingAssignments.id, assignmentId), eq(castingAssignments.showId, showId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = castingAssignmentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.roleId && parsed.data.roleId !== existing.roleId) {
      const role = await db.query.roles.findFirst({
        where: and(eq(roles.id, parsed.data.roleId), eq(roles.showId, showId)),
      });

      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
    }

    if (parsed.data.slotIndex !== undefined) {
      const targetRoleId = parsed.data.roleId ?? existing.roleId;
      const existingSlot = await db.query.castingAssignments.findFirst({
        where: and(
          eq(castingAssignments.roleId, targetRoleId),
          eq(castingAssignments.slotIndex, parsed.data.slotIndex)
        ),
      });

      if (existingSlot && existingSlot.id !== assignmentId) {
        return NextResponse.json({ error: "Slot already occupied" }, { status: 409 });
      }
    }

    const [assignment] = await db
      .update(castingAssignments)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(castingAssignments.id, assignmentId))
      .returning();

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error updating casting assignment:", error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, assignmentId } = await params;

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

    const existing = await db.query.castingAssignments.findFirst({
      where: and(eq(castingAssignments.id, assignmentId), eq(castingAssignments.showId, showId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json({ error: "Cannot delete locked assignment" }, { status: 403 });
    }

    await db.delete(castingAssignments).where(eq(castingAssignments.id, assignmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting casting assignment:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
