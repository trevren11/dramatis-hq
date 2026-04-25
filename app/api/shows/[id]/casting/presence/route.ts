import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows, castingPresence, users, PRESENCE_COLORS } from "@/lib/db/schema";
import { castingPresenceUpdateSchema } from "@/lib/validations/casting";
import { eq, and, gte, sql } from "drizzle-orm";

const PRESENCE_TIMEOUT_MS = 30000;

export async function GET(
  _request: Request,
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

    const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

    await db
      .delete(castingPresence)
      .where(
        and(eq(castingPresence.showId, showId), sql`${castingPresence.lastSeenAt} < ${cutoff}`)
      );

    const presence = await db.query.castingPresence.findMany({
      where: and(eq(castingPresence.showId, showId), gte(castingPresence.lastSeenAt, cutoff)),
    });

    return NextResponse.json({
      presence: presence.filter((p) => p.userId !== session.user.id),
    });
  } catch (error) {
    console.error("Error fetching presence:", error);
    return NextResponse.json({ error: "Failed to fetch presence" }, { status: 500 });
  }
}

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
    const parsed = castingPresenceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const userName = user?.name ?? user?.email ?? "Unknown";

    const existing = await db.query.castingPresence.findFirst({
      where: and(eq(castingPresence.showId, showId), eq(castingPresence.userId, session.user.id)),
    });

    const allPresence = await db.query.castingPresence.findMany({
      where: eq(castingPresence.showId, showId),
    });

    const usedColors = new Set(allPresence.map((p) => p.color));
    const availableColor = PRESENCE_COLORS.find((c) => !usedColors.has(c)) ?? PRESENCE_COLORS[0];

    if (existing) {
      await db
        .update(castingPresence)
        .set({
          userName,
          cursorPosition: parsed.data.cursorPosition,
          selectedTalentId: parsed.data.selectedTalentId,
          lastSeenAt: new Date(),
        })
        .where(eq(castingPresence.id, existing.id));
    } else {
      await db.insert(castingPresence).values({
        showId,
        userId: session.user.id,
        userName,
        cursorPosition: parsed.data.cursorPosition,
        selectedTalentId: parsed.data.selectedTalentId,
        color: availableColor,
      });
    }

    const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

    const presence = await db.query.castingPresence.findMany({
      where: and(eq(castingPresence.showId, showId), gte(castingPresence.lastSeenAt, cutoff)),
    });

    return NextResponse.json({
      presence: presence.filter((p) => p.userId !== session.user.id),
    });
  } catch (error) {
    console.error("Error updating presence:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
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

    const { id: showId } = await params;

    await db
      .delete(castingPresence)
      .where(and(eq(castingPresence.showId, showId), eq(castingPresence.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing presence:", error);
    return NextResponse.json({ error: "Failed to remove presence" }, { status: 500 });
  }
}
