import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  talentProfiles,
  producerProfiles,
  users,
  headshots,
} from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks/[sessionId]/checkin
 * Get callback day check-in queue
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
      orderBy: [asc(callbackInvitations.queueNumber)],
    });

    const queue = await Promise.all(
      invitations
        .filter((inv) => inv.checkedInAt)
        .map(async (inv) => {
          const talent = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.id, inv.talentProfileId),
          });

          let email = "";
          let headshotUrl = null;

          if (talent) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, talent.userId),
            });
            email = user?.email ?? "";

            const headshot = await db.query.headshots.findFirst({
              where: and(eq(headshots.talentProfileId, talent.id), eq(headshots.isPrimary, true)),
            });
            headshotUrl = headshot?.url ?? null;
          }

          return {
            id: inv.id,
            queueNumber: inv.queueNumber,
            checkedInAt: inv.checkedInAt,
            scheduledTime: inv.scheduledTime,
            talent: talent
              ? {
                  id: talent.id,
                  name: `${talent.firstName} ${talent.lastName}`,
                  email,
                  headshotUrl,
                }
              : null,
          };
        })
    );

    const checkedInCount = invitations.filter((i) => i.checkedInAt).length;
    const notCheckedInCount = invitations.filter((i) => !i.checkedInAt).length;

    return NextResponse.json({
      session: callbackSession,
      queue,
      counts: {
        total: invitations.length,
        checkedIn: checkedInCount,
        notCheckedIn: notCheckedInCount,
      },
    });
  } catch (error) {
    console.error("Error fetching callback check-in queue:", error);
    return NextResponse.json({ error: "Failed to fetch check-in queue" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/checkin
 * Check in a talent for callback (by talent themselves)
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;

    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!talentProfile) {
      return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
    }

    const callbackSession = await db.query.callbackSessions.findFirst({
      where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
    });

    if (!callbackSession) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    if (callbackSession.status !== "scheduled" && callbackSession.status !== "in_progress") {
      return NextResponse.json(
        { error: "Callback session is not open for check-in" },
        { status: 400 }
      );
    }

    const invitation = await db.query.callbackInvitations.findFirst({
      where: and(
        eq(callbackInvitations.callbackSessionId, sessionId),
        eq(callbackInvitations.talentProfileId, talentProfile.id)
      ),
    });

    if (!invitation) {
      return NextResponse.json({ error: "You are not invited to this callback" }, { status: 403 });
    }

    if (invitation.checkedInAt) {
      return NextResponse.json(
        {
          error: "Already checked in",
          checkin: {
            queueNumber: invitation.queueNumber,
            checkedInAt: invitation.checkedInAt,
          },
        },
        { status: 400 }
      );
    }

    // Get next queue number
    const maxQueueResult = (await db.execute(sql`
      SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue
      FROM callback_invitations
      WHERE callback_session_id = ${sessionId}
    `)) as { next_queue: number }[];
    const queueNumber = maxQueueResult[0]?.next_queue ?? 1;

    const [updated] = await db
      .update(callbackInvitations)
      .set({
        checkedInAt: new Date(),
        queueNumber,
        updatedAt: new Date(),
      })
      .where(eq(callbackInvitations.id, invitation.id))
      .returning();

    return NextResponse.json({
      checkin: {
        queueNumber: updated?.queueNumber,
        checkedInAt: updated?.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Error checking in:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
