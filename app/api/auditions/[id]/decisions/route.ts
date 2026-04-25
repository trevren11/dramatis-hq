import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  auditions,
  auditionDecisions,
  talentProfiles,
  users,
  roles,
} from "@/lib/db/schema";
import { decisionCreateWithRoleSchema } from "@/lib/validations/audition-session";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/decisions
 * Get all decisions for an audition (producer only)
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

    // Get all decisions with talent and user info
    const decisions = await db
      .select({
        id: auditionDecisions.id,
        decision: auditionDecisions.decision,
        notes: auditionDecisions.notes,
        decidedAt: auditionDecisions.decidedAt,
        talentProfile: {
          id: talentProfiles.id,
          stageName: talentProfiles.stageName,
        },
        decidedBy: {
          id: users.id,
          name: users.name,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(auditionDecisions)
      .innerJoin(talentProfiles, eq(auditionDecisions.talentProfileId, talentProfiles.id))
      .innerJoin(users, eq(auditionDecisions.decidedBy, users.id))
      .leftJoin(roles, eq(auditionDecisions.roleId, roles.id))
      .where(eq(auditionDecisions.auditionId, auditionId))
      .orderBy(desc(auditionDecisions.decidedAt));

    // Count by decision type
    const counts = {
      callback: 0,
      hold_for_role: 0,
      cast_in_role: 0,
      release: 0,
    };

    for (const d of decisions) {
      if (d.decision in counts) {
        counts[d.decision]++;
      }
    }

    return NextResponse.json({
      decisions: decisions.map((d) => ({
        id: d.id,
        decision: d.decision,
        notes: d.notes,
        decidedAt: d.decidedAt,
        talent: {
          id: d.talentProfile.id,
          name: d.talentProfile.stageName,
        },
        decidedBy: {
          id: d.decidedBy.id,
          name: d.decidedBy.name,
        },
        role: d.role
          ? {
              id: d.role.id,
              name: d.role.name,
            }
          : null,
      })),
      counts,
      total: decisions.length,
    });
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/decisions
 * Create a new decision for a talent (producer only)
 */
export async function POST(
  request: Request,
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

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = decisionCreateWithRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { talentProfileId, decision, roleId, notes } = parsed.data;

    // Check if decision already exists for this talent
    const existingDecision = await db.query.auditionDecisions.findFirst({
      where: and(
        eq(auditionDecisions.auditionId, auditionId),
        eq(auditionDecisions.talentProfileId, talentProfileId)
      ),
    });

    if (existingDecision) {
      // Update existing decision instead of creating new one
      const [updated] = await db
        .update(auditionDecisions)
        .set({
          decision,
          roleId: roleId ?? null,
          notes: notes ?? null,
          decidedBy: session.user.id,
          decidedAt: new Date(),
        })
        .where(eq(auditionDecisions.id, existingDecision.id))
        .returning();

      return NextResponse.json({ decision: updated, updated: true });
    }

    // Create new decision
    const [newDecision] = await db
      .insert(auditionDecisions)
      .values({
        auditionId,
        talentProfileId,
        decision,
        roleId: roleId ?? null,
        notes: notes ?? null,
        decidedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ decision: newDecision, updated: false }, { status: 201 });
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json({ error: "Failed to create decision" }, { status: 500 });
  }
}
