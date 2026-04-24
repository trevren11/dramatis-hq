import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, headshots } from "@/lib/db/schema";
import { headshotUpdateSchema } from "@/lib/validations/profile";
import { eq, and } from "drizzle-orm";

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

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingEntry = await db.query.headshots.findFirst({
      where: and(eq(headshots.id, id), eq(headshots.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = headshotUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.isPrimary === true) {
      await db
        .update(headshots)
        .set({ isPrimary: false })
        .where(and(eq(headshots.talentProfileId, profile.id), eq(headshots.isPrimary, true)));
    }

    const [updated] = await db
      .update(headshots)
      .set({
        isPrimary: parsed.data.isPrimary,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(headshots.id, id))
      .returning();

    return NextResponse.json({ headshot: updated });
  } catch (error) {
    console.error("Error updating headshot:", error);
    return NextResponse.json({ error: "Failed to update headshot" }, { status: 500 });
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

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingEntry = await db.query.headshots.findFirst({
      where: and(eq(headshots.id, id), eq(headshots.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
    }

    await db.delete(headshots).where(eq(headshots.id, id));

    if (existingEntry.isPrimary) {
      const firstHeadshot = await db.query.headshots.findFirst({
        where: eq(headshots.talentProfileId, profile.id),
        orderBy: (h, { asc }) => [asc(h.sortOrder)],
      });

      if (firstHeadshot) {
        await db
          .update(headshots)
          .set({ isPrimary: true })
          .where(eq(headshots.id, firstHeadshot.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting headshot:", error);
    return NextResponse.json({ error: "Failed to delete headshot" }, { status: 500 });
  }
}
