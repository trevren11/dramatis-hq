import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  talentProfiles,
  availability,
  showSchedules,
  type Availability,
  type ShowSchedule,
  type TalentProfile,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ical, { type ICalCalendar, ICalCalendarMethod, ICalEventStatus } from "ical-generator";

function addAvailabilityEvents(calendar: ICalCalendar, entries: Availability[]): void {
  for (const entry of entries) {
    const statusText =
      entry.status === "available"
        ? "Available"
        : entry.status === "unavailable"
          ? "Unavailable"
          : "Tentative";

    calendar.createEvent({
      id: entry.id,
      start: entry.startDate,
      end: entry.endDate,
      allDay: entry.isAllDay ?? true,
      summary: entry.title ?? statusText,
      description: entry.notes ?? undefined,
      status: entry.status === "tentative" ? ICalEventStatus.TENTATIVE : ICalEventStatus.CONFIRMED,
    });
  }
}

function addShowEvents(calendar: ICalCalendar, entries: ShowSchedule[]): void {
  for (const entry of entries) {
    if (entry.isPublic) {
      calendar.createEvent({
        id: entry.id,
        start: entry.startDate,
        end: entry.endDate,
        allDay: true,
        summary: `Booked: ${entry.showName}`,
        description: entry.role ? `Role: ${entry.role}` : undefined,
        status:
          entry.status === "tentative" ? ICalEventStatus.TENTATIVE : ICalEventStatus.CONFIRMED,
      });
    } else {
      calendar.createEvent({
        id: entry.id,
        start: entry.startDate,
        end: entry.endDate,
        allDay: true,
        summary: "Booked",
        status: ICalEventStatus.CONFIRMED,
      });
    }
  }
}

function createCalendarResponse(icalString: string, profile: TalentProfile): NextResponse {
  return new NextResponse(icalString, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.firstName}-${profile.lastName}-calendar.ics"`,
    },
  });
}

// Public iCal feed endpoint - authenticated via token
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    const availabilityWithToken = await db.query.availability.findFirst({
      where: eq(availability.icalToken, token),
    });

    if (!availabilityWithToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.id, availabilityWithToken.talentProfileId),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const availabilityEntries = await db.query.availability.findMany({
      where: eq(availability.talentProfileId, profile.id),
    });

    const showEntries = await db.query.showSchedules.findMany({
      where: eq(showSchedules.talentProfileId, profile.id),
    });

    const calendar = ical({
      name: `${profile.firstName} ${profile.lastName} - Availability`,
      method: ICalCalendarMethod.PUBLISH,
      prodId: { company: "Dramatis HQ", product: "Talent Calendar" },
    });

    addAvailabilityEvents(calendar, availabilityEntries);
    addShowEvents(calendar, showEntries);

    return createCalendarResponse(calendar.toString(), profile);
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return NextResponse.json({ error: "Failed to generate calendar feed" }, { status: 500 });
  }
}
