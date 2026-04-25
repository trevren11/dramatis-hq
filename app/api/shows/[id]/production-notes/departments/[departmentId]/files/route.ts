import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  productionFiles,
  productionActivity,
  ALLOWED_PRODUCTION_FILE_TYPES,
  MAX_PRODUCTION_FILE_SIZE,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSignedUploadUrl } from "@/lib/storage";

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

    const files = await db.query.productionFiles.findMany({
      where: eq(productionFiles.departmentId, departmentId),
      orderBy: [desc(productionFiles.createdAt)],
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
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

    const body = (await request.json()) as {
      name: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      folderId?: string | null;
      noteId?: string | null;
    };

    if (!body.name || !body.originalFilename || !body.mimeType || !body.fileSize) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      !ALLOWED_PRODUCTION_FILE_TYPES.includes(
        body.mimeType as (typeof ALLOWED_PRODUCTION_FILE_TYPES)[number]
      )
    ) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (body.fileSize > MAX_PRODUCTION_FILE_SIZE) {
      const maxSizeMB = String(MAX_PRODUCTION_FILE_SIZE / 1024 / 1024);
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    const s3Key = `production-files/${showId}/${departmentId}/${crypto.randomUUID()}-${body.originalFilename}`;
    const isImage = body.mimeType.startsWith("image/");
    const isPdf = body.mimeType === "application/pdf";

    const [file] = await db
      .insert(productionFiles)
      .values({
        departmentId,
        name: body.name,
        originalFilename: body.originalFilename,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        s3Key,
        folderId: body.folderId,
        noteId: body.noteId,
        isImage,
        isPdf,
        uploadedBy: session.user.id,
      })
      .returning();

    if (!file) {
      return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
    }

    const uploadUrl = await getSignedUploadUrl(s3Key, "document", body.mimeType);

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "file_uploaded",
      entityId: file.id,
      entityType: "file",
      description: `Uploaded file "${body.name}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ file, uploadUrl }, { status: 201 });
  } catch (error) {
    console.error("Error creating file record:", error);
    return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
  }
}
