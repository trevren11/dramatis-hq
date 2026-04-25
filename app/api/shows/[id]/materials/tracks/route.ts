import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  minusTracks,
  ALLOWED_AUDIO_TYPES,
  MAX_AUDIO_SIZE,
} from "@/lib/db/schema";
import { minusTrackUploadSchema, minusTrackReorderSchema } from "@/lib/validations/materials";
import { eq, asc } from "drizzle-orm";
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

    const tracks = await db.query.minusTracks.findMany({
      where: eq(minusTracks.showId, showId),
      orderBy: [asc(minusTracks.sortOrder), asc(minusTracks.trackNumber), asc(minusTracks.title)],
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
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
    if (!ALLOWED_AUDIO_TYPES.includes(file.type as (typeof ALLOWED_AUDIO_TYPES)[number])) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only MP3, WAV, M4A, and AAC files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${String(MAX_AUDIO_SIZE / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    let parsedMetadata = { title: file.name.replace(/\.[^/.]+$/, "") };
    if (metadata) {
      try {
        const metaObj = JSON.parse(metadata) as Record<string, unknown>;
        parsedMetadata = { ...parsedMetadata, ...metaObj };
      } catch {
        return NextResponse.json({ error: "Invalid metadata format" }, { status: 400 });
      }
    }

    const parsed = minusTrackUploadSchema.safeParse(parsedMetadata);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get next sort order
    const existingTracks = await db.query.minusTracks.findMany({
      where: eq(minusTracks.showId, showId),
    });

    const nextSortOrder = existingTracks.length;

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateKey(showId, `track-${file.name}`, "document");

    const uploadResult = await uploadFile({
      buffer,
      key,
      type: "document",
      contentType: file.type,
      metadata: {
        showId,
        title: parsed.data.title,
        uploadedBy: session.user.id,
      },
    });

    // Create track record
    const [track] = await db
      .insert(minusTracks)
      .values({
        showId,
        title: parsed.data.title,
        act: parsed.data.act,
        scene: parsed.data.scene,
        trackNumber: parsed.data.trackNumber,
        originalKey: parsed.data.originalKey,
        tempo: parsed.data.tempo,
        notes: parsed.data.notes,
        filename: file.name,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key: uploadResult.key,
        duration: parsed.data.duration,
        sortOrder: nextSortOrder,
        uploadedBy: session.user.id,
      })
      .returning();

    if (!track) {
      return NextResponse.json({ error: "Failed to create track record" }, { status: 500 });
    }

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error("Error uploading track:", error);
    return NextResponse.json({ error: "Failed to upload track" }, { status: 500 });
  }
}

// Reorder tracks
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

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = minusTrackReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Update sort orders
    await Promise.all(
      parsed.data.tracks.map(({ id, sortOrder }) =>
        db
          .update(minusTracks)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(minusTracks.id, id))
      )
    );

    // Fetch updated tracks
    const tracks = await db.query.minusTracks.findMany({
      where: eq(minusTracks.showId, showId),
      orderBy: [asc(minusTracks.sortOrder)],
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error reordering tracks:", error);
    return NextResponse.json({ error: "Failed to reorder tracks" }, { status: 500 });
  }
}
