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
} from "@/lib/db/schema";
import { callSheetGenerateSchema } from "@/lib/validations/schedule";
import { eq, and, inArray, asc } from "drizzle-orm";
import { format } from "date-fns";

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
    const parsed = callSheetGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { eventIds, includeNotes, includeLocation } = parsed.data;

    const events = await db.query.scheduleEvents.findMany({
      where: and(eq(scheduleEvents.showId, showId), inArray(scheduleEvents.id, eventIds)),
      orderBy: [asc(scheduleEvents.startTime)],
    });

    if (events.length === 0) {
      return NextResponse.json({ error: "No events found" }, { status: 404 });
    }

    const castMembers = await db
      .select({
        eventCast: eventCast,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
          phone: talentProfiles.phone,
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

    const castByEvent = castMembers.reduce<
      Record<
        string,
        {
          id: string;
          name: string;
          role: string | null;
          phone: string | null;
        }[]
      >
    >((acc, c) => {
      const eventId = c.eventCast.eventId;
      acc[eventId] ??= [];
      acc[eventId].push({
        id: c.talent.id,
        name: c.talent.stageName ?? `${c.talent.firstName} ${c.talent.lastName}`,
        role: c.role?.name ?? null,
        phone: c.talent.phone,
      });
      return acc;
    }, {});

    const callSheet = {
      show: {
        title: show.title,
        venue: show.venue,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.name ?? session.user.email,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        date: format(event.startTime, "EEEE, MMMM d, yyyy"),
        startTime: format(event.startTime, "h:mm a"),
        endTime: format(event.endTime, "h:mm a"),
        location: includeLocation ? event.location : null,
        notes: includeNotes ? event.notes : null,
        cast: (castByEvent[event.id] ?? []).sort((a, b) => {
          if (a.role && b.role) return a.role.localeCompare(b.role);
          if (a.role) return -1;
          if (b.role) return 1;
          return a.name.localeCompare(b.name);
        }),
      })),
    };

    return NextResponse.json({ callSheet });
  } catch (error) {
    console.error("Error generating call sheet:", error);
    return NextResponse.json({ error: "Failed to generate call sheet" }, { status: 500 });
  }
}
