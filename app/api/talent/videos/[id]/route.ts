import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, videoSamples } from "@/lib/db/schema";
import { videoSampleUpdateSchema } from "@/lib/validations/video-samples";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
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

    const video = await db.query.videoSamples.findFirst({
      where: and(eq(videoSamples.id, id), eq(videoSamples.talentProfileId, profile.id)),
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
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

    const existingVideo = await db.query.videoSamples.findFirst({
      where: and(eq(videoSamples.id, id), eq(videoSamples.talentProfileId, profile.id)),
    });

    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = videoSampleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // If setting this video as featured, unset any other featured video
    if (parsed.data.isFeatured === true) {
      await db
        .update(videoSamples)
        .set({ isFeatured: false, updatedAt: new Date() })
        .where(
          and(eq(videoSamples.talentProfileId, profile.id), eq(videoSamples.isFeatured, true))
        );
    }

    const [updatedVideo] = await db
      .update(videoSamples)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(videoSamples.id, id))
      .returning();

    return NextResponse.json({ video: updatedVideo });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
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

    const video = await db.query.videoSamples.findFirst({
      where: and(eq(videoSamples.id, id), eq(videoSamples.talentProfileId, profile.id)),
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete the video file from storage if it was uploaded
    if (video.sourceType === "upload" && video.processedUrl) {
      try {
        // Extract key from URL
        const urlParts = video.processedUrl.split("/");
        const key = urlParts.slice(-2).join("/"); // userId/timestamp-filename
        await deleteFile(key, "video");
      } catch (storageError) {
        console.error("Error deleting video file from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    await db.delete(videoSamples).where(eq(videoSamples.id, id));

    // If deleted video was featured, make the first remaining video featured
    if (video.isFeatured) {
      const remainingVideos = await db.query.videoSamples.findMany({
        where: eq(videoSamples.talentProfileId, profile.id),
        orderBy: (videoSamples, { asc }) => [asc(videoSamples.sortOrder)],
        limit: 1,
      });

      if (remainingVideos.length > 0 && remainingVideos[0]) {
        await db
          .update(videoSamples)
          .set({ isFeatured: true, updatedAt: new Date() })
          .where(eq(videoSamples.id, remainingVideos[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
