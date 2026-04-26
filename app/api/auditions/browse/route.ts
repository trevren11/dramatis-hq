import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditions, shows, producerProfiles } from "@/lib/db/schema";
import { auditionSearchSchema } from "@/lib/validations/auditions";
import { eq, and, ilike, gte, lte, or, desc, sql, isNull } from "drizzle-orm";

// eslint-disable-next-line complexity
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = auditionSearchSchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      unionStatus: searchParams.get("unionStatus") ?? undefined,
      roleType: searchParams.get("roleType") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      isVirtual: searchParams.get("isVirtual") === "true" ? true : undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { search, location, isVirtual, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    // Build where conditions for public auditions
    const now = new Date();
    const conditions = [
      eq(auditions.status, "open"),
      eq(auditions.visibility, "public"),
      or(isNull(auditions.publishAt), lte(auditions.publishAt, now)),
    ];

    // Search in title and description
    if (search) {
      conditions.push(
        or(ilike(auditions.title, `%${search}%`), ilike(auditions.description, `%${search}%`))
      );
    }

    // Location filter
    if (location) {
      conditions.push(ilike(auditions.location, `%${location}%`));
    }

    // Virtual filter
    if (isVirtual !== undefined) {
      conditions.push(eq(auditions.isVirtual, isVirtual));
    }

    // Filter by deadline (only show auditions with future or no deadline)
    conditions.push(
      or(isNull(auditions.submissionDeadline), gte(auditions.submissionDeadline, now))
    );

    const whereConditions = and(...conditions);

    // Query auditions with show and organization info
    const results = await db
      .select({
        audition: auditions,
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
          location: producerProfiles.location,
        },
      })
      .from(auditions)
      .innerJoin(shows, eq(auditions.showId, shows.id))
      .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
      .where(whereConditions)
      .orderBy(desc(auditions.publishAt), desc(auditions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditions)
      .innerJoin(shows, eq(auditions.showId, shows.id))
      .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
      .where(whereConditions);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      auditions: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error browsing auditions:", error);
    return NextResponse.json({ error: "Failed to fetch auditions" }, { status: 500 });
  }
}
