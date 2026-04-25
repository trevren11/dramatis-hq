import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedSearches, producerProfiles, users } from "@/lib/db/schema";
import { savedSearchSchema } from "@/lib/validations/talent-lists";
import { eq, desc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const searches = await db
      .select({
        id: savedSearches.id,
        name: savedSearches.name,
        description: savedSearches.description,
        filters: savedSearches.filters,
        sortOrder: savedSearches.sortOrder,
        notifyOnMatch: savedSearches.notifyOnMatch,
        createdAt: savedSearches.createdAt,
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(savedSearches)
      .leftJoin(users, eq(savedSearches.createdBy, users.id))
      .where(eq(savedSearches.organizationId, producerProfile.id))
      .orderBy(desc(savedSearches.createdAt));

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = savedSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [search] = await db
      .insert(savedSearches)
      .values({
        organizationId: producerProfile.id,
        name: parsed.data.name,
        description: parsed.data.description,
        filters: parsed.data.filters,
        sortOrder: parsed.data.sortOrder,
        notifyOnMatch: parsed.data.notifyOnMatch ?? false,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ search }, { status: 201 });
  } catch (error) {
    console.error("Error creating saved search:", error);
    return NextResponse.json({ error: "Failed to create saved search" }, { status: 500 });
  }
}
