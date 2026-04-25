/* eslint-disable complexity */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  scripts,
  ALLOWED_SCRIPT_TYPES,
  MAX_SCRIPT_SIZE,
} from "@/lib/db/schema";
import { scriptUploadSchema } from "@/lib/validations/materials";
import { eq, desc, and } from "drizzle-orm";
import { uploadFile, generateKey } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const showScripts = await db.query.scripts.findMany({
      where: eq(scripts.showId, showId),
      orderBy: [desc(scripts.version)],
    });

    return NextResponse.json({ scripts: showScripts });
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadata = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_SCRIPT_TYPES.includes(file.type as (typeof ALLOWED_SCRIPT_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SCRIPT_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${String(MAX_SCRIPT_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid metadata format" }, { status: 400 });
      }
    }

    const parsed = scriptUploadSchema.safeParse(parsedMetadata);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get next version number
    const existingScripts = await db.query.scripts.findMany({
      where: eq(scripts.showId, showId),
      orderBy: [desc(scripts.version)],
    });

    const nextVersion = existingScripts.length > 0 ? (existingScripts[0]?.version ?? 0) + 1 : 1;

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateKey(showId, `script-v${String(nextVersion)}-${file.name}`, "document");

    const uploadResult = await uploadFile({
      buffer,
      key,
      type: "document",
      contentType: file.type,
      metadata: {
        showId,
        version: String(nextVersion),
        uploadedBy: session.user.id,
      },
    });

    // If this is the new active script, deactivate others
    if (parsed.data.isActive) {
      await db
        .update(scripts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(scripts.showId, showId));
    }

    // Create script record
    const [script] = await db
      .insert(scripts)
      .values({
        showId,
        version: nextVersion,
        isActive: parsed.data.isActive,
        filename: file.name,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key: uploadResult.key,
        title: parsed.data.title,
        revisionNotes: parsed.data.revisionNotes,
        uploadedBy: session.user.id,
      })
      .returning();

    if (!script) {
      return NextResponse.json({ error: "Failed to create script record" }, { status: 500 });
    }

    return NextResponse.json({ script }, { status: 201 });
  } catch (error) {
    console.error("Error uploading script:", error);
    return NextResponse.json({ error: "Failed to upload script" }, { status: 500 });
  }
}

// Set active version
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const body = (await request.json()) as { scriptId?: string };

    if (!body.scriptId) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    // Verify script belongs to this show
    const script = await db.query.scripts.findFirst({
      where: and(eq(scripts.id, body.scriptId), eq(scripts.showId, showId)),
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Deactivate all scripts for this show
    await db
      .update(scripts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(scripts.showId, showId));

    // Activate the selected script
    const [updatedScript] = await db
      .update(scripts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(scripts.id, body.scriptId))
      .returning();

    return NextResponse.json({ script: updatedScript });
  } catch (error) {
    console.error("Error setting active script:", error);
    return NextResponse.json({ error: "Failed to set active script" }, { status: 500 });
  }
}
