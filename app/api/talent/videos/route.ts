import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, videoSamples, MAX_VIDEO_SAMPLES } from "@/lib/db/schema";
import {
  videoSampleUploadSchema,
  videoSampleExternalSchema,
  videoSampleReorderSchema,
  extractYouTubeId,
  getYouTubeThumbnailUrl,
} from "@/lib/validations/video-samples";
import { eq, asc, count } from "drizzle-orm";
import type { VideoSampleUpload, VideoSampleExternal } from "@/lib/validations/video-samples";
import type { TalentProfile } from "@/lib/db/schema/talent-profiles";

type ParsedVideoData = VideoSampleUpload | VideoSampleExternal;

interface VideoInsertValues {
  talentProfileId: string;
  title: string;
  description: string | null;
  category: ParsedVideoData["category"];
  tags: string | null;
  visibility: ParsedVideoData["visibility"];
  sourceType: ParsedVideoData["sourceType"];
  sourceUrl: string | null;
  processedUrl: string | null;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  status: "processing" | "ready";
  sortOrder: number;
  isFeatured: boolean;
}

interface BuildVideoParams {
  profile: TalentProfile;
  data: ParsedVideoData;
  thumbnailUrl: string | null;
  currentCount: number;
  hasExistingVideos: boolean;
}

interface UploadMetadata {
  processedUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSize: number | null;
  duration: number | null;
  width: number | null;
  height: number | null;
}

function extractUploadMetadata(data: ParsedVideoData): UploadMetadata {
  if ("url" in data) {
    return {
      processedUrl: data.url,
      originalFilename: data.originalFilename ?? null,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      duration: data.duration ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
    };
  }
  return {
    processedUrl: null,
    originalFilename: null,
    mimeType: null,
    fileSize: null,
    duration: null,
    width: null,
    height: null,
  };
}

function buildVideoInsertValues(params: BuildVideoParams): VideoInsertValues {
  const { profile, data, thumbnailUrl, currentCount, hasExistingVideos } = params;
  const uploadMeta = extractUploadMetadata(data);

  return {
    talentProfileId: profile.id,
    title: data.title,
    description: data.description ?? null,
    category: data.category,
    tags: data.tags ?? null,
    visibility: data.visibility,
    sourceType: data.sourceType,
    sourceUrl: data.sourceUrl ?? null,
    ...uploadMeta,
    thumbnailUrl,
    status: data.sourceType === "upload" ? "processing" : "ready",
    sortOrder: currentCount,
    isFeatured: !hasExistingVideos,
  };
}

function getThumbnailUrl(data: ParsedVideoData): string | null {
  let thumbnailUrl = "thumbnailUrl" in data ? (data.thumbnailUrl ?? null) : null;
  if (data.sourceType === "youtube" && data.sourceUrl) {
    const videoId = extractYouTubeId(data.sourceUrl);
    if (videoId) thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  }
  return thumbnailUrl;
}

function parseVideoBody(
  body: unknown
):
  | ReturnType<typeof videoSampleUploadSchema.safeParse>
  | ReturnType<typeof videoSampleExternalSchema.safeParse> {
  const bodyObj = body as { sourceType?: string };
  if (bodyObj.sourceType === "youtube" || bodyObj.sourceType === "vimeo") {
    return videoSampleExternalSchema.safeParse(body);
  }
  return videoSampleUploadSchema.safeParse(body);
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ videos: [] });
    }

    const videos = await db.query.videoSamples.findMany({
      where: eq(videoSamples.talentProfileId, profile.id),
      orderBy: [asc(videoSamples.sortOrder)],
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check video count limit
    const [countResult] = await db
      .select({ count: count() })
      .from(videoSamples)
      .where(eq(videoSamples.talentProfileId, profile.id));

    const currentCount = countResult?.count ?? 0;
    if (currentCount >= MAX_VIDEO_SAMPLES) {
      return NextResponse.json(
        { error: `Maximum of ${String(MAX_VIDEO_SAMPLES)} videos allowed` },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const parsed = parseVideoBody(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const thumbnailUrl = getThumbnailUrl(data);

    // Check for existing videos to determine featured status
    const existingVideos = await db.query.videoSamples.findFirst({
      where: eq(videoSamples.talentProfileId, profile.id),
    });

    const values = buildVideoInsertValues({
      profile,
      data,
      thumbnailUrl,
      currentCount,
      hasExistingVideos: !!existingVideos,
    });
    const [video] = await db.insert(videoSamples).values(values).returning();

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}

// Reorder videos
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = videoSampleReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Update sort order for each video
    const updates = parsed.data.videoIds.map((videoId, index) =>
      db
        .update(videoSamples)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(videoSamples.id, videoId))
    );

    await Promise.all(updates);

    // Fetch updated videos
    const videos = await db.query.videoSamples.findMany({
      where: eq(videoSamples.talentProfileId, profile.id),
      orderBy: [asc(videoSamples.sortOrder)],
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error reordering videos:", error);
    return NextResponse.json({ error: "Failed to reorder videos" }, { status: 500 });
  }
}
