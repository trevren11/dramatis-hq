import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, productionFiles, productionActivity } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSignedDownloadUrl, deleteFile } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string; fileId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, fileId } = await params;

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

    const file = await db.query.productionFiles.findFirst({
      where: and(eq(productionFiles.id, fileId), eq(productionFiles.departmentId, departmentId)),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const downloadUrl = await getSignedDownloadUrl(file.s3Key, "document");

    return NextResponse.json({ file, downloadUrl });
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, fileId } = await params;

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

    const file = await db.query.productionFiles.findFirst({
      where: and(eq(productionFiles.id, fileId), eq(productionFiles.departmentId, departmentId)),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await deleteFile(file.s3Key, "document");

    if (file.thumbnailS3Key) {
      await deleteFile(file.thumbnailS3Key, "document");
    }

    await db.delete(productionFiles).where(eq(productionFiles.id, fileId));

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "file_deleted",
      entityId: fileId,
      entityType: "file",
      description: `Deleted file "${file.name}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
