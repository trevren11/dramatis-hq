import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionDecisions } from "@/lib/db/schema";
import { decisionUpdateWithRoleSchema } from "@/lib/validations/audition-session";
import { eq, and } from "drizzle-orm";

/**
 * PUT /api/auditions/[id]/decisions/[decisionId]
 * Update a decision (producer only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; decisionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, decisionId } = await params;

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

    // Verify decision exists and belongs to this audition
    const existingDecision = await db.query.auditionDecisions.findFirst({
      where: and(
        eq(auditionDecisions.id, decisionId),
        eq(auditionDecisions.auditionId, auditionId)
      ),
    });

    if (!existingDecision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = decisionUpdateWithRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { decision, roleId, notes } = parsed.data;

    // Build update object
    const updateData: {
      decision?: "callback" | "no_thanks" | "callback_role";
      roleId?: string | null;
      notes?: string | null;
      decidedBy: string;
      decidedAt: Date;
    } = {
      decidedBy: session.user.id,
      decidedAt: new Date(),
    };

    if (decision !== undefined) {
      updateData.decision = decision;
    }
    if (roleId !== undefined) {
      updateData.roleId = roleId;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const [updated] = await db
      .update(auditionDecisions)
      .set(updateData)
      .where(eq(auditionDecisions.id, decisionId))
      .returning();

    return NextResponse.json({ decision: updated });
  } catch (error) {
    console.error("Error updating decision:", error);
    return NextResponse.json({ error: "Failed to update decision" }, { status: 500 });
  }
}

/**
 * DELETE /api/auditions/[id]/decisions/[decisionId]
 * Delete a decision (undo) (producer only)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; decisionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, decisionId } = await params;

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

    // Delete the decision
    const [deleted] = await db
      .delete(auditionDecisions)
      .where(
        and(eq(auditionDecisions.id, decisionId), eq(auditionDecisions.auditionId, auditionId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting decision:", error);
    return NextResponse.json({ error: "Failed to delete decision" }, { status: 500 });
  }
}
