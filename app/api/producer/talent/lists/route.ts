import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentLists, talentListMembers, producerProfiles, users } from "@/lib/db/schema";
import { talentListSchema } from "@/lib/validations/talent-lists";
import { eq, desc, sql } from "drizzle-orm";

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

    const lists = await db
      .select({
        id: talentLists.id,
        name: talentLists.name,
        description: talentLists.description,
        color: talentLists.color,
        isShared: talentLists.isShared,
        createdAt: talentLists.createdAt,
        memberCount: sql<number>`count(${talentListMembers.talentProfileId})::int`,
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(talentLists)
      .leftJoin(users, eq(talentLists.createdBy, users.id))
      .leftJoin(talentListMembers, eq(talentLists.id, talentListMembers.listId))
      .where(eq(talentLists.organizationId, producerProfile.id))
      .groupBy(talentLists.id, users.id, users.name)
      .orderBy(desc(talentLists.createdAt));

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching talent lists:", error);
    return NextResponse.json({ error: "Failed to fetch talent lists" }, { status: 500 });
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
    const parsed = talentListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [list] = await db
      .insert(talentLists)
      .values({
        organizationId: producerProfile.id,
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        isShared: parsed.data.isShared ?? false,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating talent list:", error);
    return NextResponse.json({ error: "Failed to create talent list" }, { status: 500 });
  }
}
