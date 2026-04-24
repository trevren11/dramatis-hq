import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, roles } from "@/lib/db/schema";
import { roleUpdateSchema } from "@/lib/validations/shows";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; roleId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, roleId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify show ownership
    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Verify role exists and belongs to this show
    const existingRole = await db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.showId, showId)),
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = roleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(roles)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning();

    return NextResponse.json({ role: updated });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; roleId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, roleId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify show ownership
    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Verify role exists and belongs to this show
    const existingRole = await db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.showId, showId)),
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    await db.delete(roles).where(eq(roles.id, roleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
