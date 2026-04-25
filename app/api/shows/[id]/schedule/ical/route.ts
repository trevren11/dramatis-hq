/* eslint-disable complexity, max-depth */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  shows,
  scheduleEvents,
  eventCast,
  talentProfiles,
  users,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import ical, { ICalCalendarMethod, ICalEventStatus } from "ical-generator";
import { SCHEDULE_EVENT_TYPE_OPTIONS } from "@/lib/db/schema/schedule";

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
    const talentId = searchParams.get("talentId");

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    let show;
    if (profile) {
      show = await db.query.shows.findFirst({
        where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
      });
    }

    if (!show) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      if (user?.userType === "talent") {
        const talentProfile = await db.query.talentProfiles.findFirst({
          where: eq(talentProfiles.userId, session.user.id),
        });

        if (talentProfile) {
          const talentEvents = await db
            .select({ eventId: eventCast.eventId })
            .from(eventCast)
            .innerJoin(scheduleEvents, eq(eventCast.eventId, scheduleEvents.id))
            .where(
              and(
                eq(eventCast.talentProfileId, talentProfile.id),
                eq(scheduleEvents.showId, showId)
              )
            );

          if (talentEvents.length > 0) {
            show = await db.query.shows.findFirst({
              where: eq(shows.id, showId),
            });
          }
        }
      }
    }

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    let events: (typeof scheduleEvents.$inferSelect)[] = [];
    if (talentId) {
      const talentEventIds = await db
        .select({ eventId: eventCast.eventId })
        .from(eventCast)
        .where(eq(eventCast.talentProfileId, talentId));

      const eventIds = talentEventIds.map((e) => e.eventId);

      if (eventIds.length === 0) {
        events = [];
      } else {
        events = await db.query.scheduleEvents.findMany({
          where: and(eq(scheduleEvents.showId, showId), inArray(scheduleEvents.id, eventIds)),
          orderBy: [asc(scheduleEvents.startTime)],
        });
      }
    } else {
      events = await db.query.scheduleEvents.findMany({
        where: eq(scheduleEvents.showId, showId),
        orderBy: [asc(scheduleEvents.startTime)],
      });
    }

    const calendar = ical({
      name: `${show.title} - Schedule`,
      method: ICalCalendarMethod.PUBLISH,
      prodId: { company: "Dramatis", product: "Dramatis HQ", language: "EN" },
    });

    for (const event of events) {
      const eventTypeOption = SCHEDULE_EVENT_TYPE_OPTIONS.find(
        (opt) => opt.value === event.eventType
      );

      let status: ICalEventStatus;
      switch (event.status) {
        case "confirmed":
          status = ICalEventStatus.CONFIRMED;
          break;
        case "cancelled":
          status = ICalEventStatus.CANCELLED;
          break;
        default:
          status = ICalEventStatus.TENTATIVE;
      }

      calendar.createEvent({
        id: event.icalUid ?? event.id,
        start: event.startTime,
        end: event.endTime,
        summary: `[${eventTypeOption?.label ?? event.eventType}] ${event.title}`,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        status,
        categories: [{ name: eventTypeOption?.label ?? event.eventType }],
      });
    }

    const icsContent = calendar.toString();

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${show.title.replace(/[^a-z0-9]/gi, "_")}_schedule.ics"`,
      },
    });
  } catch (error) {
    console.error("Error generating iCal:", error);
    return NextResponse.json({ error: "Failed to generate iCal" }, { status: 500 });
  }
}
