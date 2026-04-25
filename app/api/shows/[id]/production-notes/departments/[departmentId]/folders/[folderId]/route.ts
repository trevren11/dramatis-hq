import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, productionFolders, productionActivity } from "@/lib/db/schema";
import { folderUpdateSchema } from "@/lib/validations/production-notes";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string; folderId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, folderId } = await params;

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

    const existingFolder = await db.query.productionFolders.findFirst({
      where: and(
        eq(productionFolders.id, folderId),
        eq(productionFolders.departmentId, departmentId)
      ),
    });

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = folderUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [folder] = await db
      .update(productionFolders)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(productionFolders.id, folderId))
      .returning();

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, folderId } = await params;

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

    const folder = await db.query.productionFolders.findFirst({
      where: and(
        eq(productionFolders.id, folderId),
        eq(productionFolders.departmentId, departmentId)
      ),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    await db.delete(productionFolders).where(eq(productionFolders.id, folderId));

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "folder_deleted",
      entityId: folderId,
      entityType: "folder",
      description: `Deleted folder "${folder.name}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
