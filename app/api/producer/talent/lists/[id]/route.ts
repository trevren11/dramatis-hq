import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentLists,
  talentListMembers,
  talentProfiles,
  headshots,
  producerProfiles,
} from "@/lib/db/schema";
import { talentListSchema } from "@/lib/validations/talent-lists";
import { eq, and, inArray } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const { id } = await params;

    const list = await db.query.talentLists.findFirst({
      where: and(eq(talentLists.id, id), eq(talentLists.organizationId, producerProfile.id)),
    });

    if (!list) {
      return NextResponse.json({ error: "Talent list not found" }, { status: 404 });
    }

    // Get members with their profiles and headshots
    const members = await db
      .select({
        talentProfileId: talentListMembers.talentProfileId,
        notes: talentListMembers.notes,
        addedAt: talentListMembers.addedAt,
        profile: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
          location: talentProfiles.location,
        },
      })
      .from(talentListMembers)
      .innerJoin(talentProfiles, eq(talentListMembers.talentProfileId, talentProfiles.id))
      .where(eq(talentListMembers.listId, id));

    // Get headshots for all members
    const profileIds = members.map((m) => m.profile.id);
    const memberHeadshots =
      profileIds.length > 0
        ? await db
            .select({
              talentProfileId: headshots.talentProfileId,
              thumbnailUrl: headshots.thumbnailUrl,
              url: headshots.url,
            })
            .from(headshots)
            .where(
              and(inArray(headshots.talentProfileId, profileIds), eq(headshots.isPrimary, true))
            )
        : [];

    const headshotMap = new Map(
      memberHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
    );

    const membersWithHeadshots = members.map((m) => ({
      ...m,
      primaryHeadshot: headshotMap.get(m.profile.id) ?? null,
    }));

    return NextResponse.json({
      list,
      members: membersWithHeadshots,
    });
  } catch (error) {
    console.error("Error fetching talent list:", error);
    return NextResponse.json({ error: "Failed to fetch talent list" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const { id } = await params;

    const existingList = await db.query.talentLists.findFirst({
      where: and(eq(talentLists.id, id), eq(talentLists.organizationId, producerProfile.id)),
    });

    if (!existingList) {
      return NextResponse.json({ error: "Talent list not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = talentListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(talentLists)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        isShared: parsed.data.isShared,
        updatedAt: new Date(),
      })
      .where(eq(talentLists.id, id))
      .returning();

    return NextResponse.json({ list: updated });
  } catch (error) {
    console.error("Error updating talent list:", error);
    return NextResponse.json({ error: "Failed to update talent list" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const { id } = await params;

    const existingList = await db.query.talentLists.findFirst({
      where: and(eq(talentLists.id, id), eq(talentLists.organizationId, producerProfile.id)),
    });

    if (!existingList) {
      return NextResponse.json({ error: "Talent list not found" }, { status: 404 });
    }

    await db.delete(talentLists).where(eq(talentLists.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting talent list:", error);
    return NextResponse.json({ error: "Failed to delete talent list" }, { status: 500 });
  }
}
