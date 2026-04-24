import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionFormResponses } from "@/lib/db/schema";
import { checkinUpdateSchema } from "@/lib/validations/form-builder";
import { eq, and } from "drizzle-orm";

/**
 * PUT /api/auditions/[id]/checkin/[responseId]
 * Update a check-in status (producer only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, responseId } = await params;

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

    // Get the check-in response
    const existingResponse = await db.query.auditionFormResponses.findFirst({
      where: and(
        eq(auditionFormResponses.id, responseId),
        eq(auditionFormResponses.auditionId, auditionId)
      ),
    });

    if (!existingResponse) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = checkinUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, queueNumber } = parsed.data;

    // Update the check-in
    const updateData: Record<string, unknown> = { status };
    if (queueNumber !== undefined) {
      updateData.queueNumber = queueNumber;
    }

    const [updated] = await db
      .update(auditionFormResponses)
      .set(updateData)
      .where(eq(auditionFormResponses.id, responseId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update check-in" }, { status: 500 });
    }

    return NextResponse.json({
      checkin: {
        id: updated.id,
        queueNumber: updated.queueNumber,
        status: updated.status,
        checkedInAt: updated.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Error updating check-in:", error);
    return NextResponse.json({ error: "Failed to update check-in" }, { status: 500 });
  }
}

/**
 * DELETE /api/auditions/[id]/checkin/[responseId]
 * Remove a check-in (producer only)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, responseId } = await params;

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

    // Verify check-in exists for this audition
    const existingResponse = await db.query.auditionFormResponses.findFirst({
      where: and(
        eq(auditionFormResponses.id, responseId),
        eq(auditionFormResponses.auditionId, auditionId)
      ),
    });

    if (!existingResponse) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
    }

    // Delete the check-in
    await db.delete(auditionFormResponses).where(eq(auditionFormResponses.id, responseId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting check-in:", error);
    return NextResponse.json({ error: "Failed to delete check-in" }, { status: 500 });
  }
}
