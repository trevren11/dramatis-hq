import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  departmentMembers,
  users,
} from "@/lib/db/schema";
import { memberAddSchema } from "@/lib/validations/production-notes";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await db
      .select({
        id: departmentMembers.id,
        departmentId: departmentMembers.departmentId,
        userId: departmentMembers.userId,
        role: departmentMembers.role,
        canEdit: departmentMembers.canEdit,
        canDelete: departmentMembers.canDelete,
        canManageFiles: departmentMembers.canManageFiles,
        createdAt: departmentMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(departmentMembers)
      .leftJoin(users, eq(departmentMembers.userId, users.id))
      .where(eq(departmentMembers.departmentId, departmentId));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const department = await db.query.productionDepartments.findFirst({
      where: and(
        eq(productionDepartments.id, departmentId),
        eq(productionDepartments.showId, showId)
      ),
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = memberAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingMember = await db.query.departmentMembers.findFirst({
      where: and(
        eq(departmentMembers.departmentId, departmentId),
        eq(departmentMembers.userId, parsed.data.userId)
      ),
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const [member] = await db
      .insert(departmentMembers)
      .values({
        departmentId,
        userId: parsed.data.userId,
        role: parsed.data.role,
        canEdit: parsed.data.canEdit,
        canDelete: parsed.data.canDelete,
        canManageFiles: parsed.data.canManageFiles,
        addedBy: session.user.id,
      })
      .returning();

    if (!member) {
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
