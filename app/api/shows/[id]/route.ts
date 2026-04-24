import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, roles } from "@/lib/db/schema";
import { showUpdateSchema } from "@/lib/validations/shows";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Get roles for this show
    const showRoles = await db.query.roles.findMany({
      where: eq(roles.showId, id),
      orderBy: [asc(roles.sortOrder)],
    });

    return NextResponse.json({ show, roles: showRoles });
  } catch (error) {
    console.error("Error fetching show:", error);
    return NextResponse.json({ error: "Failed to fetch show" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingShow = await db.query.shows.findFirst({
      where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
    });

    if (!existingShow) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = showUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(shows)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(shows.id, id))
      .returning();

    return NextResponse.json({ show: updated });
  } catch (error) {
    console.error("Error updating show:", error);
    return NextResponse.json({ error: "Failed to update show" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingShow = await db.query.shows.findFirst({
      where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
    });

    if (!existingShow) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Roles will be cascade deleted due to foreign key constraint
    await db.delete(shows).where(eq(shows.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting show:", error);
    return NextResponse.json({ error: "Failed to delete show" }, { status: 500 });
  }
}
