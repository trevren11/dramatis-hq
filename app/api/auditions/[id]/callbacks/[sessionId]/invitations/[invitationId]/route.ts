import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditions, callbackInvitations, producerProfiles } from "@/lib/db/schema";
import { callbackInvitationUpdateSchema } from "@/lib/validations/callbacks";
import { eq, and } from "drizzle-orm";

/**
 * PUT /api/auditions/[id]/callbacks/[sessionId]/invitations/[invitationId]
 * Update an invitation
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string; invitationId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId, invitationId } = await params;

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

    const body: unknown = await request.json();
    const parsed = callbackInvitationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(callbackInvitations)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(callbackInvitations.id, invitationId),
          eq(callbackInvitations.callbackSessionId, sessionId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({ invitation: updated });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 });
  }
}

/**
 * DELETE /api/auditions/[id]/callbacks/[sessionId]/invitations/[invitationId]
 * Remove an invitation
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string; invitationId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId, invitationId } = await params;

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

    const [deleted] = await db
      .delete(callbackInvitations)
      .where(
        and(
          eq(callbackInvitations.id, invitationId),
          eq(callbackInvitations.callbackSessionId, sessionId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 });
  }
}
