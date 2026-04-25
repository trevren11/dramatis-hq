import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { showMembers, shows, users, SHOW_ROLE_VALUES } from "@/lib/db/schema";
import { canManageStaff, logPermissionChange, hasPermission, PERMISSIONS } from "@/lib/permissions";
import { eq, and, desc } from "drizzle-orm";

const changeShowRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(SHOW_ROLE_VALUES),
});

const removeMemberSchema = z.object({
  memberId: z.string().uuid(),
});

// List all members of a show
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

    // Check if user has access to view show
    const canView = await hasPermission(session.user.id, PERMISSIONS.SHOW_VIEW, showId);
    if (!canView.allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get show details
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
      columns: { id: true, title: true, organizationId: true },
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // Get all members
    const members = await db.query.showMembers.findMany({
      where: eq(showMembers.showId, showId),
      orderBy: [desc(showMembers.acceptedAt)],
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

    return NextResponse.json({
      members: memberDetails,
      show: {
        id: show.id,
        title: show.title,
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

    const { id: showId } = await params;

    // Check if user can manage staff
    const canManage = await canManageStaff(session.user.id, showId);
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = changeShowRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { memberId, role } = parsed.data;

    // Find the member
    const member = await db.query.showMembers.findFirst({
      where: and(eq(showMembers.id, memberId), eq(showMembers.showId, showId)),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const oldRole = member.role;

    // Update the member's role
    const [updated] = await db
      .update(showMembers)
      .set({ role, updatedAt: new Date() })
      .where(eq(showMembers.id, memberId))
      .returning();

    // Log the change
    await logPermissionChange({
      userId: member.userId,
      action: "change_role",
      targetType: "show",
      targetId: showId,
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

// Remove a member from the show
export async function DELETE(
  request: Request,
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
    const member = await db.query.showMembers.findFirst({
      where: and(eq(showMembers.id, memberId), eq(showMembers.showId, showId)),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Delete the member
    await db.delete(showMembers).where(eq(showMembers.id, memberId));

    // Log the removal
    await logPermissionChange({
      userId: member.userId,
      action: "remove",
      targetType: "show",
      targetId: showId,
      oldRole: member.role,
      performedBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
