import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitations, shows, showMembers, users } from "@/lib/db/schema";
import { createShowInviteSchema } from "@/lib/validations/permissions";
import { canManageStaff, logPermissionChange } from "@/lib/permissions";
import { generateSecureToken } from "@/lib/auth/tokens";
import { eq, and, desc } from "drizzle-orm";

// List pending invitations for a show
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

    // Check if user can manage staff
    const canManage = await canManageStaff(session.user.id, showId);
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get pending invitations
    const pendingInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.targetId, showId),
        eq(invitations.type, "show"),
        eq(invitations.status, "pending")
      ),
      orderBy: [desc(invitations.invitedAt)],
    });

    return NextResponse.json({ invitations: pendingInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

// Create a new invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

    // Verify show exists
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Check if user can manage staff
    const canManage = await canManageStaff(session.user.id, showId);
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = createShowInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check for existing pending invitation
    const existingInvitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.email, email.toLowerCase()),
        eq(invitations.targetId, showId),
        eq(invitations.type, "show"),
        eq(invitations.status, "pending")
      ),
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

    // Check if user is already a member
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      const existingMember = await db.query.showMembers.findFirst({
        where: and(eq(showMembers.showId, showId), eq(showMembers.userId, existingUser.id)),
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this show" },
          { status: 400 }
        );
      }
    }

    // Create invitation
    const [invitation] = await db
      .insert(invitations)
      .values({
        email: email.toLowerCase(),
        type: "show",
        targetId: showId,
        role,
        token,
        expiresAt,
        invitedBy: session.user.id,
      })
      .returning();

    // Log the action
    await logPermissionChange({
      action: "invite",
      targetType: "show",
      targetId: showId,
      newRole: role,
      metadata: { email: email.toLowerCase(), showTitle: show.title },
      performedBy: session.user.id,
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, show.title, role);

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
