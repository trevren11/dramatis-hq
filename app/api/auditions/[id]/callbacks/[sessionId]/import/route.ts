import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  auditionFormResponses,
  auditionApplications,
  producerProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/import
 * Import talent from initial audition check-ins (those marked for callback)
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

    const body = (await request.json()) as {
      source?: "checkins" | "applications";
      roleId?: string;
    };
    const source = body.source ?? "applications";

    let talentToImport: { talentProfileId: string; roleId?: string }[] = [];

    if (source === "checkins") {
      const checkins = await db.query.auditionFormResponses.findMany({
        where: eq(auditionFormResponses.auditionId, auditionId),
      });

      talentToImport = checkins.map((c) => ({
        talentProfileId: c.talentProfileId,
        roleId: body.roleId,
      }));
    } else {
      const applications = await db.query.auditionApplications.findMany({
        where: and(
          eq(auditionApplications.auditionId, auditionId),
          eq(auditionApplications.status, "callback")
        ),
      });

      talentToImport = applications.map((a) => ({
        talentProfileId: a.talentProfileId,
        roleId: body.roleId,
      }));
    }

    const existingInvitations = await db.query.callbackInvitations.findMany({
      where: eq(callbackInvitations.callbackSessionId, sessionId),
    });

    const existingTalentIds = new Set(existingInvitations.map((i) => i.talentProfileId));

    const newInvitations = talentToImport.filter((t) => !existingTalentIds.has(t.talentProfileId));

    if (newInvitations.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: talentToImport.length,
        message: "All talent already invited",
      });
    }

    const created = await db
      .insert(callbackInvitations)
      .values(
        newInvitations.map((inv) => ({
          callbackSessionId: sessionId,
          talentProfileId: inv.talentProfileId,
          roleId: inv.roleId,
        }))
      )
      .returning();

    return NextResponse.json({
      imported: created.length,
      skipped: talentToImport.length - newInvitations.length,
      invitations: created,
    });
  } catch (error) {
    console.error("Error importing callbacks:", error);
    return NextResponse.json({ error: "Failed to import callbacks" }, { status: 500 });
  }
}
