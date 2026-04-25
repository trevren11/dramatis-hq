import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  productionFolders,
  productionActivity,
} from "@/lib/db/schema";
import { folderCreateSchema } from "@/lib/validations/production-notes";
import { eq, and, asc } from "drizzle-orm";

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

    const folders = await db.query.productionFolders.findMany({
      where: eq(productionFolders.departmentId, departmentId),
      orderBy: [asc(productionFolders.sortOrder), asc(productionFolders.name)],
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
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
    const parsed = folderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [folder] = await db
      .insert(productionFolders)
      .values({
        departmentId,
        name: parsed.data.name,
        parentFolderId: parsed.data.parentFolderId,
        sortOrder: parsed.data.sortOrder,
        createdBy: session.user.id,
      })
      .returning();

    if (!folder) {
      return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "folder_created",
      entityId: folder.id,
      entityType: "folder",
      description: `Created folder "${folder.name}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
