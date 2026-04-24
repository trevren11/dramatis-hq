import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, availability } from "@/lib/db/schema";
import { availabilitySchema } from "@/lib/validations/calendar";
import { eq, and, gte, lte, or, desc } from "drizzle-orm";

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
      return NextResponse.json({ availability: [] });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let whereConditions = eq(availability.talentProfileId, profile.id);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRangeCondition = and(
        whereConditions,
        or(
          and(gte(availability.startDate, start), lte(availability.startDate, end)),
          and(gte(availability.endDate, start), lte(availability.endDate, end)),
          and(lte(availability.startDate, start), gte(availability.endDate, end))
        )
      );
      if (dateRangeCondition) {
        whereConditions = dateRangeCondition;
      }
    }

    const entries = await db.query.availability.findMany({
      where: whereConditions,
      orderBy: [desc(availability.startDate)],
    });

    return NextResponse.json({ availability: entries });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check for overlapping availability (conflict detection)
    const overlapping = await db.query.availability.findFirst({
      where: and(
        eq(availability.talentProfileId, profile.id),
        or(
          and(
            lte(availability.startDate, parsed.data.endDate),
            gte(availability.endDate, parsed.data.startDate)
          )
        )
      ),
    });

    const [entry] = await db
      .insert(availability)
      .values({
        ...parsed.data,
        talentProfileId: profile.id,
      })
      .returning();

    return NextResponse.json(
      {
        availability: entry,
        hasConflict: !!overlapping,
        conflictingEntry: overlapping ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 });
  }
}
