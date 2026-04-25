import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, castingAssignments, castingDeck, roles } from "@/lib/db/schema";
import { castingMoveSchema, type CastingMove } from "@/lib/validations/casting";
import { eq, and, max } from "drizzle-orm";
import { triggerEvent, CHANNELS, EVENTS } from "@/lib/pusher-server";

async function validateRequest(
  userId: string,
  showId: string
): Promise<{ error: string; status: number } | { show: typeof shows.$inferSelect }> {
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, userId),
  });
  if (!profile) return { error: "Profile not found", status: 404 };

  const show = await db.query.shows.findFirst({
    where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
  });
  if (!show) return { error: "Show not found", status: 404 };

  return { show };
}

async function removeFromSource(
  showId: string,
  talentProfileId: string,
  sourceType: CastingMove["source"]["type"]
): Promise<{ error: string; status: number } | null> {
  if (sourceType === "role") {
    const existingAssignment = await db.query.castingAssignments.findFirst({
      where: and(
        eq(castingAssignments.showId, showId),
        eq(castingAssignments.talentProfileId, talentProfileId)
      ),
    });
    if (existingAssignment?.isLocked) {
      return { error: "Cannot move locked assignment", status: 403 };
    }
    await db
      .delete(castingAssignments)
      .where(
        and(
          eq(castingAssignments.showId, showId),
          eq(castingAssignments.talentProfileId, talentProfileId)
        )
      );
  } else if (sourceType === "deck") {
    await db
      .delete(castingDeck)
      .where(and(eq(castingDeck.showId, showId), eq(castingDeck.talentProfileId, talentProfileId)));
  }
  return null;
}

async function moveToRole(
  showId: string,
  talentProfileId: string,
  userId: string,
  destination: CastingMove["destination"]
): Promise<NextResponse> {
  if (!destination.roleId) {
    return NextResponse.json({ error: "Role ID required for role destination" }, { status: 400 });
  }

  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, destination.roleId), eq(roles.showId, showId)),
  });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const slotIndex = destination.slotIndex ?? 0;
  if (slotIndex >= (role.positionCount ?? 1)) {
    return NextResponse.json({ error: "Slot index exceeds position count" }, { status: 400 });
  }

  const existingSlot = await db.query.castingAssignments.findFirst({
    where: and(
      eq(castingAssignments.roleId, destination.roleId),
      eq(castingAssignments.slotIndex, slotIndex)
    ),
  });
  if (existingSlot) return NextResponse.json({ error: "Slot already occupied" }, { status: 409 });

  const existingTalent = await db.query.castingAssignments.findFirst({
    where: and(
      eq(castingAssignments.showId, showId),
      eq(castingAssignments.talentProfileId, talentProfileId)
    ),
  });
  if (existingTalent)
    return NextResponse.json({ error: "Talent already assigned" }, { status: 409 });

  const [assignment] = await db
    .insert(castingAssignments)
    .values({ showId, roleId: destination.roleId, talentProfileId, slotIndex, assignedBy: userId })
    .returning();

  // Broadcast real-time update
  void triggerEvent(CHANNELS.casting(showId), EVENTS.TALENT_ADDED, {
    assignment,
    talentProfileId,
    roleId: destination.roleId,
    slotIndex,
  });

  return NextResponse.json({ type: "assignment", assignment });
}

async function moveToDeck(
  showId: string,
  talentProfileId: string,
  userId: string,
  destination: CastingMove["destination"]
): Promise<NextResponse> {
  const existingDeck = await db.query.castingDeck.findFirst({
    where: and(eq(castingDeck.showId, showId), eq(castingDeck.talentProfileId, talentProfileId)),
  });
  if (existingDeck) return NextResponse.json({ error: "Talent already in deck" }, { status: 409 });

  let sortOrder = destination.sortOrder;
  if (sortOrder === undefined) {
    const [maxSort] = await db
      .select({ maxSort: max(castingDeck.sortOrder) })
      .from(castingDeck)
      .where(eq(castingDeck.showId, showId));
    sortOrder = (maxSort?.maxSort ?? -1) + 1;
  }

  const [deckItem] = await db
    .insert(castingDeck)
    .values({ showId, talentProfileId, sortOrder, addedBy: userId })
    .returning();

  // Broadcast real-time update
  void triggerEvent(CHANNELS.casting(showId), EVENTS.CASTING_UPDATED, {
    type: "deck",
    deckItem,
    talentProfileId,
  });

  return NextResponse.json({ type: "deck", deckItem });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: showId } = await params;
    const validation = await validateRequest(session.user.id, showId);
    if ("error" in validation)
      return NextResponse.json({ error: validation.error }, { status: validation.status });

    const body: unknown = await request.json();
    const parsed = castingMoveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { talentProfileId, source, destination } = parsed.data;
    const removeError = await removeFromSource(showId, talentProfileId, source.type);
    if (removeError)
      return NextResponse.json({ error: removeError.error }, { status: removeError.status });

    if (destination.type === "role") {
      return await moveToRole(showId, talentProfileId, session.user.id, destination);
    } else if (destination.type === "deck") {
      return await moveToDeck(showId, talentProfileId, session.user.id, destination);
    }

    // Broadcast talent moved to pool
    void triggerEvent(CHANNELS.casting(showId), EVENTS.TALENT_REMOVED, {
      talentProfileId,
      destination: "pool",
    });

    return NextResponse.json({ type: "pool", success: true });
  } catch (error) {
    console.error("Error moving casting:", error);
    return NextResponse.json({ error: "Failed to move casting" }, { status: 500 });
  }
}
