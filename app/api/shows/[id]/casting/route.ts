import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  shows,
  roles,
  castingAssignments,
  castingDeck,
  talentProfiles,
  headshots,
  auditions,
  auditionApplications,
} from "@/lib/db/schema";
import { castingAssignmentCreateSchema } from "@/lib/validations/casting";
import { eq, and, asc, inArray } from "drizzle-orm";

interface TalentWithHeadshot {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  primaryHeadshotUrl: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const showRoles = await db.query.roles.findMany({
      where: eq(roles.showId, showId),
      orderBy: [asc(roles.sortOrder)],
    });

    const assignments = await db
      .select({
        assignment: castingAssignments,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
      })
      .from(castingAssignments)
      .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
      .where(eq(castingAssignments.showId, showId));

    const deckItems = await db
      .select({
        deck: castingDeck,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
      })
      .from(castingDeck)
      .innerJoin(talentProfiles, eq(castingDeck.talentProfileId, talentProfiles.id))
      .where(eq(castingDeck.showId, showId))
      .orderBy(asc(castingDeck.sortOrder));

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.showId, showId),
    });

    let poolTalent: TalentWithHeadshot[] = [];
    if (audition) {
      const applications = await db
        .select({
          talent: {
            id: talentProfiles.id,
            firstName: talentProfiles.firstName,
            lastName: talentProfiles.lastName,
            stageName: talentProfiles.stageName,
          },
        })
        .from(auditionApplications)
        .innerJoin(talentProfiles, eq(auditionApplications.talentProfileId, talentProfiles.id))
        .where(eq(auditionApplications.auditionId, audition.id));

      const assignedTalentIds = assignments.map((a) => a.talent.id);
      const deckTalentIds = deckItems.map((d) => d.talent.id);
      const excludedIds = new Set([...assignedTalentIds, ...deckTalentIds]);

      poolTalent = applications
        .filter((a) => !excludedIds.has(a.talent.id))
        .map((a) => ({ ...a.talent, primaryHeadshotUrl: null }));
    }

    const allTalentIds = [
      ...assignments.map((a) => a.talent.id),
      ...deckItems.map((d) => d.talent.id),
      ...poolTalent.map((t) => t.id),
    ];

    let headshotMap: Record<string, string> = {};
    if (allTalentIds.length > 0) {
      const talentHeadshots = await db.query.headshots.findMany({
        where: and(inArray(headshots.talentProfileId, allTalentIds), eq(headshots.isPrimary, true)),
      });
      headshotMap = Object.fromEntries(
        talentHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
      );
    }

    const enrichWithHeadshot = (talent: {
      id: string;
      firstName: string;
      lastName: string;
      stageName: string | null;
    }): TalentWithHeadshot => ({
      ...talent,
      primaryHeadshotUrl: headshotMap[talent.id] ?? null,
    });

    return NextResponse.json({
      roles: showRoles,
      assignments: assignments.map((a) => ({
        ...a.assignment,
        talent: enrichWithHeadshot(a.talent),
      })),
      deck: deckItems.map((d) => ({
        ...d.deck,
        talent: enrichWithHeadshot(d.talent),
      })),
      pool: poolTalent.map((t) => ({
        ...t,
        primaryHeadshotUrl: headshotMap[t.id] ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching casting data:", error);
    return NextResponse.json({ error: "Failed to fetch casting data" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const show = await db.query.shows.findFirst({
      where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = castingAssignmentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, parsed.data.roleId), eq(roles.showId, showId)),
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (parsed.data.slotIndex >= (role.positionCount ?? 1)) {
      return NextResponse.json({ error: "Slot index exceeds position count" }, { status: 400 });
    }

    const existingSlot = await db.query.castingAssignments.findFirst({
      where: and(
        eq(castingAssignments.roleId, parsed.data.roleId),
        eq(castingAssignments.slotIndex, parsed.data.slotIndex)
      ),
    });

    if (existingSlot) {
      return NextResponse.json({ error: "Slot already occupied" }, { status: 409 });
    }

    const existingTalent = await db.query.castingAssignments.findFirst({
      where: and(
        eq(castingAssignments.showId, showId),
        eq(castingAssignments.talentProfileId, parsed.data.talentProfileId)
      ),
    });

    if (existingTalent) {
      return NextResponse.json(
        { error: "Talent already assigned to a role in this show" },
        { status: 409 }
      );
    }

    await db
      .delete(castingDeck)
      .where(
        and(
          eq(castingDeck.showId, showId),
          eq(castingDeck.talentProfileId, parsed.data.talentProfileId)
        )
      );

    const [assignment] = await db
      .insert(castingAssignments)
      .values({
        ...parsed.data,
        showId,
        assignedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating casting assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
