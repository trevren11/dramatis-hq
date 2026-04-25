import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  shows,
  scheduleEvents,
  eventCast,
  talentProfiles,
  availability,
} from "@/lib/db/schema";
import { eventCastAddSchema, eventCastRemoveSchema } from "@/lib/validations/schedule";
import { eq, and, inArray, lte, gte, or } from "drizzle-orm";

interface ConflictInfo {
  talentProfileId: string;
  talentName: string;
  conflictType: "unavailable" | "event";
  conflictDetails: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, eventId } = await params;

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

    const event = await db.query.scheduleEvents.findFirst({
      where: and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.showId, showId)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = eventCastAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { talentProfileIds, roleId } = parsed.data;

    const existingCast = await db.query.eventCast.findMany({
      where: eq(eventCast.eventId, eventId),
    });
    const existingTalentIds = new Set(existingCast.map((c) => c.talentProfileId));

    const newTalentIds = talentProfileIds.filter((id) => !existingTalentIds.has(id));

    if (newTalentIds.length === 0) {
      return NextResponse.json(
        { error: "All selected cast members are already added to this event" },
        { status: 400 }
      );
    }

    const conflicts = await checkConflicts(newTalentIds, event.startTime, event.endTime, eventId);

    if (newTalentIds.length > 0) {
      await db.insert(eventCast).values(
        newTalentIds.map((talentProfileId) => ({
          eventId,
          talentProfileId,
          roleId: roleId ?? null,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      addedCount: newTalentIds.length,
      conflicts,
    });
  } catch (error) {
    console.error("Error adding cast to event:", error);
    return NextResponse.json({ error: "Failed to add cast to event" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, eventId } = await params;

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

    const event = await db.query.scheduleEvents.findFirst({
      where: and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.showId, showId)),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = eventCastRemoveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { talentProfileIds } = parsed.data;

    await db
      .delete(eventCast)
      .where(
        and(eq(eventCast.eventId, eventId), inArray(eventCast.talentProfileId, talentProfileIds))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing cast from event:", error);
    return NextResponse.json({ error: "Failed to remove cast from event" }, { status: 500 });
  }
}

async function checkConflicts(
  talentProfileIds: string[],
  startTime: Date,
  endTime: Date,
  excludeEventId: string
): Promise<ConflictInfo[]> {
  const conflicts: ConflictInfo[] = [];

  const talents = await db.query.talentProfiles.findMany({
    where: inArray(talentProfiles.id, talentProfileIds),
  });
  const talentMap = new Map(talents.map((t) => [t.id, t]));

  const unavailabilities = await db.query.availability.findMany({
    where: and(
      inArray(availability.talentProfileId, talentProfileIds),
      eq(availability.status, "unavailable"),
      or(
        and(lte(availability.startDate, startTime), gte(availability.endDate, startTime)),
        and(lte(availability.startDate, endTime), gte(availability.endDate, endTime)),
        and(gte(availability.startDate, startTime), lte(availability.endDate, endTime))
      )
    ),
  });

  for (const unavail of unavailabilities) {
    const talent = talentMap.get(unavail.talentProfileId);
    if (talent) {
      conflicts.push({
        talentProfileId: unavail.talentProfileId,
        talentName: `${talent.firstName} ${talent.lastName}`,
        conflictType: "unavailable",
        conflictDetails: unavail.title ?? "Marked as unavailable",
      });
    }
  }

  const overlappingEvents = await db
    .select({
      event: scheduleEvents,
      cast: eventCast,
    })
    .from(eventCast)
    .innerJoin(scheduleEvents, eq(eventCast.eventId, scheduleEvents.id))
    .where(
      and(
        inArray(eventCast.talentProfileId, talentProfileIds),
        or(
          and(lte(scheduleEvents.startTime, startTime), gte(scheduleEvents.endTime, startTime)),
          and(lte(scheduleEvents.startTime, endTime), gte(scheduleEvents.endTime, endTime)),
          and(gte(scheduleEvents.startTime, startTime), lte(scheduleEvents.endTime, endTime))
        )
      )
    );

  const filteredEvents = overlappingEvents.filter((e) => e.event.id !== excludeEventId);

  for (const overlap of filteredEvents) {
    const talent = talentMap.get(overlap.cast.talentProfileId);
    if (talent) {
      const existingConflict = conflicts.find(
        (c) => c.talentProfileId === overlap.cast.talentProfileId && c.conflictType === "event"
      );
      if (!existingConflict) {
        conflicts.push({
          talentProfileId: overlap.cast.talentProfileId,
          talentName: `${talent.firstName} ${talent.lastName}`,
          conflictType: "event",
          conflictDetails: `Already scheduled for: ${overlap.event.title}`,
        });
      }
    }
  }

  return conflicts;
}
