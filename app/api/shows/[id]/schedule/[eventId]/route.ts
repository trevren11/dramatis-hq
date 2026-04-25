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
  roles,
  castingAssignments,
  headshots,
} from "@/lib/db/schema";
import { scheduleEventUpdateSchema } from "@/lib/validations/schedule";
import { eq, and, inArray } from "drizzle-orm";
import { getEventTypeColor } from "@/lib/db/schema/schedule";
import { triggerEvent, CHANNELS, EVENTS } from "@/lib/pusher-server";

export async function GET(
  _request: Request,
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

    const castMembers = await db
      .select({
        eventCast: eventCast,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(eventCast)
      .innerJoin(talentProfiles, eq(eventCast.talentProfileId, talentProfiles.id))
      .leftJoin(roles, eq(eventCast.roleId, roles.id))
      .where(eq(eventCast.eventId, eventId));

    const talentIds = castMembers.map((c) => c.talent.id);
    let headshotMap: Record<string, string> = {};

    if (talentIds.length > 0) {
      const talentHeadshots = await db.query.headshots.findMany({
        where: and(inArray(headshots.talentProfileId, talentIds), eq(headshots.isPrimary, true)),
      });
      headshotMap = Object.fromEntries(
        talentHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
      );
    }

    const cast = castMembers.map((c) => ({
      id: c.eventCast.id,
      talentProfileId: c.talent.id,
      roleId: c.eventCast.roleId,
      firstName: c.talent.firstName,
      lastName: c.talent.lastName,
      stageName: c.talent.stageName,
      roleName: c.role?.name ?? null,
      headshotUrl: headshotMap[c.talent.id] ?? null,
      notifiedAt: c.eventCast.notifiedAt,
      acknowledgedAt: c.eventCast.acknowledgedAt,
    }));

    return NextResponse.json({
      event: {
        ...event,
        cast,
        color: getEventTypeColor(event.eventType),
      },
    });
  } catch (error) {
    console.error("Error fetching schedule event:", error);
    return NextResponse.json({ error: "Failed to fetch schedule event" }, { status: 500 });
  }
}

export async function PUT(
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

    const existingEvent = await db.query.scheduleEvents.findFirst({
      where: and(eq(scheduleEvents.id, eventId), eq(scheduleEvents.showId, showId)),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = scheduleEventUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { castMemberIds, roleIds, ...eventData } = parsed.data;

    const [updatedEvent] = await db
      .update(scheduleEvents)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(scheduleEvents.id, eventId))
      .returning();

    if (castMemberIds !== undefined || roleIds !== undefined || eventData.isAllCast !== undefined) {
      await db.delete(eventCast).where(eq(eventCast.eventId, eventId));

      let castToAdd: string[] = [];

      if (eventData.isAllCast ?? existingEvent.isAllCast) {
        const assignments = await db.query.castingAssignments.findMany({
          where: and(
            eq(castingAssignments.showId, showId),
            eq(castingAssignments.status, "confirmed")
          ),
        });
        castToAdd = assignments.map((a) => a.talentProfileId);
      } else if (roleIds && roleIds.length > 0) {
        const assignments = await db.query.castingAssignments.findMany({
          where: and(
            eq(castingAssignments.showId, showId),
            inArray(castingAssignments.roleId, roleIds),
            eq(castingAssignments.status, "confirmed")
          ),
        });
        castToAdd = assignments.map((a) => a.talentProfileId);
      } else if (castMemberIds && castMemberIds.length > 0) {
        castToAdd = castMemberIds;
      }

      if (castToAdd.length > 0) {
        const uniqueCast = [...new Set(castToAdd)];
        await db.insert(eventCast).values(
          uniqueCast.map((talentProfileId) => ({
            eventId: eventId,
            talentProfileId,
          }))
        );
      }
    }

    if (!updatedEvent) {
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }

    // Broadcast schedule update
    void triggerEvent(CHANNELS.schedule(showId), EVENTS.SCHEDULE_UPDATED, {
      event: { ...updatedEvent, color: getEventTypeColor(updatedEvent.eventType) },
      eventId,
      showId,
    });

    return NextResponse.json({
      event: { ...updatedEvent, color: getEventTypeColor(updatedEvent.eventType) },
    });
  } catch (error) {
    console.error("Error updating schedule event:", error);
    return NextResponse.json({ error: "Failed to update schedule event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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

    await db.delete(scheduleEvents).where(eq(scheduleEvents.id, eventId));

    // Broadcast schedule deletion
    void triggerEvent(CHANNELS.schedule(showId), EVENTS.SCHEDULE_DELETED, {
      eventId,
      showId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule event:", error);
    return NextResponse.json({ error: "Failed to delete schedule event" }, { status: 500 });
  }
}
