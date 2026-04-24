import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, roles } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function POST(
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

    // Get all roles for the show
    const existingRoles = await db.query.roles.findMany({
      where: eq(roles.showId, id),
      orderBy: [asc(roles.sortOrder)],
    });

    // Create the duplicated show
    const [newShow] = await db
      .insert(shows)
      .values({
        organizationId: profile.id,
        title: `${existingShow.title} (Copy)`,
        type: existingShow.type,
        description: existingShow.description,
        venue: existingShow.venue,
        rehearsalStart: existingShow.rehearsalStart,
        performanceStart: existingShow.performanceStart,
        performanceEnd: existingShow.performanceEnd,
        unionStatus: existingShow.unionStatus,
        status: "planning", // Reset status to planning
        isPublic: existingShow.isPublic,
      })
      .returning();

    if (!newShow) {
      return NextResponse.json({ error: "Failed to create show copy" }, { status: 500 });
    }

    // Duplicate all roles
    if (existingRoles.length > 0) {
      await db.insert(roles).values(
        existingRoles.map((role) => ({
          showId: newShow.id,
          name: role.name,
          description: role.description,
          type: role.type,
          ageRangeMin: role.ageRangeMin,
          ageRangeMax: role.ageRangeMax,
          vocalRange: role.vocalRange,
          notes: role.notes,
          positionCount: role.positionCount,
          sortOrder: role.sortOrder,
        }))
      );
    }

    // Get the new roles for the response
    const newRoles = await db.query.roles.findMany({
      where: eq(roles.showId, newShow.id),
      orderBy: [asc(roles.sortOrder)],
    });

    return NextResponse.json({ show: newShow, roles: newRoles }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating show:", error);
    return NextResponse.json({ error: "Failed to duplicate show" }, { status: 500 });
  }
}
