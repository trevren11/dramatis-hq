import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  productionNotes,
  productionFiles,
  productionFolders,
  departmentMembers,
} from "@/lib/db/schema";
import { departmentUpdateSchema } from "@/lib/validations/production-notes";
import { eq, and, asc, desc } from "drizzle-orm";

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

    const department = await db.query.productionDepartments.findFirst({
      where: and(
        eq(productionDepartments.id, departmentId),
        eq(productionDepartments.showId, showId)
      ),
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const [notes, files, folders, members] = await Promise.all([
      db.query.productionNotes.findMany({
        where: eq(productionNotes.departmentId, departmentId),
        orderBy: [desc(productionNotes.isPinned), desc(productionNotes.updatedAt)],
      }),
      db.query.productionFiles.findMany({
        where: eq(productionFiles.departmentId, departmentId),
        orderBy: [desc(productionFiles.createdAt)],
      }),
      db.query.productionFolders.findMany({
        where: eq(productionFolders.departmentId, departmentId),
        orderBy: [asc(productionFolders.sortOrder)],
      }),
      db.query.departmentMembers.findMany({
        where: eq(departmentMembers.departmentId, departmentId),
      }),
    ]);

    return NextResponse.json({
      department,
      notes,
      files,
      folders,
      members,
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const existingDepartment = await db.query.productionDepartments.findFirst({
      where: and(
        eq(productionDepartments.id, departmentId),
        eq(productionDepartments.showId, showId)
      ),
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = departmentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [department] = await db
      .update(productionDepartments)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(productionDepartments.id, departmentId))
      .returning();

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    await db.delete(productionDepartments).where(eq(productionDepartments.id, departmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
