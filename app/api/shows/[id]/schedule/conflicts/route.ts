/* eslint-disable complexity */
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
  castingAssignments,
  roles,
  headshots,
} from "@/lib/db/schema";
import { eq, and, inArray, lte, gte, or } from "drizzle-orm";
import { z } from "zod";

const conflictCheckSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  talentProfileIds: z.array(z.string().uuid()).optional(),
  excludeEventId: z.string().uuid().optional(),
});

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
    const parsed = conflictCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { startTime, endTime, talentProfileIds, excludeEventId } = parsed.data;

    let targetTalentIds: string[] = [];

    if (talentProfileIds && talentProfileIds.length > 0) {
      targetTalentIds = talentProfileIds;
    } else {
      const assignments = await db.query.castingAssignments.findMany({
        where: and(
          eq(castingAssignments.showId, showId),
          eq(castingAssignments.status, "confirmed")
        ),
      });
      targetTalentIds = assignments.map((a) => a.talentProfileId);
    }

    if (targetTalentIds.length === 0) {
      return NextResponse.json({ conflicts: [], availableCast: [] });
    }

    const talents = await db
      .select({
        talent: talentProfiles,
        role: roles,
        headshot: headshots,
      })
      .from(talentProfiles)
      .leftJoin(
        castingAssignments,
        and(
          eq(castingAssignments.talentProfileId, talentProfiles.id),
          eq(castingAssignments.showId, showId)
        )
      )
      .leftJoin(roles, eq(castingAssignments.roleId, roles.id))
      .leftJoin(
        headshots,
        and(eq(headshots.talentProfileId, talentProfiles.id), eq(headshots.isPrimary, true))
      )
      .where(inArray(talentProfiles.id, targetTalentIds));

    const talentMap = new Map(
      talents.map((t) => [
        t.talent.id,
        {
          ...t.talent,
          roleName: t.role?.name ?? null,
          headshotUrl: t.headshot?.thumbnailUrl ?? t.headshot?.url ?? null,
        },
      ])
    );

    const unavailabilities = await db.query.availability.findMany({
      where: and(
        inArray(availability.talentProfileId, targetTalentIds),
        eq(availability.status, "unavailable"),
        or(
          and(lte(availability.startDate, startTime), gte(availability.endDate, startTime)),
          and(lte(availability.startDate, endTime), gte(availability.endDate, endTime)),
          and(gte(availability.startDate, startTime), lte(availability.endDate, endTime))
        )
      ),
    });

    const unavailableTalentIds = new Set(unavailabilities.map((u) => u.talentProfileId));

    const overlappingEventConditions = [
      inArray(eventCast.talentProfileId, targetTalentIds),
      or(
        and(lte(scheduleEvents.startTime, startTime), gte(scheduleEvents.endTime, startTime)),
        and(lte(scheduleEvents.startTime, endTime), gte(scheduleEvents.endTime, endTime)),
        and(gte(scheduleEvents.startTime, startTime), lte(scheduleEvents.endTime, endTime))
      ),
    ];

    const overlappingEvents = await db
      .select({
        event: scheduleEvents,
        cast: eventCast,
      })
      .from(eventCast)
      .innerJoin(scheduleEvents, eq(eventCast.eventId, scheduleEvents.id))
      .where(and(...overlappingEventConditions));

    const filteredEvents = excludeEventId
      ? overlappingEvents.filter((e) => e.event.id !== excludeEventId)
      : overlappingEvents;

    const busyTalentMap = new Map<string, { eventId: string; eventTitle: string }>();
    for (const overlap of filteredEvents) {
      if (!busyTalentMap.has(overlap.cast.talentProfileId)) {
        busyTalentMap.set(overlap.cast.talentProfileId, {
          eventId: overlap.event.id,
          eventTitle: overlap.event.title,
        });
      }
    }

    const conflicts = [];
    const availableCast = [];

    for (const talentId of targetTalentIds) {
      const talent = talentMap.get(talentId);
      if (!talent) continue;

      const talentInfo = {
        id: talent.id,
        firstName: talent.firstName,
        lastName: talent.lastName,
        stageName: talent.stageName,
        roleName: talent.roleName,
        headshotUrl: talent.headshotUrl,
      };

      const isUnavailable = unavailableTalentIds.has(talentId);
      const busyEvent = busyTalentMap.get(talentId);

      if (isUnavailable || busyEvent) {
        conflicts.push({
          ...talentInfo,
          conflictType: isUnavailable ? "unavailable" : "event",
          conflictDetails: isUnavailable
            ? "Marked as unavailable"
            : `Scheduled for: ${busyEvent?.eventTitle ?? "another event"}`,
          conflictEventId: busyEvent?.eventId ?? null,
        });
      } else {
        availableCast.push(talentInfo);
      }
    }

    return NextResponse.json({
      conflicts,
      availableCast,
    });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return NextResponse.json({ error: "Failed to check conflicts" }, { status: 500 });
  }
}
