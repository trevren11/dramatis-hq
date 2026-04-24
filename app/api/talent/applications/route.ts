import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentProfiles,
  auditions,
  auditionApplications,
  shows,
  producerProfiles,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get talent profile
    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!talentProfile) {
      return NextResponse.json({ applications: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const baseCondition = eq(auditionApplications.talentProfileId, talentProfile.id);
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

    // Get applications with audition, show, and organization info
    const applications = await db
      .select({
        application: auditionApplications,
        audition: {
          id: auditions.id,
          title: auditions.title,
          slug: auditions.slug,
          location: auditions.location,
          isVirtual: auditions.isVirtual,
          auditionDates: auditions.auditionDates,
          submissionDeadline: auditions.submissionDeadline,
          status: auditions.status,
        },
        show: {
          id: shows.id,
          title: shows.title,
          type: shows.type,
          venue: shows.venue,
        },
        organization: {
          id: producerProfiles.id,
          companyName: producerProfiles.companyName,
          slug: producerProfiles.slug,
          logoUrl: producerProfiles.logoUrl,
        },
      })
      .from(auditionApplications)
      .innerJoin(auditions, eq(auditionApplications.auditionId, auditions.id))
      .innerJoin(shows, eq(auditions.showId, shows.id))
      .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
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
