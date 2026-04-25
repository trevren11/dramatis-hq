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
import { scheduleEventCreateSchema, scheduleEventQuerySchema } from "@/lib/validations/schedule";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";
import { getEventTypeColor } from "@/lib/db/schema/schedule";
import { triggerEvent, CHANNELS, EVENTS } from "@/lib/pusher-server";

export async function GET(
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

    const queryParams = scheduleEventQuerySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      eventType: searchParams.get("eventType"),
      status: searchParams.get("status"),
    });

    const conditions = [eq(scheduleEvents.showId, showId)];

    if (queryParams.success) {
      if (queryParams.data.startDate) {
        conditions.push(gte(scheduleEvents.startTime, queryParams.data.startDate));
      }
      if (queryParams.data.endDate) {
        conditions.push(lte(scheduleEvents.endTime, queryParams.data.endDate));
      }
      if (queryParams.data.eventType) {
        conditions.push(eq(scheduleEvents.eventType, queryParams.data.eventType));
      }
      if (queryParams.data.status) {
        conditions.push(eq(scheduleEvents.status, queryParams.data.status));
      }
    }

    const events = await db.query.scheduleEvents.findMany({
      where: and(...conditions),
      orderBy: [asc(scheduleEvents.startTime)],
    });

    const eventIds = events.map((e) => e.id);

    let castByEvent: Record<
      string,
      {
        id: string;
        talentProfileId: string;
        roleId: string | null;
        firstName: string;
        lastName: string;
        stageName: string | null;
        roleName: string | null;
        headshotUrl: string | null;
      }[]
    > = {};

    if (eventIds.length > 0) {
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
        .where(inArray(eventCast.eventId, eventIds));

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

      castByEvent = castMembers.reduce<typeof castByEvent>((acc, c) => {
        const eventId = c.eventCast.eventId;
        acc[eventId] ??= [];
        acc[eventId].push({
          id: c.eventCast.id,
          talentProfileId: c.talent.id,
          roleId: c.eventCast.roleId,
          firstName: c.talent.firstName,
          lastName: c.talent.lastName,
          stageName: c.talent.stageName,
          roleName: c.role?.name ?? null,
          headshotUrl: headshotMap[c.talent.id] ?? null,
        });
        return acc;
      }, {});
    }

    const eventsWithCast = events.map((event) => ({
      ...event,
      cast: castByEvent[event.id] ?? [],
      color: getEventTypeColor(event.eventType),
    }));

    return NextResponse.json({ events: eventsWithCast });
  } catch (error) {
    console.error("Error fetching schedule events:", error);
    return NextResponse.json({ error: "Failed to fetch schedule events" }, { status: 500 });
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
    const parsed = scheduleEventCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { castMemberIds, roleIds, ...eventData } = parsed.data;

    const [event] = await db
      .insert(scheduleEvents)
      .values({
        ...eventData,
        showId,
        createdBy: session.user.id,
      })
      .returning();

    if (!event) {
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    let castToAdd: string[] = [];

    if (eventData.isAllCast) {
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
          eventId: event.id,
          talentProfileId,
        }))
      );
    }

    // Broadcast schedule update
    void triggerEvent(CHANNELS.schedule(showId), EVENTS.SCHEDULE_CREATED, {
      event: { ...event, color: getEventTypeColor(event.eventType) },
      showId,
    });

    return NextResponse.json(
      { event: { ...event, color: getEventTypeColor(event.eventType) } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating schedule event:", error);
    return NextResponse.json({ error: "Failed to create schedule event" }, { status: 500 });
  }
}
