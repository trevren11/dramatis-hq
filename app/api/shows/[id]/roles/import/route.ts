import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, roles } from "@/lib/db/schema";
import { roleBulkCreateSchema } from "@/lib/validations/shows";
import { eq, and, max } from "drizzle-orm";

export async function POST(
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

    // Verify show ownership
    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = roleBulkCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get max sortOrder to append at end
    const [maxSortResult] = await db
      .select({ maxSort: max(roles.sortOrder) })
      .from(roles)
      .where(eq(roles.showId, showId));

    let nextSortOrder = (maxSortResult?.maxSort ?? -1) + 1;

    // Insert all roles with sequential sortOrder
    const insertedRoles = await db
      .insert(roles)
      .values(
        parsed.data.roles.map((role) => ({
          ...role,
          showId,
          sortOrder: nextSortOrder++,
        }))
      )
      .returning();

    return NextResponse.json({ roles: insertedRoles }, { status: 201 });
  } catch (error) {
    console.error("Error importing roles:", error);
    return NextResponse.json({ error: "Failed to import roles" }, { status: 500 });
  }
}
