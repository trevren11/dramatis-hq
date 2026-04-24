import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentProfiles,
  availability,
  showSchedules,
  AVAILABILITY_STATUS_COLORS,
} from "@/lib/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  type: "availability" | "show";
  editable: boolean;
  extendedProps: {
    status?: string;
    notes?: string;
    showName?: string;
    role?: string;
    venue?: string;
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ events: [] });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start and end query parameters are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch availability entries within date range
    const availabilityEntries = await db.query.availability.findMany({
      where: and(
        eq(availability.talentProfileId, profile.id),
        or(
          and(gte(availability.startDate, start), lte(availability.startDate, end)),
          and(gte(availability.endDate, start), lte(availability.endDate, end)),
          and(lte(availability.startDate, start), gte(availability.endDate, end))
        )
      ),
    });

    // Fetch show schedules within date range
    const showEntries = await db.query.showSchedules.findMany({
      where: and(
        eq(showSchedules.talentProfileId, profile.id),
        or(
          and(gte(showSchedules.startDate, start), lte(showSchedules.startDate, end)),
          and(gte(showSchedules.endDate, start), lte(showSchedules.endDate, end)),
          and(lte(showSchedules.startDate, start), gte(showSchedules.endDate, end))
        )
      ),
    });

    // Convert to calendar events
    const events: CalendarEvent[] = [
      ...availabilityEntries.map((entry) => ({
        id: entry.id,
        title: entry.title ?? getStatusLabel(entry.status),
        start: entry.startDate.toISOString(),
        end: entry.endDate.toISOString(),
        allDay: entry.isAllDay ?? true,
        color: AVAILABILITY_STATUS_COLORS[entry.status],
        type: "availability" as const,
        editable: true,
        extendedProps: {
          status: entry.status,
          notes: entry.notes ?? undefined,
        },
      })),
      ...showEntries.map((entry) => ({
        id: entry.id,
        title: `${entry.showName}${entry.role ? ` - ${entry.role}` : ""}`,
        start: entry.startDate.toISOString(),
        end: entry.endDate.toISOString(),
        allDay: true,
        color: "#8b5cf6", // Purple for shows
        type: "show" as const,
        editable: false, // Shows are read-only on calendar
        extendedProps: {
          showName: entry.showName,
          role: entry.role ?? undefined,
          venue: entry.venue ?? undefined,
          status: entry.status,
        },
      })),
    ];

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Available",
    unavailable: "Unavailable",
    tentative: "Tentative",
  };
  return labels[status] ?? status;
}
