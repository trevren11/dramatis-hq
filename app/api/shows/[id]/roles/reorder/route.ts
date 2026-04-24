import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, roles } from "@/lib/db/schema";
import { roleBulkUpdateSchema } from "@/lib/validations/shows";
import { eq, and, asc } from "drizzle-orm";

export async function PUT(
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
    const parsed = roleBulkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Update all roles' sortOrder in a transaction
    await db.transaction(async (tx) => {
      for (const roleUpdate of parsed.data.roles) {
        // Verify role belongs to this show
        const role = await tx.query.roles.findFirst({
          where: and(eq(roles.id, roleUpdate.id), eq(roles.showId, showId)),
        });

        if (!role) {
          throw new Error(`Role ${roleUpdate.id} not found in this show`);
        }

        await tx
          .update(roles)
          .set({
            sortOrder: roleUpdate.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(roles.id, roleUpdate.id));
      }
    });

    // Return updated roles
    const updatedRoles = await db.query.roles.findMany({
      where: eq(roles.showId, showId),
      orderBy: [asc(roles.sortOrder)],
    });

    return NextResponse.json({ roles: updatedRoles });
  } catch (error) {
    console.error("Error reordering roles:", error);
    const message = error instanceof Error ? error.message : "Failed to reorder roles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
