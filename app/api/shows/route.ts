import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, shows } from "@/lib/db/schema";
import { showCreateSchema } from "@/lib/validations/shows";
import { eq, and, ilike, desc } from "drizzle-orm";

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
      return NextResponse.json({ shows: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const baseCondition = eq(shows.organizationId, profile.id);
    const conditions = [baseCondition];

    if (status && status !== "all") {
      conditions.push(eq(shows.status, status as (typeof shows.status.enumValues)[number]));
    }

    if (search) {
      conditions.push(ilike(shows.title, `%${search}%`));
    }

    const whereConditions = conditions.length > 1 ? and(...conditions) : baseCondition;

    const results = await db.query.shows.findMany({
      where: whereConditions,
      orderBy: [desc(shows.updatedAt)],
      limit,
      offset,
    });

    return NextResponse.json({ shows: results });
  } catch (error) {
    console.error("Error fetching shows:", error);
    return NextResponse.json({ error: "Failed to fetch shows" }, { status: 500 });
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
    const parsed = showCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [show] = await db
      .insert(shows)
      .values({
        ...parsed.data,
        organizationId: profile.id,
      })
      .returning();

    return NextResponse.json({ show }, { status: 201 });
  } catch (error) {
    console.error("Error creating show:", error);
    return NextResponse.json({ error: "Failed to create show" }, { status: 500 });
  }
}
