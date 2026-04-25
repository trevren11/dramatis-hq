import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  auditionDecisions,
  callbackNotes,
  talentProfiles,
  roles,
  producerProfiles,
  auditionFormResponses,
} from "@/lib/db/schema";
import { callbackSessionUpdateSchema } from "@/lib/validations/callbacks";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks/[sessionId]
 * Get callback session details with invitations
 */
export async function GET(
  _request: Request,
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

    const invitations = await db.query.callbackInvitations.findMany({
      where: eq(callbackInvitations.callbackSessionId, sessionId),
    });

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const talent = await db.query.talentProfiles.findFirst({
          where: eq(talentProfiles.id, invitation.talentProfileId),
        });

        const role = invitation.roleId
          ? await db.query.roles.findFirst({
              where: eq(roles.id, invitation.roleId),
            })
          : null;

        const initialCheckin = await db.query.auditionFormResponses.findFirst({
          where: and(
            eq(auditionFormResponses.auditionId, auditionId),
            eq(auditionFormResponses.talentProfileId, invitation.talentProfileId)
          ),
        });

        const previousDecisions = await db.query.auditionDecisions.findMany({
          where: and(
            eq(auditionDecisions.auditionId, auditionId),
            eq(auditionDecisions.talentProfileId, invitation.talentProfileId)
          ),
        });

        const notes = await db.query.callbackNotes.findMany({
          where: and(
            eq(callbackNotes.callbackSessionId, sessionId),
            eq(callbackNotes.talentProfileId, invitation.talentProfileId)
          ),
        });

        return {
          ...invitation,
          talent: talent
            ? {
                id: talent.id,
                name: `${talent.firstName} ${talent.lastName}`,
                email: "", // Would need to join with users table
                headshotUrl: null, // Would need to query headshots
              }
            : null,
          role: role ? { id: role.id, name: role.name } : null,
          initialCheckin: initialCheckin
            ? {
                queueNumber: initialCheckin.queueNumber,
                checkedInAt: initialCheckin.checkedInAt,
              }
            : null,
          previousDecisions,
          notes,
        };
      })
    );

    const roleIds = [...new Set(invitations.map((i) => i.roleId).filter(Boolean))] as string[];
    const rolesData = await Promise.all(
      roleIds.map(async (roleId) => {
        const role = await db.query.roles.findFirst({
          where: eq(roles.id, roleId),
        });
        return role;
      })
    );

    return NextResponse.json({
      session: callbackSession,
      invitations: invitationsWithDetails,
      roles: rolesData.filter(Boolean),
      counts: {
        total: invitations.length,
        checkedIn: invitations.filter((i) => i.checkedInAt).length,
        emailSent: invitations.filter((i) => i.emailSentAt).length,
      },
    });
  } catch (error) {
    console.error("Error fetching callback session:", error);
    return NextResponse.json({ error: "Failed to fetch callback session" }, { status: 500 });
  }
}

/**
 * PUT /api/auditions/[id]/callbacks/[sessionId]
 * Update callback session
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

    const body: unknown = await request.json();
    const parsed = callbackSessionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(callbackSessions)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Error updating callback session:", error);
    return NextResponse.json({ error: "Failed to update callback session" }, { status: 500 });
  }
}

/**
 * DELETE /api/auditions/[id]/callbacks/[sessionId]
 * Delete callback session
 */
export async function DELETE(
  _request: Request,
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

    const [deleted] = await db
      .delete(callbackSessions)
      .where(and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting callback session:", error);
    return NextResponse.json({ error: "Failed to delete callback session" }, { status: 500 });
  }
}
