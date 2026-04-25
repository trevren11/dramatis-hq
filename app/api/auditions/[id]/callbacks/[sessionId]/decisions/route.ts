import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  auditionDecisions,
  talentProfiles,
  roles,
  producerProfiles,
} from "@/lib/db/schema";
import {
  auditionDecisionCreateSchema,
  auditionDecisionUpdateSchema,
} from "@/lib/validations/callbacks";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks/[sessionId]/decisions
 * Get all decisions for a callback session
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;
    const url = new URL(request.url);
    const talentProfileId = url.searchParams.get("talentProfileId");

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const callbackSession = await db.query.callbackSessions.findFirst({
      where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
    });

    if (!callbackSession) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    let decisionsQuery;
    if (talentProfileId) {
      decisionsQuery = db.query.auditionDecisions.findMany({
        where: and(
          eq(auditionDecisions.callbackSessionId, sessionId),
          eq(auditionDecisions.talentProfileId, talentProfileId)
        ),
        orderBy: [desc(auditionDecisions.decidedAt)],
      });
    } else {
      decisionsQuery = db.query.auditionDecisions.findMany({
        where: eq(auditionDecisions.callbackSessionId, sessionId),
        orderBy: [desc(auditionDecisions.decidedAt)],
      });
    }

    const decisions = await decisionsQuery;

    const decisionsWithDetails = await Promise.all(
      decisions.map(async (decision) => {
        const talent = await db.query.talentProfiles.findFirst({
          where: eq(talentProfiles.id, decision.talentProfileId),
        });

        const role = decision.roleId
          ? await db.query.roles.findFirst({
              where: eq(roles.id, decision.roleId),
            })
          : null;

        return {
          ...decision,
          talent: talent
            ? {
                id: talent.id,
                name: `${talent.firstName} ${talent.lastName}`,
              }
            : null,
          role: role ? { id: role.id, name: role.name } : null,
        };
      })
    );

    return NextResponse.json({ decisions: decisionsWithDetails });
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/decisions
 * Create a new decision for a talent
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const callbackSession = await db.query.callbackSessions.findFirst({
      where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
    });

    if (!callbackSession) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = auditionDecisionCreateSchema.safeParse({
      ...body,
      auditionId,
      callbackSessionId: sessionId,
      round: callbackSession.round,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [decision] = await db
      .insert(auditionDecisions)
      .values({
        auditionId,
        talentProfileId: parsed.data.talentProfileId,
        roleId: parsed.data.roleId,
        round: callbackSession.round,
        callbackSessionId: sessionId,
        decision: parsed.data.decision,
        notes: parsed.data.notes,
        decidedBy: session.user.id,
      })
      .returning();

    if (!decision) {
      return NextResponse.json({ error: "Failed to create decision" }, { status: 500 });
    }

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json({ error: "Failed to create decision" }, { status: 500 });
  }
}

/**
 * PUT /api/auditions/[id]/callbacks/[sessionId]/decisions
 * Update an existing decision (expects decisionId in body)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      decisionId?: string;
      decision?: string;
      notes?: string;
    };
    const { decisionId, ...updateData } = body;

    if (!decisionId) {
      return NextResponse.json({ error: "decisionId is required" }, { status: 400 });
    }

    const parsed = auditionDecisionUpdateSchema.safeParse(updateData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(auditionDecisions)
      .set({
        ...parsed.data,
        decidedBy: session.user.id,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(auditionDecisions.id, decisionId),
          eq(auditionDecisions.callbackSessionId, sessionId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    return NextResponse.json({ decision: updated });
  } catch (error) {
    console.error("Error updating decision:", error);
    return NextResponse.json({ error: "Failed to update decision" }, { status: 500 });
  }
}
