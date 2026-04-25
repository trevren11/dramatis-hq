import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  talentProfiles,
  roles,
  producerProfiles,
  users,
  headshots,
} from "@/lib/db/schema";
import {
  callbackInvitationCreateSchema,
  callbackInvitationBulkCreateSchema,
} from "@/lib/validations/callbacks";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks/[sessionId]/invitations
 * List invitations for a callback session
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
    const roleId = url.searchParams.get("roleId");
    const groupByRole = url.searchParams.get("groupByRole") === "true";

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

    const invitationsQuery = db.query.callbackInvitations.findMany({
      where: roleId
        ? and(
            eq(callbackInvitations.callbackSessionId, sessionId),
            eq(callbackInvitations.roleId, roleId)
          )
        : eq(callbackInvitations.callbackSessionId, sessionId),
    });

    const invitations = await invitationsQuery;

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const talent = await db.query.talentProfiles.findFirst({
          where: eq(talentProfiles.id, invitation.talentProfileId),
        });

        let email = "";
        if (talent) {
          const user = await db.query.users.findFirst({
            where: eq(users.id, talent.userId),
          });
          email = user?.email ?? "";
        }

        let headshotUrl = null;
        if (talent) {
          const headshot = await db.query.headshots.findFirst({
            where: and(eq(headshots.talentProfileId, talent.id), eq(headshots.isPrimary, true)),
          });
          headshotUrl = headshot?.url ?? null;
        }

        const role = invitation.roleId
          ? await db.query.roles.findFirst({
              where: eq(roles.id, invitation.roleId),
            })
          : null;

        return {
          ...invitation,
          talent: talent
            ? {
                id: talent.id,
                name: `${talent.firstName} ${talent.lastName}`,
                email,
                headshotUrl,
              }
            : null,
          role: role ? { id: role.id, name: role.name } : null,
        };
      })
    );

    if (groupByRole) {
      const grouped: Record<string, typeof invitationsWithDetails> = {};
      const noRole: typeof invitationsWithDetails = [];

      for (const inv of invitationsWithDetails) {
        if (!inv.role) {
          noRole.push(inv);
          continue;
        }
        const roleId = inv.role.id;
        grouped[roleId] ??= [];
        grouped[roleId].push(inv);
      }

      return NextResponse.json({
        groupedByRole: grouped,
        noRole,
        total: invitationsWithDetails.length,
      });
    }

    return NextResponse.json({
      invitations: invitationsWithDetails,
      total: invitationsWithDetails.length,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/invitations
 * Create invitation(s) - supports single or bulk
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

    const body: unknown = await request.json();

    const bodyObj = body as Record<string, unknown>;
    // Check if bulk or single
    if (Array.isArray(bodyObj.invitations)) {
      const parsed = callbackInvitationBulkCreateSchema.safeParse({
        ...bodyObj,
        callbackSessionId: sessionId,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const createdInvitations = await db
        .insert(callbackInvitations)
        .values(
          parsed.data.invitations.map((inv) => ({
            callbackSessionId: sessionId,
            talentProfileId: inv.talentProfileId,
            roleId: inv.roleId,
            scheduledDate: inv.scheduledDate,
            scheduledTime: inv.scheduledTime,
            timeSlotId: inv.timeSlotId,
          }))
        )
        .returning();

      return NextResponse.json({ invitations: createdInvitations }, { status: 201 });
    } else {
      const parsed = callbackInvitationCreateSchema.safeParse({
        ...bodyObj,
        callbackSessionId: sessionId,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      // Check if already invited
      const existing = await db.query.callbackInvitations.findFirst({
        where: and(
          eq(callbackInvitations.callbackSessionId, sessionId),
          eq(callbackInvitations.talentProfileId, parsed.data.talentProfileId)
        ),
      });

      if (existing) {
        return NextResponse.json(
          { error: "Talent already invited to this callback" },
          { status: 400 }
        );
      }

      const [invitation] = await db
        .insert(callbackInvitations)
        .values({
          callbackSessionId: sessionId,
          talentProfileId: parsed.data.talentProfileId,
          roleId: parsed.data.roleId,
          scheduledDate: parsed.data.scheduledDate,
          scheduledTime: parsed.data.scheduledTime,
          timeSlotId: parsed.data.timeSlotId,
        })
        .returning();

      return NextResponse.json({ invitation }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
