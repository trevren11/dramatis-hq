import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizationMembers, producerProfiles, users } from "@/lib/db/schema";
import { changeOrganizationRoleSchema, removeMemberSchema } from "@/lib/validations/staff";
import { canManageStaff, logPermissionChange, PERMISSIONS, hasPermission } from "@/lib/permissions";
import { eq, and, desc } from "drizzle-orm";

// List all members of an organization
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

    // Check if user has access to view members
    const canView = await hasPermission(session.user.id, PERMISSIONS.ORG_VIEW_ALL_SHOWS, undefined);

    // Also check direct organization membership
    const canManage = await canManageStaff(session.user.id, undefined, organizationId);

    if (!canView.allowed && !canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get organization owner
    const organization = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.id, organizationId),
      with: {
        user: {
          columns: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get all members
    const members = await db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, organizationId),
      orderBy: [desc(organizationMembers.acceptedAt)],
    });

    // Get user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, member.userId),
          columns: { id: true, name: true, email: true, image: true },
        });
        return {
          ...member,
          user,
        };
      })
    );

    // Include the owner as a member
    const owner = {
      id: "owner",
      organizationId,
      userId: organization.userId,
      role: "owner" as const,
      invitedBy: null,
      invitedAt: organization.createdAt,
      acceptedAt: organization.createdAt,
      createdAt: organization.createdAt,
      updatedAt: organization.createdAt,
      user: organization.user,
      isOwner: true,
    };

    return NextResponse.json({
      members: [owner, ...memberDetails.map((m) => ({ ...m, isOwner: false }))],
      organization: {
        id: organization.id,
        companyName: organization.companyName,
      },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// Update a member's role
export async function PUT(
  request: Request,
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

    const body: unknown = await request.json();
    const parsed = changeOrganizationRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { memberId, role } = parsed.data;

    // Cannot change owner role
    if (role === "owner") {
      return NextResponse.json(
        { error: "Cannot assign owner role. Use ownership transfer instead." },
        { status: 400 }
      );
    }

    // Find the member
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const oldRole = member.role;

    // Update the member's role
    const [updated] = await db
      .update(organizationMembers)
      .set({ role, updatedAt: new Date() })
      .where(eq(organizationMembers.id, memberId))
      .returning();

    // Log the change
    await logPermissionChange({
      userId: member.userId,
      action: "change_role",
      targetType: "organization",
      targetId: organizationId,
      oldRole,
      newRole: role,
      performedBy: session.user.id,
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// Remove a member from the organization
export async function DELETE(
  request: Request,
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

    const body: unknown = await request.json();
    const parsed = removeMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { memberId } = parsed.data;

    // Find the member
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove oneself if you're the one managing
    if (member.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Delete the member
    await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId));

    // Log the removal
    await logPermissionChange({
      userId: member.userId,
      action: "remove",
      targetType: "organization",
      targetId: organizationId,
      oldRole: member.role,
      performedBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
