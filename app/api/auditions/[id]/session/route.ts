import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  auditions,
  auditionFormResponses,
  auditionDecisions,
  auditionNotes,
  auditionRoles,
  talentProfiles,
  users,
  roles,
  headshots,
} from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/session
 * Get full session data for audition day interface (producer only)
 * Returns: audition info, queue with talent profiles, decisions, notes, roles
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId } = await params;

    // Verify producer owns this audition
    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, auditionId), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get roles for this audition
    const auditionRolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
      })
      .from(auditionRoles)
      .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
      .where(eq(auditionRoles.auditionId, auditionId));

    // Get queue with full talent data
    const queue = await db
      .select({
        id: auditionFormResponses.id,
        queueNumber: auditionFormResponses.queueNumber,
        checkinStatus: auditionFormResponses.status,
        checkedInAt: auditionFormResponses.checkedInAt,
        responses: auditionFormResponses.responses,
        talentProfile: {
          id: talentProfiles.id,
          stageName: talentProfiles.stageName,
          unionMemberships: talentProfiles.unionMemberships,
          heightInches: talentProfiles.heightInches,
          hairColor: talentProfiles.hairColor,
          eyeColor: talentProfiles.eyeColor,
          gender: talentProfiles.gender,
          ageRangeLow: talentProfiles.ageRangeLow,
          ageRangeHigh: talentProfiles.ageRangeHigh,
          bio: talentProfiles.bio,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(auditionFormResponses)
      .innerJoin(talentProfiles, eq(auditionFormResponses.talentProfileId, talentProfiles.id))
      .innerJoin(users, eq(talentProfiles.userId, users.id))
      .where(eq(auditionFormResponses.auditionId, auditionId))
      .orderBy(asc(auditionFormResponses.queueNumber));

    // Get primary headshots for each talent
    const talentIds = queue.map((q) => q.talentProfile.id);
    const headshotData =
      talentIds.length > 0
        ? await db
            .select({
              talentProfileId: headshots.talentProfileId,
              url: headshots.url,
              isPrimary: headshots.isPrimary,
            })
            .from(headshots)
            .where(eq(headshots.isPrimary, true))
        : [];

    const headshotMap = new Map(headshotData.map((h) => [h.talentProfileId, h.url]));

    // Get all decisions
    const decisions = await db
      .select({
        id: auditionDecisions.id,
        talentProfileId: auditionDecisions.talentProfileId,
        decision: auditionDecisions.decision,
        roleId: auditionDecisions.roleId,
        notes: auditionDecisions.notes,
        decidedAt: auditionDecisions.decidedAt,
        decidedById: auditionDecisions.decidedBy,
      })
      .from(auditionDecisions)
      .where(eq(auditionDecisions.auditionId, auditionId));

    const decisionMap = new Map(decisions.map((d) => [d.talentProfileId, d]));

    // Get all notes grouped by talent
    const notes = await db
      .select({
        id: auditionNotes.id,
        talentProfileId: auditionNotes.talentProfileId,
        note: auditionNotes.note,
        createdAt: auditionNotes.createdAt,
        createdBy: users.name,
      })
      .from(auditionNotes)
      .innerJoin(users, eq(auditionNotes.createdBy, users.id))
      .where(eq(auditionNotes.auditionId, auditionId))
      .orderBy(desc(auditionNotes.createdAt));

    // Group notes by talent
    const notesMap = new Map<string, typeof notes>();
    for (const note of notes) {
      const existing = notesMap.get(note.talentProfileId) ?? [];
      existing.push(note);
      notesMap.set(note.talentProfileId, existing);
    }

    // Build full queue response
    const fullQueue = queue.map((q) => {
      const decision = decisionMap.get(q.talentProfile.id);
      const talentNotes = notesMap.get(q.talentProfile.id) ?? [];

      return {
        id: q.id,
        queueNumber: q.queueNumber,
        checkinStatus: q.checkinStatus,
        checkedInAt: q.checkedInAt,
        formResponses: q.responses,
        talent: {
          id: q.talentProfile.id,
          name: q.talentProfile.stageName ?? q.user.name,
          email: q.user.email,
          unionMemberships: q.talentProfile.unionMemberships,
          heightInches: q.talentProfile.heightInches,
          hairColor: q.talentProfile.hairColor,
          eyeColor: q.talentProfile.eyeColor,
          gender: q.talentProfile.gender,
          ageRangeLow: q.talentProfile.ageRangeLow,
          ageRangeHigh: q.talentProfile.ageRangeHigh,
          bio: q.talentProfile.bio,
          headshotUrl: headshotMap.get(q.talentProfile.id) ?? null,
        },
        decision: decision
          ? {
              id: decision.id,
              type: decision.decision,
              roleId: decision.roleId,
              notes: decision.notes,
              decidedAt: decision.decidedAt,
            }
          : null,
        notes: talentNotes.map((n) => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt,
          createdBy: n.createdBy,
        })),
      };
    });

    // Calculate counts
    const counts = {
      total: fullQueue.length,
      checkedIn: fullQueue.filter((q) => q.checkinStatus === "checked_in").length,
      inRoom: fullQueue.filter((q) => q.checkinStatus === "in_room").length,
      completed: fullQueue.filter((q) => q.checkinStatus === "completed").length,
      callback: fullQueue.filter((q) => q.decision?.type === "callback").length,
      holdForRole: fullQueue.filter((q) => q.decision?.type === "hold_for_role").length,
      castInRole: fullQueue.filter((q) => q.decision?.type === "cast_in_role").length,
      release: fullQueue.filter((q) => q.decision?.type === "release").length,
      undecided: fullQueue.filter((q) => !q.decision).length,
    };

    return NextResponse.json({
      audition: {
        id: audition.id,
        title: audition.title,
        slug: audition.slug,
        location: audition.location,
        isVirtual: audition.isVirtual,
        status: audition.status,
      },
      roles: auditionRolesList,
      queue: fullQueue,
      counts,
    });
  } catch (error) {
    console.error("Error fetching session data:", error);
    return NextResponse.json({ error: "Failed to fetch session data" }, { status: 500 });
  }
}
