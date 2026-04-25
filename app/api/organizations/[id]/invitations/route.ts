import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitations, producerProfiles } from "@/lib/db/schema";
import { createOrganizationInvitationSchema } from "@/lib/validations/staff";
import { canManageStaff, logPermissionChange } from "@/lib/permissions";
import { generateSecureToken } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// List pending invitations for an organization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if user can manage staff
    const canManage = await canManageStaff(session.user.id, undefined, organizationId);
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get pending invitations
    const pendingInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.targetId, organizationId),
        eq(invitations.type, "organization"),
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

    const { id: organizationId } = await params;

    // Verify organization exists
    const organization = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.id, organizationId),
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if user can manage staff
    const canManage = await canManageStaff(session.user.id, undefined, organizationId);
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = createOrganizationInvitationSchema.safeParse(body);

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
        eq(invitations.targetId, organizationId),
        eq(invitations.type, "organization"),
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

    // Create invitation
    const [invitation] = await db
      .insert(invitations)
      .values({
        email: email.toLowerCase(),
        type: "organization",
        targetId: organizationId,
        role,
        token,
        expiresAt,
        invitedBy: session.user.id,
      })
      .returning();

    // Log the action
    await logPermissionChange({
      action: "invite",
      targetType: "organization",
      targetId: organizationId,
      newRole: role,
      metadata: { email: email.toLowerCase() },
      performedBy: session.user.id,
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, organization.companyName, role);

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
