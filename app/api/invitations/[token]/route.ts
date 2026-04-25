import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  invitations,
  organizationMembers,
  showMembers,
  users,
  producerProfiles,
  shows,
  type OrganizationRole,
  type ShowRole,
} from "@/lib/db/schema";
import { logPermissionChange } from "@/lib/permissions";
import { eq } from "drizzle-orm";

// Get invitation details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params;

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Don't expose the token in the response
    const { token: _token, ...safeInvitation } = invitation;

    // Get inviter info
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, invitation.invitedBy),
      columns: { name: true, email: true },
    });

    // Get target name
    let targetName: string | undefined;
    if (invitation.type === "organization") {
      const org = await db.query.producerProfiles.findFirst({
        where: eq(producerProfiles.id, invitation.targetId),
        columns: { companyName: true },
      });
      targetName = org?.companyName;
    } else {
      const show = await db.query.shows.findFirst({
        where: eq(shows.id, invitation.targetId),
        columns: { title: true },
      });
      targetName = show?.title;
    }

    return NextResponse.json({
      invitation: { ...safeInvitation, targetName },
      inviter,
      isExpired: invitation.expiresAt < new Date(),
      isAlreadyResponded: invitation.status !== "pending",
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}

// Accept or decline invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || !("accept" in body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { accept } = body as { accept: boolean };

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been responded to" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await db
        .update(invitations)
        .set({ status: "expired" })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    // Check if the user's email matches the invitation
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { email: true },
    });

    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      );
    }

    const now = new Date();

    if (accept) {
      // Accept the invitation
      if (invitation.type === "organization") {
        // Create organization membership
        await db.insert(organizationMembers).values({
          organizationId: invitation.targetId,
          userId: session.user.id,
          role: invitation.role as OrganizationRole,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.invitedAt,
          acceptedAt: now,
        });

        // Log the acceptance
        await logPermissionChange({
          userId: session.user.id,
          action: "invitation_accepted",
          targetType: "organization",
          targetId: invitation.targetId,
          newRole: invitation.role,
          performedBy: session.user.id,
        });
      } else {
        // Create show membership
        await db.insert(showMembers).values({
          showId: invitation.targetId,
          userId: session.user.id,
          role: invitation.role as ShowRole,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.invitedAt,
          acceptedAt: now,
        });

        // Log the acceptance
        await logPermissionChange({
          userId: session.user.id,
          action: "invitation_accepted",
          targetType: "show",
          targetId: invitation.targetId,
          newRole: invitation.role,
          performedBy: session.user.id,
        });
      }

      // Update invitation status
      await db
        .update(invitations)
        .set({
          status: "accepted",
          acceptedAt: now,
          respondedBy: session.user.id,
        })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json({
        success: true,
        message: "Invitation accepted successfully",
      });
    } else {
      // Decline the invitation
      await db
        .update(invitations)
        .set({
          status: "declined",
          respondedBy: session.user.id,
        })
        .where(eq(invitations.id, invitation.id));

      // Log the decline
      await logPermissionChange({
        userId: session.user.id,
        action: "invitation_declined",
        targetType: invitation.type,
        targetId: invitation.targetId,
        performedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        message: "Invitation declined",
      });
    }
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json({ error: "Failed to respond to invitation" }, { status: 500 });
  }
}

// Delete/cancel invitation (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if the user who invited can cancel (or org admin)
    if (invitation.invitedBy !== session.user.id) {
      // TODO: Check if user is org/show admin
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.delete(invitations).where(eq(invitations.id, invitation.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invitation:", error);
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
  }
}
