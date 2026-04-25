import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, castingDeck, castingAssignments } from "@/lib/db/schema";
import { castingDeckAddSchema, castingDeckReorderSchema } from "@/lib/validations/casting";
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

    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = castingDeckAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingAssignment = await db.query.castingAssignments.findFirst({
      where: and(
        eq(castingAssignments.showId, showId),
        eq(castingAssignments.talentProfileId, parsed.data.talentProfileId)
      ),
    });

    if (existingAssignment) {
      return NextResponse.json({ error: "Talent already assigned to a role" }, { status: 409 });
    }

    const existingDeck = await db.query.castingDeck.findFirst({
      where: and(
        eq(castingDeck.showId, showId),
        eq(castingDeck.talentProfileId, parsed.data.talentProfileId)
      ),
    });

    if (existingDeck) {
      return NextResponse.json({ error: "Talent already in deck" }, { status: 409 });
    }

    const [maxSort] = await db
      .select({ maxSort: max(castingDeck.sortOrder) })
      .from(castingDeck)
      .where(eq(castingDeck.showId, showId));

    const sortOrder =
      parsed.data.sortOrder !== 0 ? parsed.data.sortOrder : (maxSort?.maxSort ?? -1) + 1;

    const [deckItem] = await db
      .insert(castingDeck)
      .values({
        showId,
        talentProfileId: parsed.data.talentProfileId,
        sortOrder,
        notes: parsed.data.notes,
        addedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ deckItem }, { status: 201 });
  } catch (error) {
    console.error("Error adding to deck:", error);
    return NextResponse.json({ error: "Failed to add to deck" }, { status: 500 });
  }
}

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
    const parsed = castingDeckReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    for (const item of parsed.data.items) {
      await db
        .update(castingDeck)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(
          and(eq(castingDeck.showId, showId), eq(castingDeck.talentProfileId, item.talentProfileId))
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering deck:", error);
    return NextResponse.json({ error: "Failed to reorder deck" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;
    const { searchParams } = new URL(request.url);
    const talentProfileId = searchParams.get("talentProfileId");

    if (!talentProfileId) {
      return NextResponse.json({ error: "Talent profile ID required" }, { status: 400 });
    }

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

    await db
      .delete(castingDeck)
      .where(and(eq(castingDeck.showId, showId), eq(castingDeck.talentProfileId, talentProfileId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from deck:", error);
    return NextResponse.json({ error: "Failed to remove from deck" }, { status: 500 });
  }
}
