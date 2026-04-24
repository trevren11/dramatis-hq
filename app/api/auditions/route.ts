import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionRoles, shows } from "@/lib/db/schema";
import { auditionCreateSchema } from "@/lib/validations/auditions";
import { generateSlug } from "@/lib/utils";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ auditions: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const showId = searchParams.get("showId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const baseCondition = eq(auditions.organizationId, profile.id);
    const conditions = [baseCondition];

    if (status && status !== "all") {
      conditions.push(eq(auditions.status, status as (typeof auditions.status.enumValues)[number]));
    }

    if (showId) {
      conditions.push(eq(auditions.showId, showId));
    }

    if (search) {
      conditions.push(ilike(auditions.title, `%${search}%`));
    }

    const whereConditions = conditions.length > 1 ? and(...conditions) : baseCondition;

    const results = await db.query.auditions.findMany({
      where: whereConditions,
      orderBy: [desc(auditions.updatedAt)],
      limit,
      offset,
    });

    // Get application counts for each audition
    const auditionIds = results.map((a) => a.id);
    let applicationCounts: Record<string, number> = {};

    if (auditionIds.length > 0) {
      const counts = (await db.execute(sql`
        SELECT audition_id, COUNT(*) as count
        FROM audition_applications
        WHERE audition_id = ANY(${auditionIds})
        GROUP BY audition_id
      `)) as { audition_id: string; count: string }[];

      applicationCounts = Object.fromEntries(
        counts.map((row) => [row.audition_id, parseInt(row.count)])
      );
    }

    const auditionsWithCounts = results.map((audition) => ({
      ...audition,
      applicationCount: applicationCounts[audition.id] ?? 0,
    }));

    return NextResponse.json({ auditions: auditionsWithCounts });
  } catch (error) {
    console.error("Error fetching auditions:", error);
    return NextResponse.json({ error: "Failed to fetch auditions" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Producer profile not found. Please complete setup first." },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = auditionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { roleIds, ...auditionData } = parsed.data;

    // Verify show belongs to this organization
    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, auditionData.showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json(
        { error: "Show not found or not owned by this organization" },
        { status: 404 }
      );
    }

    // Generate slug if not provided
    let slug = auditionData.slug ?? generateSlug(auditionData.title);

    // Check for slug uniqueness and add suffix if needed
    let slugExists = await db.query.auditions.findFirst({
      where: eq(auditions.slug, slug),
    });

    let suffix = 1;
    while (slugExists) {
      slug = `${generateSlug(auditionData.title)}-${String(suffix)}`;
      slugExists = await db.query.auditions.findFirst({
        where: eq(auditions.slug, slug),
      });
      suffix++;
    }

    const [audition] = await db
      .insert(auditions)
      .values({
        ...auditionData,
        slug,
        organizationId: profile.id,
      })
      .returning();

    if (!audition) {
      return NextResponse.json({ error: "Failed to create audition" }, { status: 500 });
    }

    // Link roles if provided
    if (roleIds && roleIds.length > 0) {
      await db.insert(auditionRoles).values(
        roleIds.map((roleId) => ({
          auditionId: audition.id,
          roleId,
        }))
      );
    }

    return NextResponse.json({ audition }, { status: 201 });
  } catch (error) {
    console.error("Error creating audition:", error);
    return NextResponse.json({ error: "Failed to create audition" }, { status: 500 });
  }
}
