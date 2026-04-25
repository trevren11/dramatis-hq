/* eslint-disable complexity */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  minusTracks,
  materialPermissions,
  materialAccessLogs,
  castingAssignments,
} from "@/lib/db/schema";
import { minusTrackUpdateSchema } from "@/lib/validations/materials";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { deleteFile, getSignedDownloadUrl } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string; trackId: string }>;
}

// Check if user has access to a track
async function checkTrackAccess(
  trackId: string,
  userId: string,
  showId: string
): Promise<{ hasAccess: boolean; canDownload: boolean }> {
  // Check for direct user permission
  const userPermission = await db.query.materialPermissions.findFirst({
    where: and(
      eq(materialPermissions.materialType, "track"),
      eq(materialPermissions.materialId, trackId),
      eq(materialPermissions.grantedToUserId, userId),
      eq(materialPermissions.canView, true),
      or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
    ),
  });

  if (userPermission) {
    return { hasAccess: true, canDownload: userPermission.canDownload };
  }

  // Check for role-based permission
  const userRoles = await db
    .select({ roleId: castingAssignments.roleId })
    .from(castingAssignments)
    .where(eq(castingAssignments.showId, showId));

  for (const role of userRoles) {
    const rolePermission = await db.query.materialPermissions.findFirst({
      where: and(
        eq(materialPermissions.materialType, "track"),
        eq(materialPermissions.materialId, trackId),
        eq(materialPermissions.grantedToRoleId, role.roleId),
        eq(materialPermissions.canView, true),
        or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
      ),
    });

    if (rolePermission) {
      return { hasAccess: true, canDownload: rolePermission.canDownload };
    }
  }

  // Check for all_cast permission
  const allCastPermission = await db.query.materialPermissions.findFirst({
    where: and(
      eq(materialPermissions.materialType, "track"),
      eq(materialPermissions.materialId, trackId),
      eq(materialPermissions.grantType, "all_cast"),
      eq(materialPermissions.canView, true),
      or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
    ),
  });

  if (allCastPermission) {
    return { hasAccess: true, canDownload: allCastPermission.canDownload };
  }

  return { hasAccess: false, canDownload: false };
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, trackId } = await params;
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";
    const stream = url.searchParams.get("stream") === "true";

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const track = await db.query.minusTracks.findFirst({
      where: and(eq(minusTracks.id, trackId), eq(minusTracks.showId, showId)),
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if user is a producer for this show
    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    const isProducer = producerProfile?.id === show.organizationId;

    if (!isProducer) {
      // Check permissions for non-producers
      const access = await checkTrackAccess(trackId, session.user.id, showId);

      if (!access.hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (download && !access.canDownload) {
        return NextResponse.json({ error: "Download not permitted" }, { status: 403 });
      }
    }

    // Log access
    const headers = request.headers;
    await db.insert(materialAccessLogs).values({
      materialType: "track",
      materialId: trackId,
      userId: session.user.id,
      action: download ? "download" : stream ? "stream" : "view",
      ipAddress: headers.get("x-forwarded-for") ?? headers.get("x-real-ip"),
      userAgent: headers.get("user-agent"),
    });

    // Generate signed URL for streaming/download
    // Short expiry for streaming to prevent link sharing
    const signedUrl = await getSignedDownloadUrl(
      track.s3Key,
      "document",
      download ? 3600 : 300 // 1 hour for download, 5 min for streaming
    );

    const accessCheck = isProducer
      ? { hasAccess: true, canDownload: true }
      : await checkTrackAccess(trackId, session.user.id, showId);

    return NextResponse.json({
      track,
      url: signedUrl,
      canDownload: accessCheck.canDownload,
    });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json({ error: "Failed to fetch track" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, trackId } = await params;

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

    const track = await db.query.minusTracks.findFirst({
      where: and(eq(minusTracks.id, trackId), eq(minusTracks.showId, showId)),
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = minusTrackUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updatedTrack] = await db
      .update(minusTracks)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(minusTracks.id, trackId))
      .returning();

    return NextResponse.json({ track: updatedTrack });
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, trackId } = await params;

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

    const track = await db.query.minusTracks.findFirst({
      where: and(eq(minusTracks.id, trackId), eq(minusTracks.showId, showId)),
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Delete permissions for this track
    await db
      .delete(materialPermissions)
      .where(
        and(
          eq(materialPermissions.materialType, "track"),
          eq(materialPermissions.materialId, trackId)
        )
      );

    // Delete file from S3
    await deleteFile(track.s3Key, "document");

    // Delete track record
    await db.delete(minusTracks).where(eq(minusTracks.id, trackId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track:", error);
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
  }
}
