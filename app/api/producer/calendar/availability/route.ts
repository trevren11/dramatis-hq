import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, availability, showSchedules } from "@/lib/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";

// Producer endpoint to view talent availability
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a producer or admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || (user.userType !== "producer" && user.userType !== "admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const talentProfileId = searchParams.get("talentProfileId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!talentProfileId) {
      return NextResponse.json({ error: "talentProfileId is required" }, { status: 400 });
    }

    let availabilityConditions = eq(availability.talentProfileId, talentProfileId);
    let showConditions = eq(showSchedules.talentProfileId, talentProfileId);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const dateRangeFilter = or(
        and(gte(availability.startDate, start), lte(availability.startDate, end)),
        and(gte(availability.endDate, start), lte(availability.endDate, end)),
        and(lte(availability.startDate, start), gte(availability.endDate, end))
      );

      if (dateRangeFilter) {
        const combined = and(availabilityConditions, dateRangeFilter);
        if (combined) {
          availabilityConditions = combined;
        }
      }

      const showDateRangeFilter = or(
        and(gte(showSchedules.startDate, start), lte(showSchedules.startDate, end)),
        and(gte(showSchedules.endDate, start), lte(showSchedules.endDate, end)),
        and(lte(showSchedules.startDate, start), gte(showSchedules.endDate, end))
      );

      if (showDateRangeFilter) {
        const combinedShow = and(showConditions, showDateRangeFilter);
        if (combinedShow) {
          showConditions = combinedShow;
        }
      }
    }

    const availabilityEntries = await db.query.availability.findMany({
      where: availabilityConditions,
    });

    const showEntries = await db.query.showSchedules.findMany({
      where: showConditions,
    });

    // Filter show details based on privacy settings
    const filteredShowEntries = showEntries.map((show) => ({
      id: show.id,
      showName: show.isPublic ? show.showName : "Booked",
      startDate: show.startDate,
      endDate: show.endDate,
      isPublic: show.isPublic,
    }));

    return NextResponse.json({
      availability: availabilityEntries,
      showSchedules: filteredShowEntries,
    });
  } catch (error) {
    console.error("Error fetching talent availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
