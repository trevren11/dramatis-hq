import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionApplications, talentProfiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify audition belongs to this organization
    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const baseCondition = eq(auditionApplications.auditionId, id);
    const conditions = [baseCondition];

    if (status && status !== "all") {
      conditions.push(
        eq(
          auditionApplications.status,
          status as (typeof auditionApplications.status.enumValues)[number]
        )
      );
    }

    const whereConditions = conditions.length > 1 ? and(...conditions) : baseCondition;

    // Get applications with talent profiles
    const applications = await db
      .select({
        application: auditionApplications,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
          location: talentProfiles.location,
          ageRangeLow: talentProfiles.ageRangeLow,
          ageRangeHigh: talentProfiles.ageRangeHigh,
          gender: talentProfiles.gender,
          ethnicity: talentProfiles.ethnicity,
          vocalRange: talentProfiles.vocalRange,
        },
      })
      .from(auditionApplications)
      .innerJoin(talentProfiles, eq(auditionApplications.talentProfileId, talentProfiles.id))
      .where(whereConditions)
      .orderBy(desc(auditionApplications.submittedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const allApplications = await db.query.auditionApplications.findMany({
      where: whereConditions,
    });

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: allApplications.length,
        totalPages: Math.ceil(allApplications.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
